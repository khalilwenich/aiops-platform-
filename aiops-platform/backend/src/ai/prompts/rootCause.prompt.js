export function buildRootCausePrompt(normalizedData) {
  const { pipelineContext, errorSignals } = normalizedData;

  const logSection = errorSignals.logSnippets
    .map(
      job => `
### Job: ${job.jobName} (Stage: ${job.stage})
${job.errorLines.join('\n')}
`
    )
    .join('\n---\n');

  const sonarSection =
    errorSignals.criticalIssues.length > 0
      ? errorSignals.criticalIssues
          .map(
            i =>
              `- [${i.severity}] ${i.message} (${i.component}, rule: ${i.rule})`
          )
          .join('\n')
      : 'No critical SonarQube issues found.';

  const vulnSection =
    errorSignals.criticalVulns.length > 0
      ? errorSignals.criticalVulns
          .map(
            v =>
              `- [${v.severity}] ${v.cveId} in ${v.packageName} — ${v.title} (fix: ${v.fixedVersion || 'N/A'})`
          )
          .join('\n')
      : 'No critical/high vulnerabilities found.';

  const commitsSection =
    errorSignals.recentCommits.length > 0
      ? errorSignals.recentCommits
          .map(
            c =>
              `- ${c.hash} by ${c.author} at ${c.timestamp}: ${c.message}`
          )
          .join('\n')
      : 'No recent commits available.';

  return `You are a senior DevOps engineer and SRE expert with 15 years of experience.
Analyze this CI/CD pipeline failure and identify the root cause.

## Pipeline Context
Project: ${pipelineContext.projectId} | Branch: ${pipelineContext.ref} | Triggered by: ${pipelineContext.triggeredBy}
Failed stages: ${(pipelineContext.failedStages || []).join(', ') || 'unknown'}

## Error Logs (most recent failures)
${logSection || 'No logs available.'}

## Code Quality Issues (SonarQube - Critical only)
${sonarSection}

## Security Vulnerabilities (Trivy - Critical/High)
${vulnSection}

## Recent Commits (last 10)
${commitsSection}

Respond ONLY with a valid JSON object. No markdown, no explanation outside JSON.
{
  "errorType": "build_failure | test_failure | dependency_issue | security_vulnerability | unknown",
  "rootCause": "Precise technical description in 1-2 sentences",
  "summary": "3-line max human-readable summary of what happened and why",
  "confidence": 0.0,
  "riskLevel": "critical | high | medium | low",
  "affectedFiles": ["path/to/file.js"],
  "suggestedFixes": [
    {
      "priority": "high | medium | low",
      "description": "What to do",
      "command": "exact CLI command if applicable",
      "codeHint": "code snippet if applicable"
    }
  ],
  "relatedCommit": "commit hash if a commit likely caused this, else null"
}`;
}
