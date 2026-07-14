import { Incident } from '../../models/Incident.model.js';
import { logger }   from '../../utils/logger.js';
import { projectFilter } from '../middlewares/teamAccess.middleware.js';

export async function getAll(req, res, next) {
  try {
    const { status, severity, projectId, page = 1, limit = 20 } = req.query;
    const filter = { ...projectFilter(req) };
    if (status)    filter.status    = status;
    if (severity)  filter.severity  = severity;
    if (projectId) filter.projectId = projectId;

    const skip = (Number(page) - 1) * Number(limit);
    const [incidents, total] = await Promise.all([
      Incident.find(filter)
        .sort({ detectedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('analysis')
        .populate('assignedTo', 'name email')
        .lean(),
      Incident.countDocuments(filter),
    ]);

    res.json({ incidents, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('analysis')
      .populate('assignedTo', 'name email')
      .lean();
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json(incident);
  } catch (error) {
    next(error);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { status, message } = req.body;
    const allowed = ['open', 'acknowledged', 'investigating', 'resolved'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${allowed.join(', ')}` });
    }

    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    incident.status = status;
    if (status === 'acknowledged') {
      incident.acknowledgedAt = new Date();
    } else if (status === 'resolved') {
      incident.resolvedAt = new Date();
      incident.mttr = Math.round((incident.resolvedAt - incident.detectedAt) / (1000 * 60));
    }

    const actionLabel = {
      acknowledged:  'acknowledged',
      investigating: 'investigating',
      resolved:      'resolved',
      open:          'reopened',
    }[status] || 'status_update';

    incident.timeline.push({
      timestamp: new Date(),
      actor:     req.user?.email || 'unknown',
      action:    actionLabel,
      message:   message || `Status changed to ${status}`,
    });

    await incident.save();
    await incident.populate('assignedTo', 'name email');
    logger.info('Incident status updated', { id: incident._id, status });
    res.json(incident.toObject());
  } catch (error) {
    next(error);
  }
}

export async function assign(req, res, next) {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const targetUserId = req.body.userId || req.user.id;
    const alreadyAssigned = incident.assignedTo?.toString() === targetUserId;

    if (alreadyAssigned) {
      incident.assignedTo = undefined;
      incident.assignedAt = undefined;
      incident.timeline.push({
        timestamp: new Date(),
        actor:     req.user.email,
        action:    'unassigned',
        message:   `${req.user.email} unassigned the incident`,
      });
    } else {
      incident.assignedTo = targetUserId;
      incident.assignedAt = new Date();
      incident.timeline.push({
        timestamp: new Date(),
        actor:     req.user.email,
        action:    'assigned',
        message:   `Assigned to ${req.user.email}`,
      });
    }

    await incident.save();
    await incident.populate('assignedTo', 'name email');
    logger.info('Incident assignment updated', { id: incident._id, assignedTo: incident.assignedTo });
    res.json(incident.toObject());
  } catch (error) {
    next(error);
  }
}

export async function addComment(req, res, next) {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    incident.timeline.push({
      timestamp: new Date(),
      actor:     req.user?.email || 'unknown',
      action:    'comment',
      message,
    });

    await incident.save();
    res.json(incident.toObject());
  } catch (error) {
    next(error);
  }
}

export async function generatePostMortem(req, res, next) {
  try {
    const incident = await Incident.findById(req.params.id).populate('analysis').lean();
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const postMortem = `## Post-Mortem — ${incident.incidentId}

### Summary
Incident detected on ${new Date(incident.detectedAt).toLocaleString('fr-TN')} in project **${incident.projectName}**.
${incident.mttr ? `Resolved in **${incident.mttr} minutes**.` : 'Currently unresolved.'}

### Root Cause
${incident.analysis?.rootCause || 'Root cause analysis pending.'}

### Impact
- Pipeline ${incident.pipelineId} failed on branch linked to this incident.
- Severity: **${incident.severity?.toUpperCase() || 'UNKNOWN'}**

### Resolution Steps
${incident.timeline.filter(t => t.action === 'resolved' || t.action === 'comment').map(t => `- [${t.actor}] ${t.message}`).join('\n') || '- No resolution steps recorded.'}

### Prevention Recommendations
${incident.analysis?.suggestedFixes?.slice(0, 3).map(f => `- ${f.description}`).join('\n') || '- Review the pipeline configuration and add automated tests.'}
- Add pre-commit hooks to catch this class of error earlier.
- Consider adding this case to the AIOps Knowledge Base.

---
*Generated by AIOps Platform — Capgemini Altran Telnet Corporation Tunisie*`;

    await Incident.updateOne({ _id: incident._id }, { $set: { postMortem } });
    res.json({ postMortem });
  } catch (error) {
    next(error);
  }
}
