import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSocialLogin = (platform: string) => {
    toast(`${platform} Login is coming in the next update!`, {
      icon: '🚧',
      style: { borderRadius: '10px', background: '#334155', color: '#fff' },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      let body;
      let headers: any = {};
      
      if (mode === 'login') {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        body = formData;
      } else {
        body = JSON.stringify({ email, password });
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: body,
      });

      const data = await response.json();

      // HANDLE UNREGISTERED USER (404)
      if (response.status === 404 && mode === 'login') {
        toast.error("You are not registered! Redirecting to signup...", {
          duration: 3000,
          icon: '👋'
        });
        setTimeout(() => {
          navigate('/signup');
          setIsLoading(false);
        }, 3000);
        return;
      }

      if (!response.ok) throw new Error(data.detail || 'Authentication failed');

      if (mode === 'login') {
        login(data.access_token, data.user);
        toast.success(`Welcome back!`);
        
        if (data.user.email === 'princejoshij736@gmail.com') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        toast.success('Account created! Please sign in.');
        navigate('/login');
      }
    } catch (err: any) {
      toast.error(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="brand-logo" onClick={() => navigate('/')}>
            <MessageSquare color="var(--primary)" fill="var(--primary)" size={32} />
          </div>
          <h1>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h1>
          <p>{mode === 'login' ? 'Enter your details to manage your AI bots.' : 'Join 100+ businesses automating with RAG.'}</p>
        </div>

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
                required
              />
            </div>
          </div>

          <div className="input-group">
            <div className="label-row">
              <label>Password</label>
              {mode === 'login' && <a href="#" className="forgot-pass">Forgot?</a>}
            </div>
            <div className="input-wrapper">
              <Lock size={18} className="field-icon" />
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          <button className="social-btn" onClick={() => handleSocialLogin('Google')}>
             <img src="https://www.google.com/favicon.ico" alt="Google" width="18" />
             Google
          </button>
          <button className="social-btn" onClick={() => handleSocialLogin('GitHub')}>
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
           "The RAG platform changed how we handle customer support. It's like having a 24/7 expert on WhatsApp."
         </blockquote>
         <cite>— Sarah J., TechFlow Inc.</cite>
      </div>
    </div>
  );
};
