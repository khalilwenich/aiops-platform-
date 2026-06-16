import { createHttpClient }      from '../utils/httpClient.js';
import { config }                from '../config/index.js';
import { Analysis }              from '../models/Analysis.model.js';
import { groqClient }            from '../ai/groq.client.js';
import { buildMRCommentPrompt }  from '../ai/prompts/mrComment.prompt.js';
import { logger }                from '../utils/logger.js';

class MRCommentService {
  buildCommentBody(analysis, pipeline, plainExplanation) {
    const riskEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' }[analysis.riskLevel] || '⚪';
    const errorLabels = {
      build_failure:          '🔨 Build Failure',
      test_failure:           '🧪 Test Failure',
      dependency_issue:       '📦 Dependency Issue',
      security_vulnerability: '🛡️ Security Vulnerability',
      configuration_error:    '⚙️ Configuration Error',
      unknown:                '❓ Unknown',
    };

    const fixes = analysis.suggestedFixes?.slice(0, 2).map(fix => {
      let block = `**${(fix.priority || 'medium').toUpperCase()}:** ${fix.description}`;
      if (fix.command) block += `\n\`\`\`bash\n${fix.command}\n\`\`\``;
      return block;
    }).join('\n\n') || 'No specific fixes suggested.';

    const affectedBlock = analysis.affectedFiles?.length
      ? `### 📁 Affected Files\n${analysis.affectedFiles.map(f => `- \`${f}\``).join('\n')}\n\n`
      : '';

    const processingTime = analysis.processingTime
      ? `${(analysis.processingTime / 1000).toFixed(1)}s`
      : 'N/A';

    const explanationBlock = plainExplanation ? `> ${plainExplanation}\n\n---\n\n` : '';

    return `## 🤖 AIOps Analysis — Pipeline #${pipeline.pipelineId} Failed

${explanationBlock}**Type:** ${errorLabels[analysis.errorType] || analysis.errorType}
**Risk Level:** ${riskEmoji} ${(analysis.riskLevel || 'medium').toUpperCase()}
**AI Confidence:** ${Math.round((analysis.confidence || 0) * 100)}%

---

### 📋 Root Cause
${analysis.rootCause}

### 💡 Suggested Fixes
${fixes}

${affectedBlock}---
*Analyzed in ${processingTime} by AIOps Platform — Capgemini Altran Telnet Corporation Tunisie*`;
  }

  async postComment(projectId, mergeRequestIid, analysis, pipeline) {
    if (!config.gitlab?.token) {
      logger.warn('GitLab token not configured — skipping MR comment');
      return null;
    }
    const plainExplanation = await groqClient
      .complete(buildMRCommentPrompt(analysis))
      .catch(err => {
        logger.warn('Could not generate plain-language MR explanation', { error: err.message });
        return null;
      });
    const comment = this.buildCommentBody(analysis, pipeline, plainExplanation);
    try {
      const client = createHttpClient(config.gitlab.baseUrl, config.gitlab.token);
      const response = await client.post(
        `/api/v4/projects/${projectId}/merge_requests/${mergeRequestIid}/notes`,
        { body: comment }
      );
      logger.info('MR comment posted', { projectId, mergeRequestIid });
      return response.data;
    } catch (error) {
      logger.error('Failed to post MR comment', { error: error.message });
      return null;
    }
  }

  async findMRForBranch(projectId, branch) {
    if (!config.gitlab?.token) return null;
    try {
      const client = createHttpClient(config.gitlab.baseUrl, config.gitlab.token);
      const response = await client.get(
        `/api/v4/projects/${projectId}/merge_requests`,
        { params: { source_branch: branch, state: 'opened' } }
      );
      return response.data?.[0] || null;
    } catch {
      return null;
    }
  }

  async analyzeMRRisk(projectId, mergeRequestIid) {
    if (!config.gitlab?.token) return null;
    try {
      const client = createHttpClient(config.gitlab.baseUrl, config.gitlab.token);
      const [mrRes, changesRes] = await Promise.all([
        client.get(`/api/v4/projects/${projectId}/merge_requests/${mergeRequestIid}`),
        client.get(`/api/v4/projects/${projectId}/merge_requests/${mergeRequestIid}/changes`),
      ]);

      const changedFiles = (changesRes.data?.changes || []).map(c => c.new_path);
      const analyses = await Analysis.find({
        projectId,
        affectedFiles: { $in: changedFiles },
      }).lean();

      const riskFactors = {
        changedFilesCount:       changedFiles.length,
        historicallyRiskyFiles:  changedFiles.filter(f => analyses.some(a => a.affectedFiles?.includes(f))).length,
        linesChanged:            (changesRes.data?.changes || []).reduce((s, c) => s + (c.diff?.split('\n').length || 0), 0),
        hasTestChanges:          changedFiles.some(f => f.includes('test') || f.includes('spec')),
        hasDepsChanges:          changedFiles.some(f => ['package.json','requirements.txt','pom.xml','package-lock.json'].includes(f)),
      };

      let riskScore = 0;
      riskScore += Math.min(riskFactors.changedFilesCount * 5, 30);
      riskScore += riskFactors.historicallyRiskyFiles * 15;
      riskScore += riskFactors.hasDepsChanges ? 25 : 0;
      riskScore += !riskFactors.hasTestChanges ? 20 : 0;
      riskScore = Math.min(riskScore, 100);

      const riskLevel = riskScore >= 70 ? 'High' : riskScore >= 40 ? 'Medium' : 'Low';
      const riskEmoji = riskScore >= 70 ? '🔴' : riskScore >= 40 ? '🟡' : '🟢';

      const advice = riskScore >= 70
        ? '> ⚠️ **High risk merge** — Consider requesting additional review.'
        : riskScore >= 40
        ? '> 💡 **Medium risk** — Run full test suite before merging.'
        : '> ✅ **Low risk merge** — Looks good to go!';

      const comment = `## 🔮 AIOps Pre-Merge Risk Analysis

**Risk Score:** ${riskEmoji} ${riskLevel} (${riskScore}/100)

| Factor | Value | Impact |
|--------|-------|--------|
| Files changed | ${riskFactors.changedFilesCount} | ${riskFactors.changedFilesCount > 10 ? '⚠️ High' : '✅ OK'} |
| Historically risky files | ${riskFactors.historicallyRiskyFiles} | ${riskFactors.historicallyRiskyFiles > 0 ? '⚠️ Caution' : '✅ None'} |
| Dependency changes | ${riskFactors.hasDepsChanges ? 'Yes' : 'No'} | ${riskFactors.hasDepsChanges ? '⚠️ Review' : '✅ OK'} |
| Test coverage | ${riskFactors.hasTestChanges ? 'Updated' : 'Not updated'} | ${riskFactors.hasTestChanges ? '✅ Good' : '⚠️ Add tests'} |

${advice}

*Pre-merge analysis by AIOps Platform — Capgemini Altran Telnet Corporation Tunisie*`;

      await client.post(
        `/api/v4/projects/${projectId}/merge_requests/${mergeRequestIid}/notes`,
        { body: comment }
      );

      return { riskScore, riskLevel, riskFactors };
    } catch (error) {
      logger.error('MR risk analysis failed', { error: error.message });
      return null;
    }
  }
}

export const mrCommentService = new MRCommentService();
