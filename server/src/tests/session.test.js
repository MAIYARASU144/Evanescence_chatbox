/**
 * Session service unit tests.
 * These tests mock MongoDB to avoid needing a real connection.
 */

jest.mock('../models/Session', () => {
  const mockSave = jest.fn().mockResolvedValue(true);
  const mockFindOne = jest.fn();
  const mockFindOneAndUpdate = jest.fn();
  const mockFindById = jest.fn();

  function MockSession(data) {
    Object.assign(this, data);
    this._id = 'mock_session_id';
    this.save = mockSave;
  }

  MockSession.findOne = mockFindOne;
  MockSession.findOneAndUpdate = mockFindOneAndUpdate;
  MockSession.findById = mockFindById;

  return MockSession;
});

const Session = require('../models/Session');
const { createSession, joinSession, verifyParticipantToken } = require('../services/sessionService');

describe('SessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('creates a session and returns tokens', async () => {
      const result = await createSession({
        temporaryName: 'TestUser',
        maxParticipants: 5,
        expiresInHours: 2,
        pin: null,
      });

      expect(result.sessionToken).toBeDefined();
      expect(result.participantId).toMatch(/^p_/);
      expect(result.participantToken).toBeDefined();
      expect(result.pinEnabled).toBe(false);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('hashes PIN when provided', async () => {
      const result = await createSession({
        temporaryName: 'TestUser',
        maxParticipants: 5,
        expiresInHours: 2,
        pin: '1234',
      });

      expect(result.pinEnabled).toBe(true);
    });

    it('rejects sessions exceeding max duration', async () => {
      await expect(
        createSession({
          temporaryName: 'TestUser',
          maxParticipants: 5,
          expiresInHours: 100,
          pin: null,
        })
      ).rejects.toThrow(/cannot exceed/i);
    });
  });

  describe('joinSession', () => {
    it('rejects when session not found', async () => {
      Session.findOne.mockResolvedValue(null);

      await expect(
        joinSession({ token: 'nonexistent', temporaryName: 'User', pin: null })
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });

    it('rejects expired session', async () => {
      Session.findOne
        .mockResolvedValueOnce(null) // active query
        .mockResolvedValueOnce({ status: 'expired' }); // expired query

      await expect(
        joinSession({ token: 'expired_token', temporaryName: 'User', pin: null })
      ).rejects.toMatchObject({ code: 'EXPIRED' });
    });

    it('rejects destroyed session', async () => {
      Session.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ status: 'destroyed' });

      await expect(
        joinSession({ token: 'dead_token', temporaryName: 'User', pin: null })
      ).rejects.toMatchObject({ code: 'DESTROYED' });
    });

    it('rejects when session is full (findOneAndUpdate returns null)', async () => {
      const fakeSession = {
        _id: 'sid',
        status: 'active',
        pinEnabled: false,
        maxParticipants: 2,
        expiresAt: new Date(Date.now() + 100000),
        participants: [{ participantId: 'p1' }, { participantId: 'p2' }],
      };

      Session.findOne.mockResolvedValue(fakeSession);
      Session.findOneAndUpdate.mockResolvedValue(null); // full — no slot

      await expect(
        joinSession({ token: 'fullroom', temporaryName: 'Third', pin: null })
      ).rejects.toMatchObject({ code: 'FULL' });
    });
  });
});
