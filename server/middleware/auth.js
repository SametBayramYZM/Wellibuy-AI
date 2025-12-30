/**
 * AUTHENTICATION MIDDLEWARE
 * 
 * JWT token doğrulama ve kullanıcı yetkilendirmesi
 */

const jwt = require('jsonwebtoken');
const validator = require('validator');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * JWT Token Oluştur
 */
function generateToken(userId, email) {
  return jwt.sign(
    { userId, email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * JWT Token Doğrula
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Geçersiz veya süresi dolmuş token');
  }
}

/**
 * Middleware: Token Doğrulama
 */
function authMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token bulunamadı'
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth hatası:', error.message);
    res.status(401).json({
      success: false,
      error: 'Kimlik doğrulama başarısız'
    });
  }
}

/**
 * Input Validation Middleware
 */
function validateInput(req, res, next) {
  const validateEmail = (email) => {
    return validator.isEmail(email);
  };

  const validateName = (name) => {
    return validator.isLength(name, { min: 2, max: 100 }) &&
           validator.matches(name, /^[a-zA-ZçğıöşüÇĞİÖŞÜ\s]+$/);
  };

  const validatePassword = (password) => {
    // En az 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam, 1 özel karakter
    return validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    });
  };

  // Request body'sini sanitize et
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // XSS koruması
        req.body[key] = validator.trim(req.body[key]);
        req.body[key] = validator.escape(req.body[key]);
      }
    });
  }

  req.validators = {
    validateEmail,
    validateName,
    validatePassword
  };

  next();
}

/**
 * Rate Limit Check
 */
const requestCounts = new Map();

function rateLimitPerUser(maxRequests = 10, windowMs = 60000) {
  return (req, res, next) => {
    const userId = req.user?.userId || req.ip;
    const now = Date.now();
    
    if (!requestCounts.has(userId)) {
      requestCounts.set(userId, []);
    }

    const userRequests = requestCounts.get(userId);
    
    // Eski istekleri temizle
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Çok fazla istek yapıldı, lütfen daha sonra tekrar deneyin.'
      });
    }

    validRequests.push(now);
    requestCounts.set(userId, validRequests);
    next();
  };
}

/**
 * Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
  console.error('❌ Hata:', err.message);

  // Hassas bilgileri açıklama
  const message = process.env.NODE_ENV === 'production'
    ? 'Bir hata oluştu, lütfen daha sonra tekrar deneyin.'
    : err.message;

  res.status(err.status || 500).json({
    success: false,
    error: message
  });
}

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  validateInput,
  rateLimitPerUser,
  errorHandler
};
