import { useState } from 'react';
import { Mail, Lock, Chrome, Leaf, User, Shield, Car } from 'lucide-react';

type Role = 'passenger' | 'driver' | 'admin';

type LoginPageProps = {
  onLogin: (email: string, password: string, role?: Role) => Promise<void>;
  onGoogleLogin: () => Promise<void>;
  onNavigateToRegister: () => void;
};

export function LoginPage({ onLogin, onGoogleLogin, onNavigateToRegister }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('passenger');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaValue, setCaptchaValue] = useState(0);

  // Generate simple math captcha
  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaValue(num1 + num2);
    setCaptchaQuestion(`${num1} + ${num2}`);
    setCaptchaAnswer('');
  };

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setShowCaptcha(newRole === 'admin');
    if (newRole === 'admin') {
      generateCaptcha();
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // For admin, require captcha verification
    if (role === 'admin') {
      if (!showCaptcha) {
        setShowCaptcha(true);
        generateCaptcha();
        return;
      }

      if (!captchaAnswer || parseInt(captchaAnswer) !== captchaValue) {
        setError('Please solve the captcha correctly');
        generateCaptcha();
        return;
      }

      // Captcha verified, proceed with login
      setLoading(true);
      setError('');
      try {
        console.log('[DEBUG] Captcha verified, attempting login as admin');
        console.log('[DEBUG] Email:', email);
        console.log('[DEBUG] Role:', role);
        
        // Add a small delay to ensure state is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await onLogin(email, password, role);
        console.log('[DEBUG] Login call completed, redirect should happen');
        // Don't set loading to false - let redirect happen
      } catch (err: any) {
        console.error('[DEBUG] Login error details:', err);
        console.error('[DEBUG] Error message:', err?.message);
        console.error('[DEBUG] Full error:', err);
        setLoading(false);
        const errorMessage = err?.message || err?.error || 'Login failed. Please try again.';
        if (errorMessage.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials or sign up for a new account.');
        } else {
          setError(errorMessage);
        }
        // Also show alert for debugging
        alert(`Login Error: ${errorMessage}`);
      }
      return;
    }

    // For passenger and driver, normal login
    setLoading(true);
    try {
      await onLogin(email, password, role);
    } catch (err: any) {
      console.error('Login error details:', err);
      if (err.message?.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials or sign up for a new account.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await onGoogleLogin();
    } catch (err: any) {
      setError(err.message || 'Google login failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl float-animation"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl float-animation" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-3xl float-animation" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-8 slide-in-up">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-pink-500 to-green-500 rounded-2xl rotate-45 float-animation"></div>
              <Leaf className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 text-white" size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">GreenMobility</h1>
          <p className="text-gray-400">Sustainable transport for a better tomorrow</p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8 slide-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl font-bold mb-6 text-center">Welcome Back</h2>

          {error && (
            <div className="mb-4 p-4 bg-pink-500/20 border border-pink-500/50 rounded-lg text-pink-400 text-sm">
              {error}
            </div>
          )}

          {/* Role Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3 text-gray-300">Login As</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleRoleChange('passenger')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  role === 'passenger'
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <User size={20} className="mx-auto mb-1" />
                <span className="text-xs">Passenger</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('driver')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  role === 'driver'
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <Car size={20} className="mx-auto mb-1" />
                <span className="text-xs">Driver</span>
              </button>
              <button
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  role === 'admin'
                    ? 'border-pink-500 bg-pink-500/20'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                <Shield size={20} className="mx-auto mb-1" />
                <span className="text-xs">Admin</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Captcha for Admin */}
            {role === 'admin' && showCaptcha && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Security Check: {captchaQuestion} = ?
                </label>
                <input
                  type="number"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  className="input-field"
                  placeholder="Enter answer"
                  required
                />
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300"
                >
                  New question
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-white/10"></div>
            <span className="px-4 text-sm text-gray-400">or</span>
            <div className="flex-1 border-t border-white/10"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Chrome size={20} />
            <span>Continue with Google</span>
          </button>

          <p className="mt-6 text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <button
              onClick={onNavigateToRegister}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}