import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../firebase';
import { MessageSquare, Mail, Lock, ArrowRight, Loader2, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import './Login.css';

interface LoginProps {
  mode: 'login' | 'signup';
}

export const LoginPage: React.FC<LoginProps> = ({ mode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  
  const navigate = useNavigate();

  console.log(`[RENDER] LoginPage mode=${mode} v1.0.5`);

  const handleFirebaseError = (error: any) => {
    console.error('[AUTH ERROR] Full Trace:', error);
    const errorCode = error.code || 'unknown-error';
    let message = 'An error occurred during authentication';
    
    switch (errorCode) {
      case 'auth/invalid-credential':
        message = 'Incorrect email or password. If you haven\'t created an account in this new SocialLink system yet, please click "Sign Up" at the bottom first.';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email.';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password. Please try again.';
        break;
      case 'auth/email-already-in-use':
        message = 'This email is already registered. Please go to the Login page instead.';
        break;
      case 'auth/invalid-email':
        message = 'Please enter a valid email address.';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters.';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Sign-in window was closed.';
        break;
      case 'auth/operation-not-allowed':
        message = 'ERROR: Email/Password sign-in is DISABLED in your Firebase Console.';
        break;
      default:
        message = error.message || 'Authentication failed.';
    }

    const finalDisplay = `[${errorCode}] ${message}`;
    console.log(`[AUTH ERROR] Displaying: ${finalDisplay}`);
    setStatusMsg(finalDisplay);
    toast.error(finalDisplay, { id: 'auth-error', duration: 10000 });
  };

  const handleSocialLogin = async (platform: 'google' | 'github') => {
    console.log(`[AUTH] Social clicked: ${platform}`);
    if (isLoading) return;
    setIsLoading(true);
    setStatusMsg(`Connecting to ${platform}...`);
    try {
      const provider = platform === 'google' 
        ? new GoogleAuthProvider() 
        : new GithubAuthProvider();
      
      const result = await signInWithPopup(auth, provider);
      console.log('[AUTH] Social Success:', result.user.email);
      setStatusMsg('Success! Redirecting...');
      toast.success(`Signed in with ${platform}!`);
      navigate('/dashboard');
    } catch (err: any) {
      handleFirebaseError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    console.log(`[AUTH] Forgot password clicked for: ${email}`);
    if (!email) {
      toast.error('Enter your email first.');
      setStatusMsg('Error: Email required for reset.');
      return;
    }
    setStatusMsg('Sending reset link...');
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Reset email sent! Check your inbox.', { duration: 8000 });
      setStatusMsg('Check your inbox for the reset link.');
    } catch (err: any) {
      handleFirebaseError(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`[AUTH] Form submitted. Mode=${mode}, Email=${email}`);
    if (isLoading) return;
    
    setIsLoading(true);
    setStatusMsg(mode === 'login' ? 'Verifying credentials...' : 'Creating new account...');
    try {
      if (mode === 'login') {
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log('[AUTH] Login Success:', result.user.email);
        setStatusMsg('Login successful! Redirecting...');
        toast.success(`Welcome back!`);
        navigate('/dashboard');
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        console.log('[AUTH] Signup Success:', result.user.email);
        setStatusMsg('Account created! Sending verification...');
        await sendEmailVerification(result.user);
        toast.success('Account created! Redirecting to dashboard...');
        navigate('/dashboard');
      }
    } catch (err: any) {
      handleFirebaseError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', color: '#ccc' }}>v1.0.5</div>
        
        <div className="login-header">
          <div style={{ 
             backgroundColor: mode === 'login' ? '#dcfce7' : '#dbeafe', 
             color: mode === 'login' ? '#166534' : '#1e40af',
             padding: '4px 12px',
             borderRadius: '20px',
             fontSize: '11px',
             fontWeight: 'bold',
             display: 'inline-block',
             marginBottom: '1rem',
             textTransform: 'uppercase',
             letterSpacing: '1px'
          }}>
            {mode === 'login' ? 'Login Mode' : 'Signup Mode'}
          </div>

          <div className="brand-logo" onClick={() => navigate('/')}>
            <MessageSquare color="var(--primary)" fill="var(--primary)" size={32} />
          </div>
          <h1>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
          <p>{mode === 'login' ? 'Enter your details to manage your SocialLink bots.' : 'Join 100+ businesses automating with SocialLink.'}</p>
        </div>

        {statusMsg && (
          <div style={{ 
            padding: '0.75rem', 
            borderRadius: '8px', 
            backgroundColor: statusMsg.includes('Success') || statusMsg.includes('successful') || statusMsg.includes('sent') ? '#f0fdf4' : '#fef2f2', 
            color: statusMsg.includes('Success') || statusMsg.includes('successful') || statusMsg.includes('sent') ? '#166534' : '#991b1b',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            textAlign: 'center',
            fontWeight: '500',
            border: statusMsg.includes('Success') || statusMsg.includes('successful') || statusMsg.includes('sent') ? '1px solid #bbf7d0' : '1px solid #fecaca'
          }}>
            {statusMsg}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} className="field-icon" />
              <input 
                type="email" 
                placeholder="name@company.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <div className="label-row">
              <label>Password</label>
              {mode === 'login' && <button type="button" onClick={handleForgotPassword} className="forgot-pass-btn">Forgot?</button>}
            </div>
            <div className="input-wrapper">
              <Lock size={18} className="field-icon" />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </div>
          </div>

          <button type="submit" className="submit-auth-btn" disabled={isLoading}>
            {isLoading ? <Loader2 className="spin" size={20} /> : (
              <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div className="divider"><span>OR</span></div>

        <div className="social-auth">
          <button className="social-btn" onClick={() => handleSocialLogin('google')} disabled={isLoading}>
             <img src="https://www.google.com/favicon.ico" alt="Google" width="18" />
             Google
          </button>
          <button className="social-btn" onClick={() => handleSocialLogin('github')} disabled={isLoading}>
             <Shield size={18} />
             GitHub
          </button>
        </div>

        <p className="auth-footer">
          {mode === 'login' ? (
            <>Don't have an account? <Link to="/signup">Sign Up</Link></>
          ) : (
            <>Already have an account? <Link to="/login">Sign In</Link></>
          )}
        </p>
      </div>
      
      <div className="login-quote">
         <blockquote>
           "The SocialLink platform changed how we handle customer support. It's like having a 24/7 expert on SocialLink."
         </blockquote>
         <cite>— Sarah J., TechFlow Inc.</cite>
      </div>
    </div>
  );
};
