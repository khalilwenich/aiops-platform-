import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../models/User.model.js', () => {
  function User(data) {
    Object.assign(this, data);
    this._id = 'new-user-id';
    this.save = vi.fn().mockResolvedValue(this);
  }
  User.find = vi.fn();
  User.findById = vi.fn();
  return { User };
});

vi.mock('../../utils/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { User } from '../../models/User.model.js';
import { create, update, resetPassword, changeOwnPassword } from './users.controller.js';

function mockRes() {
  return {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
}

describe('users.controller.create', () => {
  it('rejects when email or name is missing', async () => {
    const req = { body: { email: '', name: '' }, user: { id: 'admin-1', email: 'admin@x.com' } };
    const res = mockRes();
    await create(req, res, vi.fn());
    expect(res.statusCode).toBe(400);
  });

  it('rejects an invalid role', async () => {
    const req = { body: { email: 'a@b.com', name: 'A B', role: 'superuser' }, user: { id: 'admin-1', email: 'admin@x.com' } };
    const res = mockRes();
    await create(req, res, vi.fn());
    expect(res.statusCode).toBe(400);
  });

  it('creates a user with a generated temp password and mustChangePassword true', async () => {
    const req = { body: { email: 'Jane@Capgemini.com', name: 'Jane Doe', role: 'analyst' }, user: { id: 'admin-1', email: 'admin@x.com' } };
    const res = mockRes();
    await create(req, res, vi.fn());

    expect(res.statusCode).toBe(201);
    expect(res.payload.user.email).toBe('jane@capgemini.com');
    expect(res.payload.user.role).toBe('analyst');
    expect(res.payload.tempPassword).toBeTypeOf('string');
    expect(res.payload.tempPassword.length).toBeGreaterThanOrEqual(10);
  });
});

describe('users.controller.update', () => {
  beforeEach(() => { User.findById.mockReset(); });

  it('returns 404 when the user does not exist', async () => {
    User.findById.mockResolvedValue(null);
    const req = { params: { id: 'missing' }, body: { role: 'admin' }, user: { id: 'admin-1' } };
    const res = mockRes();
    await update(req, res, vi.fn());
    expect(res.statusCode).toBe(404);
  });

  it('prevents an admin from deactivating their own account', async () => {
    const target = { _id: { toString: () => 'admin-1' }, role: 'admin', isActive: true, save: vi.fn() };
    User.findById.mockResolvedValue(target);
    const req = { params: { id: 'admin-1' }, body: { isActive: false }, user: { id: 'admin-1' } };
    const res = mockRes();
    await update(req, res, vi.fn());
    expect(res.statusCode).toBe(400);
    expect(target.save).not.toHaveBeenCalled();
  });

  it('updates the role of another user', async () => {
    const target = { _id: { toString: () => 'user-2' }, email: 'u2@x.com', name: 'U2', role: 'viewer', isActive: true, save: vi.fn().mockResolvedValue() };
    User.findById.mockResolvedValue(target);
    const req = { params: { id: 'user-2' }, body: { role: 'analyst' }, user: { id: 'admin-1', email: 'admin@x.com' } };
    const res = mockRes();
    await update(req, res, vi.fn());
    expect(target.role).toBe('analyst');
    expect(res.payload.user.role).toBe('analyst');
  });
});

describe('users.controller.resetPassword', () => {
  it('generates a new temp password and flags mustChangePassword', async () => {
    const target = { _id: 'user-3', email: 'u3@x.com', save: vi.fn().mockResolvedValue() };
    User.findById.mockResolvedValue(target);
    const req = { params: { id: 'user-3' }, user: { id: 'admin-1', email: 'admin@x.com' } };
    const res = mockRes();
    await resetPassword(req, res, vi.fn());
    expect(target.mustChangePassword).toBe(true);
    expect(res.payload.tempPassword).toBeTypeOf('string');
  });
});

describe('users.controller.changeOwnPassword', () => {
  it('rejects a new password shorter than 8 characters', async () => {
    const req = { body: { currentPassword: 'x', newPassword: 'short' }, user: { id: 'user-1' } };
    const res = mockRes();
    await changeOwnPassword(req, res, vi.fn());
    expect(res.statusCode).toBe(400);
  });

  it('rejects when the current password is wrong', async () => {
    const target = { comparePassword: vi.fn().mockResolvedValue(false), save: vi.fn() };
    User.findById.mockReturnValue({ select: vi.fn().mockResolvedValue(target) });
    const req = { body: { currentPassword: 'wrong', newPassword: 'longenough1' }, user: { id: 'user-1' } };
    const res = mockRes();
    await changeOwnPassword(req, res, vi.fn());
    expect(res.statusCode).toBe(401);
  });

  it('updates the password and clears mustChangePassword on success', async () => {
    const target = { comparePassword: vi.fn().mockResolvedValue(true), save: vi.fn().mockResolvedValue(), mustChangePassword: true };
    User.findById.mockReturnValue({ select: vi.fn().mockResolvedValue(target) });
    const req = { body: { currentPassword: 'temp123', newPassword: 'longenough1' }, user: { id: 'user-1', email: 'u1@x.com' } };
    const res = mockRes();
    await changeOwnPassword(req, res, vi.fn());
    expect(target.mustChangePassword).toBe(false);
    expect(res.payload.message).toBe('Password updated');
  });
});
