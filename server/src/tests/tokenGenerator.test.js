const { generateSecureToken, generateParticipantId, generateStorageKey } = require('../utils/tokenGenerator');

describe('Token Generator', () => {
  test('generateSecureToken produces URL-safe base64 string', () => {
    const token = generateSecureToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThanOrEqual(40);
    // base64url chars only
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  test('generateSecureToken produces unique tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateSecureToken()));
    expect(tokens.size).toBe(100);
  });

  test('generateParticipantId starts with p_ prefix', () => {
    const id = generateParticipantId();
    expect(id).toMatch(/^p_[0-9a-f]{32}$/);
  });

  test('generateStorageKey includes sessionId in path', () => {
    const key = generateStorageKey('mysessionid123');
    expect(key).toContain('sessions/mysessionid123/media/');
    expect(key).toMatch(/^sessions\/[^/]+\/media\/[0-9a-f]{32}$/);
  });

  test('generateStorageKey produces unique keys', () => {
    const keys = new Set(Array.from({ length: 100 }, () => generateStorageKey('sess1')));
    expect(keys.size).toBe(100);
  });
});
