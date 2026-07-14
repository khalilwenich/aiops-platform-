import { Team } from '../../models/Team.model.js';
import { User } from '../../models/User.model.js';
import { logger } from '../../utils/logger.js';

export async function getAll(req, res, next) {
  try {
    const teams = await Team.find()
      .populate('members.userId', 'name email role')
      .populate('createdBy', 'name email')
      .lean();
    res.json({ teams });
  } catch (err) { next(err); }
}

export async function getById(req, res, next) {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members.userId', 'name email role')
      .lean();
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) { next(err); }
}

export async function create(req, res, next) {
  try {
    const { name, description, projectIds = [], memberIds = [] } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const members = memberIds.map(id => ({ userId: id, role: 'member' }));
    const team = await Team.create({
      name,
      description,
      projectIds,
      members,
      createdBy: req.user.id,
    });
    logger.info('Team created', { teamId: team._id, name, by: req.user.email });
    res.status(201).json(team);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Team name already exists' });
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { name, description, projectIds } = req.body;
    const patch = {};
    if (name !== undefined) patch.name = name;
    if (description !== undefined) patch.description = description;
    if (projectIds !== undefined) patch.projectIds = projectIds;

    const team = await Team.findByIdAndUpdate(req.params.id, patch, { new: true })
      .populate('members.userId', 'name email role');
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) { next(err); }
}

export async function remove(req, res, next) {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    logger.info('Team deleted', { teamId: req.params.id, by: req.user.email });
    res.json({ message: 'Team deleted' });
  } catch (err) { next(err); }
}

export async function addMember(req, res, next) {
  try {
    const { userId, role = 'member' } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const already = team.members.find(m => String(m.userId) === String(userId));
    if (already) return res.status(409).json({ error: 'User already in team' });

    team.members.push({ userId, role });
    await team.save();
    await team.populate('members.userId', 'name email role');
    res.json(team);
  } catch (err) { next(err); }
}

export async function removeMember(req, res, next) {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const before = team.members.length;
    team.members = team.members.filter(m => String(m.userId) !== req.params.userId);
    if (team.members.length === before) {
      return res.status(404).json({ error: 'Member not found in team' });
    }
    await team.save();
    await team.populate('members.userId', 'name email role');
    res.json(team);
  } catch (err) { next(err); }
}

export async function getMyTeams(req, res, next) {
  try {
    const teams = await Team.find({ 'members.userId': req.user.id })
      .select('name description projectIds')
      .lean();
    res.json({ teams });
  } catch (err) { next(err); }
}
