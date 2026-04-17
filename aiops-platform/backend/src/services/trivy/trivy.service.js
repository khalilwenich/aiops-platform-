import fs from 'fs/promises';
import { gitlabService } from '../gitlab/gitlab.service.js';
import { createHttpClient } from '../../utils/httpClient.js';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

class TrivyService {
  async parseReport(reportPath) {
    try {
      const raw = await fs.readFile(reportPath, 'utf8');
      const report = JSON.parse(raw);
      return this._extractVulnerabilities(report);
    } catch (error) {
      logger.error('Failed to parse Trivy report', {
        reportPath,
        error: error.message,
      });
      return [];
    }
  }

  async fetchFromGitlabArtifact(projectId, pipelineId) {
    try {
      const client = createHttpClient(config.gitlab.baseUrl, config.gitlab.token);
      const jobs = await gitlabService.fetchPipelineJobs(projectId, pipelineId);
      const trivyJob = jobs?.find(
        j => j.name?.toLowerCase().includes('trivy') ||
             j.name?.toLowerCase().includes('security')
      );

      if (!trivyJob) {
        logger.info('No Trivy job found in pipeline', { projectId, pipelineId });
        return [];
      }

      const response = await client.get(
        `/api/v4/projects/${encodeURIComponent(projectId)}/jobs/${trivyJob.id}/artifacts/trivy-report.json`
      );
      return this._extractVulnerabilities(response.data);
    } catch (error) {
      logger.warn('Failed to fetch Trivy artifact from GitLab', {
        projectId,
        pipelineId,
        error: error.message,
      });
      return [];
    }
  }

  _extractVulnerabilities(report) {
    const vulns = [];
    const results = report?.Results || report?.results || [];
    for (const result of results) {
      const vulnerabilities = result.Vulnerabilities || result.vulnerabilities || [];
      for (const vuln of vulnerabilities) {
        vulns.push(this.normalizeVuln(vuln));
      }
    }
    return vulns;
  }

  normalizeVuln(rawVuln) {
    return {
      cveId: rawVuln.VulnerabilityID || rawVuln.vulnerabilityId || '',
      packageName: rawVuln.PkgName || rawVuln.pkgName || '',
      severity: (rawVuln.Severity || rawVuln.severity || 'UNKNOWN').toUpperCase(),
      title: rawVuln.Title || rawVuln.title || rawVuln.VulnerabilityID || '',
      description: rawVuln.Description || rawVuln.description || '',
      fixedVersion: rawVuln.FixedVersion || rawVuln.fixedVersion || '',
      publishedDate:
        rawVuln.PublishedDate || rawVuln.publishedDate
          ? new Date(rawVuln.PublishedDate || rawVuln.publishedDate)
          : null,
    };
  }

  groupBySeverity(vulns) {
    return vulns.reduce(
      (acc, vuln) => {
        const key = vuln.severity || 'UNKNOWN';
        if (!acc[key]) acc[key] = [];
        acc[key].push(vuln);
        return acc;
      },
      { CRITICAL: [], HIGH: [], MEDIUM: [], LOW: [], UNKNOWN: [] }
    );
  }
}

export const trivyService = new TrivyService();
