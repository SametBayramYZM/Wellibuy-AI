// Token Blacklist Service - Mock Implementation

const blacklistedTokens = new Set();

const checkTokenBlacklist = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token && blacklistedTokens.has(token)) {
    return res.status(401).json({ error: 'Token has been revoked' });
  }
  next();
};

module.exports = {
  checkTokenBlacklist,

  addToBlacklist: (token, expiresAt) => {
    blacklistedTokens.add(token);
    // Optional: Clear expired tokens
    if (expiresAt) {
      setTimeout(() => blacklistedTokens.delete(token), expiresAt - Date.now());
    }
  },

  isBlacklisted: (token) => {
    return blacklistedTokens.has(token);
  },

  getBlacklist: () => {
    return Array.from(blacklistedTokens);
  },

  clearBlacklist: () => {
    blacklistedTokens.clear();
  }
};
