/**
 * Message service unit tests with mocked MongoDB.
 */

jest.mock('../models/Message', () => {
  const mockSave = jest.fn().mockResolvedValue(true);
  const mockDeleteMany = jest.fn().mockResolvedValue({ deletedCount: 5 });
  const mockFind = jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([
      { _id: 'm1', type: 'text', content: 'Hello' },
    ]),
  });

  function MockMessage(data) {
    Object.assign(this, data);
    this._id = 'mock_msg_id';
    this.createdAt = new Date();
    this.save = mockSave;
  }

  MockMessage.find = mockFind;
  MockMessage.deleteMany = mockDeleteMany;

  return MockMessage;
});

const { saveMessage, getRecentMessages, deleteSessionMessages } = require('../services/messageService');

describe('MessageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('saveMessage rejects empty text content', async () => {
    await expect(
      saveMessage({
        sessionId: 'sess1',
        senderParticipantId: 'p1',
        senderName: 'Alice',
        type: 'text',
        content: '   ',
      })
    ).rejects.toThrow(/empty/i);
  });

  test('saveMessage rejects content exceeding max length', async () => {
    await expect(
      saveMessage({
        sessionId: 'sess1',
        senderParticipantId: 'p1',
        senderName: 'Alice',
        type: 'text',
        content: 'x'.repeat(2001),
      })
    ).rejects.toThrow(/too long/i);
  });

  test('saveMessage persists valid message', async () => {
    const msg = await saveMessage({
      sessionId: 'sess1',
      senderParticipantId: 'p1',
      senderName: 'Alice',
      type: 'text',
      content: 'Hello world',
    });

    expect(msg).toBeDefined();
    expect(msg.type).toBe('text');
  });

  test('getRecentMessages returns messages array', async () => {
    const msgs = await getRecentMessages('sess1');
    expect(Array.isArray(msgs)).toBe(true);
    expect(msgs.length).toBeGreaterThan(0);
  });

  test('deleteSessionMessages removes messages', async () => {
    const count = await deleteSessionMessages('sess1');
    expect(count).toBe(5);
  });
});
