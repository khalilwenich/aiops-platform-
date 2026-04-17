import { createHttpClient } from '../../utils/httpClient.js';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

class SonarQubeService {
  constructor() {
    if (config.sonarqube.baseUrl) {
      this.client = createHttpClient(config.sonarqube.baseUrl, null);
      this.token = config.sonarqube.token;
      this.enabled = true;
    } else {
      this.enabled = false;
      logger.warn('SonarQube not configured — SONARQUBE_URL missing');
    }
  }

  _authHeaders() {
    const encoded = Buffer.from(`${this.token}:`).toString('base64');
    return { Authorization: `Basic ${encoded}` };
  }

  async fetchIssues(projectKey) {
    if (!this.enabled) return { critical: [], major: [], total: 0 };

    try {
      const response = await this.client.get('/api/issues/search', {
        params: {
          componentKeys: projectKey,
          severities: 'CRITICAL,MAJOR',
          resolved: 'false',
          ps: 100,
        },
        headers: this._authHeaders(),
      });

      const issues = response.data.issues || [];
      return {
        critical: issues.filter(i => i.severity === 'CRITICAL'),
        major: issues.filter(i => i.severity === 'MAJOR'),
        total: response.data.total || 0,
      };
    } catch (error) {
      logger.error('SonarQube fetchIssues failed', {
        projectKey,
        error: error.message,
      });
      return { critical: [], major: [], total: 0 };
    }
  }

  async fetchMeasures(projectKey) {
    if (!this.enabled) return {};

    try {
      const metrics = 'bugs,code_smells,coverage,duplicated_lines_density,vulnerabilities,security_hotspots';
      const response = await this.client.get('/api/measures/component', {
        params: { component: projectKey, metricKeys: metrics },
        headers: this._authHeaders(),
      });

      const measures = response.data?.component?.measures || [];
      const result = {};
      for (const m of measures) {
        result[m.metric] = parseFloat(m.value) || 0;
      }
      return result;
    } catch (error) {
      logger.error('SonarQube fetchMeasures failed', {
        projectKey,
        error: error.message,
      });
      return {};
    }
  }

  async fetchQualityGate(projectKey) {
    if (!this.enabled) return { status: 'UNKNOWN', conditions: [] };

    try {
      const response = await this.client.get('/api/qualitygates/project_status', {
        params: { projectKey },
        headers: this._authHeaders(),
      });

      const projectStatus = response.data?.projectStatus || {};
      return {
        status: projectStatus.status || 'UNKNOWN',
        conditions: projectStatus.conditions || [],
      };
    } catch (error) {
      logger.error('SonarQube fetchQualityGate failed', {
        projectKey,
        error: error.message,
      });
      return { status: 'UNKNOWN', conditions: [] };
    }
  }
}

export const sonarqubeService = new SonarQubeService();
