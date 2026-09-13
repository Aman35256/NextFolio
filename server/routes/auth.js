import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, PersonalInfo } from '../models/index.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const otpStore = new Map();

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const createTokenResponse = (user) => {
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage || '',
    },
  };
};

const otpKey = (purpose, email) => `${purpose}:${normalizeEmail(email)}`;

const sendOtp = async ({ email, otp, purpose }) => {
  if (process.env.RESEND_API_KEY && process.env.OTP_FROM_EMAIL) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.OTP_FROM_EMAIL,
          to: email,
          subject: 'Your NextFolio verification code',
          text: `Your NextFolio ${purpose} verification code is ${otp}. It expires in 5 minutes.`,
        }),
      });

      if (response.ok) {
        return;
      }

      const data = await response.json().catch(() => ({}));
      console.warn(`[OTP Warning] Email delivery failed: ${data.message || response.statusText}`);
    } catch (emailErr) {
      console.warn('[OTP Warning] Email delivery error:', emailErr.message);
    }
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('OTP email delivery failed and no fallback is available in production');
  }

  console.log(`[OTP] ${purpose} code for ${email}: ${otp}`);
};

router.post('/signup', async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = normalizeEmail(req.body.email);
    
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });
    
    // Initialize personal info
    await PersonalInfo.create({ UserId: user.id, fullName: name });

    res.status(201).json(createTokenResponse(user));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);
    
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'No account found for this email. Please sign up first.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    res.json(createTokenResponse(user));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/otp/request', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const name = (req.body.name || '').trim();
    const password = String(req.body.password || '');
    const purpose = req.body.purpose === 'signup' ? 'signup' : 'login';

    if (!email) return res.status(400).json({ message: 'Email is required' });
    if (purpose === 'signup' && !name) return res.status(400).json({ message: 'Full name is required' });
    if (purpose === 'signup' && password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (purpose === 'signup' && existingUser) {
      return res.status(400).json({ message: 'User already exists. Log in instead.' });
    }
    if (purpose === 'login' && !existingUser) {
      return res.status(404).json({ message: 'No account found for this email. Sign up first.' });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const passwordHash = purpose === 'signup' ? await bcrypt.hash(password, 10) : null;
    otpStore.set(otpKey(purpose, email), {
      otpHash,
      passwordHash,
      name,
      expiresAt: Date.now() + OTP_TTL_MS,
      attempts: 0,
    });

    await sendOtp({ email, otp, purpose });

    res.json({
      message: 'OTP sent. It expires in 5 minutes.',
      ...(process.env.NODE_ENV === 'production' ? {} : { devOtp: otp }),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
});

router.post('/otp/verify', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const purpose = req.body.purpose === 'signup' ? 'signup' : 'login';
    const otp = String(req.body.otp || '').trim();
    const key = otpKey(purpose, email);
    const record = otpStore.get(key);

    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });
    if (!record) return res.status(400).json({ message: 'Request a new OTP to continue' });
    if (record.expiresAt < Date.now()) {
      otpStore.delete(key);
      return res.status(400).json({ message: 'OTP expired. Request a new code.' });
    }
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      otpStore.delete(key);
      return res.status(429).json({ message: 'Too many attempts. Request a new OTP.' });
    }

    const isMatch = await bcrypt.compare(otp, record.otpHash);
    if (!isMatch) {
      record.attempts += 1;
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    otpStore.delete(key);

    let user = await User.findOne({ where: { email } });
    if (purpose === 'login' && !user) {
      return res.status(404).json({ message: 'No account found for this email. Sign up first.' });
    }

    if (purpose === 'signup') {
      if (user) return res.status(400).json({ message: 'User already exists. Log in instead.' });

      user = await User.create({ name: record.name, email, password: record.passwordHash });
      await PersonalInfo.create({ UserId: user.id, fullName: record.name });
      return res.status(201).json(createTokenResponse(user));
    }

    res.json(createTokenResponse(user));
  } catch (error) {
    res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ message: 'Access token required' });

    // Fetch user info directly from Google API using the access token
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!response.ok) throw new Error('Failed to fetch user info from Google');
    
    const googleProfile = await response.json();
    const email = normalizeEmail(googleProfile.email);
    const name = (googleProfile.name || email.split('@')[0]).trim();
    const { picture, sub, email_verified: emailVerified } = googleProfile;

    if (!email) return res.status(400).json({ message: 'Google account did not provide an email address' });
    if (!emailVerified) return res.status(401).json({ message: 'Google account email is not verified' });
    
    // Check if user exists
    let user = await User.findOne({ where: { email } });
    
    if (!user) {
      // Create user with a random secure password since they authenticate via Google
      const hashedPassword = await bcrypt.hash(sub + Date.now().toString(), 10);
      user = await User.create({ name, email, password: hashedPassword, profileImage: picture });
      await PersonalInfo.create({ UserId: user.id, fullName: name });
    } else if ((!user.profileImage && picture) || (user.name !== name && name)) {
      await user.update({
        name: user.name || name,
        profileImage: user.profileImage || picture,
      });
    }

    res.json(createTokenResponse(user));
  } catch (error) {
    res.status(401).json({ message: 'Google authentication failed', error: error.message });
  }
});

// Middleware to protect routes
export const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default router;
