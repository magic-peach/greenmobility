import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabaseClient';
import { AuthRequest } from '../middleware/authMiddleware';
import { generateOTPWithExpiry, verifyOTP, isOTPExpired } from '../utils/otp';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { email, password, name, phone, role = 'passenger' } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required' });
      }

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError || !authData.user) {
        return res.status(400).json({ error: authError?.message || 'Failed to create user' });
      }

      // Create user profile
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name,
          phone,
          role,
          kyc_status: 'unverified',
        })
        .select()
        .single();

      if (profileError) {
        // Clean up auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return res.status(400).json({ error: profileError.message });
      }

      res.status(201).json({
        user: profile,
        session: authData.session,
      });
    } catch (error: any) {
      console.error('Register error:', error);
      res.status(500).json({ error: 'Registration failed', message: error.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.session) {
        return res.status(401).json({ error: error?.message || 'Invalid credentials' });
      }

      // Get user profile
      const { data: profile } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      res.json({
        user: profile,
        session: data.session,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed', message: error.message });
    }
  },

  async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data: profile, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', req.user.id)
        .single();

      if (error || !profile) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(profile);
    } catch (error: any) {
      console.error('Get me error:', error);
      res.status(500).json({ error: 'Failed to get user', message: error.message });
    }
  },

  async submitKYC(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { kyc_document_type, kyc_document_number } = req.body;

      if (!kyc_document_type || !kyc_document_number) {
        return res.status(400).json({ error: 'Document type and number are required' });
      }

      const { data, error } = await supabaseAdmin
        .from('users')
        .update({
          kyc_document_type,
          kyc_document_number,
          kyc_status: 'pending',
        })
        .eq('id', req.user.id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      res.json(data);
    } catch (error: any) {
      console.error('KYC submission error:', error);
      res.status(500).json({ error: 'KYC submission failed', message: error.message });
    }
  },

  async requestAdminOTP(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Generate OTP
      const { code, expiresAt } = generateOTPWithExpiry(10);

      // Store OTP in admin_sessions table
      const { data: session, error } = await supabaseAdmin
        .from('admin_sessions')
        .insert({
          user_id: req.user.id,
          otp_code: code,
          otp_expires_at: expiresAt.toISOString(),
          mfa_verified: false,
        })
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: 'Failed to create OTP session' });
      }

      // Send OTP via email (or log in dev)
      const userEmail = req.user.email;
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] Admin OTP for ${userEmail}: ${code}`);
      } else {
        // TODO: Send email via SMTP
        // await sendEmail(userEmail, 'Admin Login OTP', `Your OTP is: ${code}`);
      }

      res.json({ message: 'OTP sent to admin email', sessionId: session.id });
    } catch (error: any) {
      console.error('Request admin OTP error:', error);
      res.status(500).json({ error: 'Failed to request OTP', message: error.message });
    }
  },

  async verifyAdminOTP(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { otp, sessionId } = req.body;

      if (!otp || !sessionId) {
        return res.status(400).json({ error: 'OTP and session ID are required' });
      }

      // Get OTP session
      const { data: session, error } = await supabaseAdmin
        .from('admin_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', req.user.id)
        .single();

      if (error || !session) {
        return res.status(400).json({ error: 'Invalid session' });
      }

      // Check if expired
      if (isOTPExpired(new Date(session.otp_expires_at))) {
        return res.status(400).json({ error: 'OTP expired' });
      }

      // Verify OTP
      if (!verifyOTP(otp, session.otp_code)) {
        return res.status(401).json({ error: 'Invalid OTP' });
      }

      // Mark as verified
      await supabaseAdmin
        .from('admin_sessions')
        .update({ mfa_verified: true })
        .eq('id', sessionId);

      res.json({ message: 'OTP verified successfully', mfaVerified: true });
    } catch (error: any) {
      console.error('Verify admin OTP error:', error);
      res.status(500).json({ error: 'Failed to verify OTP', message: error.message });
    }
  },
};
