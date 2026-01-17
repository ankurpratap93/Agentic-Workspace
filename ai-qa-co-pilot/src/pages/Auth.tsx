import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Sparkles, Shield, Zap, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';

// Enhanced password validation with strength requirements
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

const authSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long')
    .toLowerCase()
    .trim(),
  password: passwordSchema,
  confirmPassword: z.string().optional(),
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name is too long')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
}).refine((data) => {
  // Only validate password confirmation on signup
  if (data.confirmPassword !== undefined) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Rate limiting: track failed attempts
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

interface RateLimitState {
  attempts: number;
  lockedUntil: number | null;
}

function getRateLimitState(): RateLimitState {
  const stored = localStorage.getItem('auth_rate_limit');
  if (!stored) return { attempts: 0, lockedUntil: null };
  const state = JSON.parse(stored) as RateLimitState;
  if (state.lockedUntil && Date.now() > state.lockedUntil) {
    localStorage.removeItem('auth_rate_limit');
    return { attempts: 0, lockedUntil: null };
  }
  return state;
}

function updateRateLimit(failed: boolean): { isLocked: boolean; remainingAttempts: number } {
  const state = getRateLimitState();
  if (state.lockedUntil && Date.now() < state.lockedUntil) {
    const minutesLeft = Math.ceil((state.lockedUntil - Date.now()) / 60000);
    return { isLocked: true, remainingAttempts: 0 };
  }
  
  if (failed) {
    const newAttempts = state.attempts + 1;
    const lockedUntil = newAttempts >= MAX_FAILED_ATTEMPTS ? Date.now() + LOCKOUT_DURATION : null;
    localStorage.setItem('auth_rate_limit', JSON.stringify({ attempts: newAttempts, lockedUntil }));
    return { isLocked: lockedUntil !== null, remainingAttempts: MAX_FAILED_ATTEMPTS - newAttempts };
  } else {
    localStorage.removeItem('auth_rate_limit');
    return { isLocked: false, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }
}

// Password strength calculator
function calculatePasswordStrength(password: string): { strength: number; feedback: string[] } {
  const feedback: string[] = [];
  let strength = 0;
  
  if (password.length >= 8) strength += 1;
  else feedback.push('At least 8 characters');
  
  if (/[a-z]/.test(password)) strength += 1;
  else feedback.push('One lowercase letter');
  
  if (/[A-Z]/.test(password)) strength += 1;
  else feedback.push('One uppercase letter');
  
  if (/[0-9]/.test(password)) strength += 1;
  else feedback.push('One number');
  
  if (/[^a-zA-Z0-9]/.test(password)) strength += 1;
  else feedback.push('One special character');
  
  if (password.length >= 12) strength += 1;
  
  return { strength, feedback };
}

// Input sanitization
function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ strength: number; feedback: string[] } | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(MAX_FAILED_ATTEMPTS);
  const rateLimitCheckRef = useRef(false);

  useEffect(() => {
    // Check for email verification in URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
      toast.success('Email verified successfully! You can now sign in.');
      // Clean up URL
      window.history.replaceState({}, '', '/auth');
    }

    // Check rate limiting on mount
    const rateLimit = getRateLimitState();
    if (rateLimit.lockedUntil && Date.now() < rateLimit.lockedUntil) {
      setIsLocked(true);
      const minutesLeft = Math.ceil((rateLimit.lockedUntil - Date.now()) / 60000);
      toast.error(`Account temporarily locked. Please try again in ${minutesLeft} minute(s).`);
    } else {
      setIsLocked(false);
      setRemainingAttempts(MAX_FAILED_ATTEMPTS - rateLimit.attempts);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only auto-navigate on explicit sign-in, not on signup
      if (event === 'SIGNED_IN' && session?.user) {
        // Check if this is from a signup (we'll track this in state)
        const isFromSignup = sessionStorage.getItem('just_signed_up') === 'true';
        if (isFromSignup) {
          // Don't auto-navigate, let user sign in manually
          sessionStorage.removeItem('just_signed_up');
          return;
        }
        // Clear rate limit on successful auth
        localStorage.removeItem('auth_rate_limit');
        navigate('/');
      } else if (event === 'EMAIL_CONFIRMED') {
        toast.success('Email confirmed! You can now sign in.');
        setIsLogin(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Update password strength as user types
  useEffect(() => {
    if (password && !isLogin) {
      setPasswordStrength(calculatePasswordStrength(password));
    } else {
      setPasswordStrength(null);
    }
  }, [password, isLogin]);

  const validateForm = () => {
    try {
      // Sanitize inputs
      const sanitizedEmail = sanitizeInput(email);
      const sanitizedFullName = fullName ? sanitizeInput(fullName) : undefined;
      
      authSchema.parse({
        email: sanitizedEmail,
        password,
        confirmPassword: isLogin ? undefined : confirmPassword,
        fullName: isLogin ? undefined : sanitizedFullName,
      });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            newErrors[e.path[0] as string] = e.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limiting
    const rateLimit = getRateLimitState();
    if (rateLimit.lockedUntil && Date.now() < rateLimit.lockedUntil) {
      const minutesLeft = Math.ceil((rateLimit.lockedUntil - Date.now()) / 60000);
      toast.error(`Account temporarily locked. Please try again in ${minutesLeft} minute(s).`);
      setIsLocked(true);
      return;
    }
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});

    try {
      // Sanitize inputs before sending
      const sanitizedEmail = sanitizeInput(email).toLowerCase();
      const sanitizedFullName = fullName ? sanitizeInput(fullName) : undefined;

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password,
        });
        
        if (error) {
          // Update rate limiting on failed attempt
          const rateLimitUpdate = updateRateLimit(true);
          setIsLocked(rateLimitUpdate.isLocked);
          setRemainingAttempts(rateLimitUpdate.remainingAttempts);
          
          // Secure error messages that don't leak information
          let message = 'Invalid email or password. Please try again.';
          
          if (error.message.includes('Invalid login credentials') || 
              error.message.includes('Email not confirmed')) {
            // Don't reveal if email exists or not
            message = 'Invalid email or password. Please try again.';
          } else if (error.message.includes('Too many requests')) {
            message = 'Too many login attempts. Please try again later.';
          } else if (error.message.includes('Email rate limit')) {
            message = 'Too many requests. Please try again in a few minutes.';
          }
          
          toast.error(message);
          
          if (rateLimitUpdate.isLocked) {
            toast.error(`Account locked for 15 minutes due to too many failed attempts.`);
          } else if (rateLimitUpdate.remainingAttempts < MAX_FAILED_ATTEMPTS) {
            toast.warning(`${rateLimitUpdate.remainingAttempts} attempt(s) remaining before account lockout.`);
          }
          
          throw error;
        }
        
        // Success - clear rate limiting
        updateRateLimit(false);
        setIsLocked(false);
        toast.success('Welcome back!');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: sanitizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth?verified=true`,
            data: {
              full_name: sanitizedFullName,
            },
          },
        });
        
        if (error) {
          let message = 'Failed to create account. Please try again.';
          
          if (error.message.includes('User already registered') || 
              error.message.includes('already been registered')) {
            message = 'An account with this email already exists. Please sign in instead.';
            setIsLogin(true);
          } else if (error.message.includes('Password')) {
            message = 'Password does not meet requirements. Please check and try again.';
          } else if (error.message.includes('Email rate limit')) {
            message = 'Too many signup attempts. Please try again in a few minutes.';
          }
          
          toast.error(message);
          throw error;
        }
        
        // After successful signup, always redirect to login
        // Clear form and switch to login mode
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFullName('');
        setPasswordStrength(null);
        setErrors({});
        
        // Mark that we just signed up to prevent auto-navigation
        sessionStorage.setItem('just_signed_up', 'true');
        
        // If a session was created (auto-login), sign out immediately
        if (data.session) {
          await supabase.auth.signOut();
        }
        
        // Switch to login mode
        setIsLogin(true);
        
        // Show appropriate message based on email confirmation requirement
        if (data.user && !data.session) {
          toast.success('Account created! Please check your email to verify your account.');
          toast.info('After verifying your email, please sign in below.');
        } else {
          toast.success('Account created successfully! Please sign in to continue.');
        }
      }
    } catch (error: any) {
      // Error already handled above, just log for debugging
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-primary/10 to-background p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">QAForge</span>
          </div>
        </div>
        
        <div className="space-y-8">
          <h1 className="text-4xl font-bold text-foreground leading-tight">
            AI-Powered Test Case & Bug Management
          </h1>
          <p className="text-lg text-muted-foreground">
            Generate comprehensive test cases from Figma designs, web apps, or descriptions. 
            Sync bugs with Azure DevOps in real-time.
          </p>
          
          <div className="space-y-4">
            {[
              { icon: Sparkles, text: 'AI-powered test case generation' },
              { icon: Shield, text: 'Enterprise-grade security with RLS' },
              { icon: Zap, text: 'Real-time Azure DevOps sync' },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-foreground">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          © 2024 QAForge. Built for QA teams.
        </p>
      </div>

      {/* Right side - auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="w-full max-w-md p-8">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">QAForge</span>
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {isLogin
              ? 'Enter your credentials to access your account'
              : 'Get started with your free account'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    const value = sanitizeInput(e.target.value);
                    setFullName(value);
                    if (errors.fullName) {
                      setErrors(prev => ({ ...prev, fullName: '' }));
                    }
                  }}
                  placeholder="John Doe"
                  className="mt-1.5"
                  disabled={isLoading || isLocked}
                  autoComplete="name"
                  maxLength={100}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.fullName}
                  </p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  const value = sanitizeInput(e.target.value).toLowerCase();
                  setEmail(value);
                  if (errors.email) {
                    setErrors(prev => ({ ...prev, email: '' }));
                  }
                }}
                placeholder="you@company.com"
                className="mt-1.5"
                disabled={isLoading || isLocked}
                autoComplete="email"
                maxLength={255}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPassword(value);
                    // Clear errors when user types
                    if (errors.password) {
                      setErrors(prev => ({ ...prev, password: '' }));
                    }
                  }}
                  placeholder="••••••••"
                  className="pr-10"
                  disabled={isLoading || isLocked}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.password}
                </p>
              )}
              {!isLogin && passwordStrength && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          passwordStrength.strength <= 2
                            ? 'bg-destructive'
                            : passwordStrength.strength <= 4
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${(passwordStrength.strength / 6) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {passwordStrength.strength <= 2
                        ? 'Weak'
                        : passwordStrength.strength <= 4
                        ? 'Medium'
                        : 'Strong'}
                    </span>
                  </div>
                  {passwordStrength.feedback.length > 0 && (
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      {passwordStrength.feedback.map((req, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {req}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) {
                        setErrors(prev => ({ ...prev, confirmPassword: '' }));
                      }
                    }}
                    placeholder="••••••••"
                    className="pr-10"
                    disabled={isLoading || isLocked}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword}
                  </p>
                )}
                {!errors.confirmPassword && confirmPassword && password === confirmPassword && (
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Passwords match
                  </p>
                )}
              </div>
            )}

            {isLocked && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Account temporarily locked due to too many failed attempts. Please try again later.
                </p>
              </div>
            )}

            {!isLocked && remainingAttempts < MAX_FAILED_ATTEMPTS && isLogin && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                <p className="text-sm text-yellow-700 dark:text-yellow-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {remainingAttempts} attempt(s) remaining before account lockout.
                </p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || isLocked}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                <>{isLogin ? 'Sign In' : 'Create Account'}</>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
                setPassword('');
                setConfirmPassword('');
                setPasswordStrength(null);
              }}
              className="text-sm text-primary hover:underline"
              disabled={isLoading}
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}