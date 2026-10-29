export const CHAT_LIMITS = {
  maxMessages: 24,
  maxMessageChars: 2000,
  maxTotalChars: 12000,
  maxOutputTokens: 700,
  maxToolRounds: 2,
  maxProducts: 6,
  requestTimeoutMs: 45000,
};

export const RATE_LIMITS = {
  chat: { limit: 20, windowMs: 10 * 60 * 1000 },
  lead: { limit: 5, windowMs: 60 * 60 * 1000 },
  feedback: { limit: 20, windowMs: 60 * 60 * 1000 },
  events: { limit: 200, windowMs: 60 * 60 * 1000 },
};
