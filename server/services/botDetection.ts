import axios from 'axios';

/**
 * 🤖 Bot Detection Service
 * 
 * Google reCAPTCHA v3 integration
 */

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET_KEY || '';
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const MIN_SCORE = 0.5; // Scores below this are considered bots

/**
 * Verify reCAPTCHA v3 token
 */
export const verifyRecaptcha = async (
  token: string,
  action?: string
): Promise<{
  success: boolean;
  score: number;
  action: string;
  isBot: boolean;
}> => {
  try {
    if (!RECAPTCHA_SECRET) {
      console.warn('reCAPTCHA secret not configured');
      return {
        success: true,
        score: 1.0,
        action: action || '',
        isBot: false,
      };
    }

    const response = await axios.post(
      RECAPTCHA_VERIFY_URL,
      new URLSearchParams({
        secret: RECAPTCHA_SECRET,
        response: token,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 5000,
      }
    );

    const data = response.data;

    return {
      success: data.success,
      score: data.score || 0,
      action: data.action || '',
      isBot: data.score < MIN_SCORE,
    };
  } catch (err) {
    console.error('reCAPTCHA verification error:', err);
    return {
      success: false,
      score: 0,
      action: action || '',
      isBot: true,
    };
  }
};

/**
 * Middleware: Verify reCAPTCHA on request
 */
export const recaptchaMiddleware = (action: string) => {
  return async (req: any, res: any, next: any) => {
    try {
      const token = req.body?.recaptchaToken || req.headers['x-recaptcha-token'];

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'reCAPTCHA token required',
        });
      }

      const result = await verifyRecaptcha(token, action);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: 'reCAPTCHA verification failed',
        });
      }

      if (result.isBot) {
        return res.status(403).json({
          success: false,
          message: 'Bot detected - access denied',
          score: result.score,
        });
      }

      // Attach score to request
      req.recaptchaScore = result.score;
      next();
    } catch (err) {
      console.error('reCAPTCHA middleware error:', err);
      // Continue on error (fail open)
      next();
    }
  };
};

/**
 * Advanced bot detection heuristics
 */
export const detectBotBehavior = (req: any): {
  isBot: boolean;
  confidence: number;
  reasons: string[];
} => {
  const reasons: string[] = [];
  let score = 0;

  // Check User-Agent
  const userAgent = req.get('user-agent') || '';
  if (!userAgent) {
    reasons.push('No User-Agent');
    score += 30;
  } else if (
    /bot|crawler|spider|scraper|curl|wget/i.test(userAgent)
  ) {
    reasons.push('Bot User-Agent');
    score += 50;
  }

  // Check Accept headers
  const accept = req.get('accept') || '';
  if (!accept.includes('text/html')) {
    reasons.push('Suspicious Accept header');
    score += 20;
  }

  // Check for common bot patterns
  if (!req.get('accept-language')) {
    reasons.push('No Accept-Language');
    score += 15;
  }

  if (!req.get('accept-encoding')) {
    reasons.push('No Accept-Encoding');
    score += 15;
  }

  // Check request speed (if tracked)
  const requestCount = (req as any).rateLimit?.current || 0;
  if (requestCount > 50) {
    reasons.push('High request rate');
    score += 25;
  }

  return {
    isBot: score >= 50,
    confidence: Math.min(score, 100),
    reasons,
  };
};

/**
 * Middleware: Block bots based on heuristics
 */
export const blockBots = (req: any, res: any, next: any) => {
  const detection = detectBotBehavior(req);

  if (detection.isBot) {
    console.warn(
      `🤖 Bot detected: ${req.ip} - ${detection.reasons.join(', ')}`
    );
    return res.status(403).json({
      success: false,
      message: 'Automated access detected',
    });
  }

  next();
};
