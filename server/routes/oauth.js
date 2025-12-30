import express, { Request, Response } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import SocialAccount from '../models/SocialAccount';
import User from '../models/User';
import { generateTokenPair } from '../services/tokenRotation';
import Session from '../models/Session';
import crypto from 'crypto';

/**
 * 🔐 OAuth 2.0 Social Login Routes
 * 
 * Google, GitHub, Facebook authentication
 */

const router = express.Router();

// ============================================
// PASSPORT CONFIGURATION
// ============================================

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL: '/api/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(null, false, { message: 'No email from Google' });
        }

        // Find or create user
        let user = await User.findOne({ email });
        if (!user) {
          user = new User({
            email,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            profilePicture: profile.photos?.[0]?.value,
            isEmailVerified: true,
            role: 'user',
          });
          await user.save();
        }

        // Link social account
        let socialAccount = await SocialAccount.findOne({
          provider: 'google',
          providerId: profile.id,
        });

        if (!socialAccount) {
          socialAccount = new SocialAccount({
            userId: user._id,
            provider: 'google',
            providerId: profile.id,
            email,
            displayName: profile.displayName,
            profilePicture: profile.photos?.[0]?.value,
            accessToken,
            refreshToken,
            isVerified: true,
            isPrimary: true,
          });
          await socialAccount.save();
        } else {
          socialAccount.accessToken = accessToken;
          socialAccount.refreshToken = refreshToken;
          socialAccount.lastUsedAt = new Date();
          await socialAccount.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// GitHub Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL: '/api/auth/github/callback',
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(null, false, { message: 'No email from GitHub' });
        }

        let user = await User.findOne({ email });
        if (!user) {
          user = new User({
            email,
            firstName: profile.displayName?.split(' ')[0] || profile.username,
            lastName: profile.displayName?.split(' ')[1] || '',
            profilePicture: profile.photos?.[0]?.value,
            isEmailVerified: true,
            role: 'user',
          });
          await user.save();
        }

        let socialAccount = await SocialAccount.findOne({
          provider: 'github',
          providerId: profile.id,
        });

        if (!socialAccount) {
          socialAccount = new SocialAccount({
            userId: user._id,
            provider: 'github',
            providerId: profile.id,
            email,
            displayName: profile.displayName,
            profilePicture: profile.photos?.[0]?.value,
            accessToken,
            refreshToken,
            isVerified: true,
            isPrimary: true,
          });
          await socialAccount.save();
        } else {
          socialAccount.lastUsedAt = new Date();
          await socialAccount.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// Facebook Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID || '',
      clientSecret: process.env.FACEBOOK_APP_SECRET || '',
      callbackURL: '/api/auth/facebook/callback',
      profileFields: ['id', 'emails', 'name', 'picture'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(null, false, { message: 'No email from Facebook' });
        }

        let user = await User.findOne({ email });
        if (!user) {
          user = new User({
            email,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            profilePicture: profile.photos?.[0]?.value,
            isEmailVerified: true,
            role: 'user',
          });
          await user.save();
        }

        let socialAccount = await SocialAccount.findOne({
          provider: 'facebook',
          providerId: profile.id,
        });

        if (!socialAccount) {
          socialAccount = new SocialAccount({
            userId: user._id,
            provider: 'facebook',
            providerId: profile.id,
            email,
            displayName: profile.displayName,
            profilePicture: profile.photos?.[0]?.value,
            accessToken,
            refreshToken,
            isVerified: true,
            isPrimary: true,
          });
          await socialAccount.save();
        } else {
          socialAccount.lastUsedAt = new Date();
          await socialAccount.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/auth/google
 * Initiate Google OAuth
 */
router.get('/google', passport.authenticate('google'));

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  async (req: any, res: Response) => {
    try {
      const user = req.user;
      const sessionId = crypto.randomBytes(32).toString('hex');
      const tokens = generateTokenPair(user._id.toString(), user.email, sessionId);

      // Create session
      await Session.create({
        userId: user._id,
        sessionId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || '',
        refreshToken: tokens.refreshToken,
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${tokens.accessToken}`);
    } catch (err) {
      console.error('Google callback error:', err);
      res.redirect('/login?error=oauth_failed');
    }
  }
);

/**
 * GET /api/auth/github
 * Initiate GitHub OAuth
 */
router.get('/github', passport.authenticate('github'));

/**
 * GET /api/auth/github/callback
 * GitHub OAuth callback
 */
router.get(
  '/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login' }),
  async (req: any, res: Response) => {
    try {
      const user = req.user;
      const sessionId = crypto.randomBytes(32).toString('hex');
      const tokens = generateTokenPair(user._id.toString(), user.email, sessionId);

      await Session.create({
        userId: user._id,
        sessionId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || '',
        refreshToken: tokens.refreshToken,
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${tokens.accessToken}`);
    } catch (err) {
      console.error('GitHub callback error:', err);
      res.redirect('/login?error=oauth_failed');
    }
  }
);

/**
 * GET /api/auth/facebook
 * Initiate Facebook OAuth
 */
router.get('/facebook', passport.authenticate('facebook'));

/**
 * GET /api/auth/facebook/callback
 * Facebook OAuth callback
 */
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login' }),
  async (req: any, res: Response) => {
    try {
      const user = req.user;
      const sessionId = crypto.randomBytes(32).toString('hex');
      const tokens = generateTokenPair(user._id.toString(), user.email, sessionId);

      await Session.create({
        userId: user._id,
        sessionId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || '',
        refreshToken: tokens.refreshToken,
        isActive: true,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${tokens.accessToken}`);
    } catch (err) {
      console.error('Facebook callback error:', err);
      res.redirect('/login?error=oauth_failed');
    }
  }
);

export default router;
