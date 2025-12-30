import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import SecurityQuestion from '../models/SecurityQuestion';
import bcrypt from 'bcryptjs';

/**
 * 🔐 Security Questions Routes
 * 
 * Account recovery backup method
 */

const router = express.Router();

/**
 * POST /api/security-questions/setup
 * Set up security questions
 */
router.post('/setup', authenticate, async (req: Request, res: Response) => {
  try {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'At least 3 security questions required',
      });
    }

    // Hash answers
    const hashedQuestions = await Promise.all(
      questions.map(async (q: any) => ({
        question: q.question,
        answerHash: await bcrypt.hash(q.answer.toLowerCase().trim(), 12),
        createdAt: new Date(),
      }))
    );

    // Update or create
    await SecurityQuestion.findOneAndUpdate(
      { userId: req.user.id },
      {
        userId: req.user.id,
        questions: hashedQuestions,
        lastUpdatedAt: new Date(),
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'Security questions set up successfully',
    });
  } catch (err) {
    console.error('Setup security questions error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to set up security questions',
    });
  }
});

/**
 * GET /api/security-questions
 * Get security questions (without answers)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email required',
      });
    }

    const User = require('../models/User').default;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const securityQuestions = await SecurityQuestion.findOne({ userId: user._id });

    if (!securityQuestions) {
      return res.status(404).json({
        success: false,
        message: 'No security questions set up',
      });
    }

    res.json({
      success: true,
      questions: securityQuestions.questions.map((q) => ({
        question: q.question,
        createdAt: q.createdAt,
      })),
    });
  } catch (err) {
    console.error('Get security questions error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to get security questions',
    });
  }
});

/**
 * POST /api/security-questions/verify
 * Verify security question answers
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { email, answers } = req.body;

    if (!email || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: 'Email and answers required',
      });
    }

    const User = require('../models/User').default;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const securityQuestions = await SecurityQuestion.findOne({ userId: user._id });

    if (!securityQuestions) {
      return res.status(404).json({
        success: false,
        message: 'No security questions set up',
      });
    }

    // Verify all answers
    let correctAnswers = 0;
    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i].toLowerCase().trim();
      const stored = securityQuestions.questions[i];

      if (stored && (await bcrypt.compare(answer, stored.answerHash))) {
        correctAnswers++;
      }
    }

    // Require all answers to be correct
    if (correctAnswers === answers.length && correctAnswers >= 3) {
      res.json({
        success: true,
        message: 'Security questions verified',
        userId: user._id,
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Incorrect answers',
      });
    }
  } catch (err) {
    console.error('Verify security questions error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to verify security questions',
    });
  }
});

/**
 * PUT /api/security-questions/update
 * Update security questions
 */
router.put('/update', authenticate, async (req: Request, res: Response) => {
  try {
    const { questions } = req.body;

    if (!questions || !Array.isArray(questions) || questions.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'At least 3 security questions required',
      });
    }

    // Hash answers
    const hashedQuestions = await Promise.all(
      questions.map(async (q: any) => ({
        question: q.question,
        answerHash: await bcrypt.hash(q.answer.toLowerCase().trim(), 12),
        createdAt: new Date(),
      }))
    );

    await SecurityQuestion.findOneAndUpdate(
      { userId: req.user.id },
      {
        questions: hashedQuestions,
        lastUpdatedAt: new Date(),
      }
    );

    res.json({
      success: true,
      message: 'Security questions updated',
    });
  } catch (err) {
    console.error('Update security questions error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update security questions',
    });
  }
});

export default router;
