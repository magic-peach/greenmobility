import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabaseClient';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7);
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('[AUTH] User profile lookup failed:', {
        authUserId: user.id,
        authUserEmail: user.email,
        profileError: profileError?.message,
        profileErrorCode: profileError?.code,
      });
      return res.status(401).json({ 
        error: 'User profile not found',
        details: `Auth user ID: ${user.id}, Email: ${user.email}` 
      });
    }

    req.user = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};
