import { useState } from 'react';
import API_ENDPOINTS from '../config/api';

interface LoginProps {
  onAuth: (payload: {
    username: string;
    email: string;
    password: string;
    mode: 'login' | 'signup';
  }) => void;
  onSignUp: () => void;
  isLoading?: boolean;
  errorMessage?: string;
}

export default function Login({ onAuth, onSignUp, isLoading = false, errorMessage = '' }: LoginProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = name.trim();
    const trimmedEmail = email.trim();

    if (!username) {
      setLocalError('Please enter a name/username.');
      return;
    }
    if (authMode === 'signup') {
      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        setLocalError('Please enter a valid email for sign up.');
        return;
      }
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters.');
        return;
      }
    }

    setLocalError('');
    setLoading(true);

    try {
      const endpoint = authMode === 'signup' ? API_ENDPOINTS.register : API_ENDPOINTS.login;
      const payload = authMode === 'signup' 
        ? { username, email: trimmedEmail, password }
        : { username, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setLocalError(errorData.detail || `${authMode === 'signup' ? 'Sign up' : 'Login'} failed`);
        return;
      }

      const data = await response.json();
      
      // Store token if provided
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }

      onAuth({
        username,
        email: trimmedEmail,
        password,
        mode: authMode,
      });
    } catch (error) {
      setLocalError(`Connection error: ${error instanceof Error ? error.message : 'Failed to connect to server'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#f4f1ed] relative overflow-hidden flex flex-col">
      {/* SVG filter for hand-drawn/pencil-grain borders */}
      <svg width="0" height="0" className="absolute">
        <filter id="pencil-border">
          <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="4" seed="1" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      {/* Banner */}
      <div className="w-full h-[81px] bg-[#ffd000] shrink-0 flex items-center px-8">
        <p
          className="text-black"
          style={{
            fontFamily: '"Just Me Again Down Here", cursive',
            fontSize: '50px',
            lineHeight: 'normal',
          }}
        >
          noodle
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-10">
        {/* Title */}
        <h1
          className="text-black text-center"
          style={{
            fontFamily: '"Just Me Again Down Here", cursive',
            fontSize: '80px',
            lineHeight: 'normal',
          }}
        >
          login to noodle
        </h1>

        {/* Sign up link */}
        <p
          className="text-center text-black mt-1"
          style={{
            fontFamily: 'Avenir, sans-serif',
            fontSize: '20px',
            lineHeight: 'normal',
          }}
        >
          Don&apos;t have an account?{' '}
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              onSignUp();
            }}
            className="font-black cursor-pointer bg-transparent border-none p-0"
            style={{
              fontFamily: 'Avenir, sans-serif',
              fontSize: '20px',
            }}
          >
            Sign Up
          </button>
        </p>

        <p
          className="text-center text-black mt-1"
          style={{
            fontFamily: 'Avenir, sans-serif',
            fontSize: '16px',
            lineHeight: 'normal',
          }}
        >
          Mode:{' '}
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`cursor-pointer bg-transparent border-none p-0 ${authMode === 'login' ? 'font-bold' : ''}`}
            style={{ fontFamily: 'Avenir, sans-serif', fontSize: '16px' }}
          >
            Login
          </button>
          {' / '}
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className={`cursor-pointer bg-transparent border-none p-0 ${authMode === 'signup' ? 'font-bold' : ''}`}
            style={{ fontFamily: 'Avenir, sans-serif', fontSize: '16px' }}
          >
            Sign Up
          </button>
        </p>

        {/* Pencil illustration */}
        <img
          src="/pencil-noodle.png"
          alt="Pencil illustration"
          className="w-[460px] max-w-[80vw] mt-4"
        />

        {/* Login form */}
        <form onSubmit={handleSubmit} className="flex flex-col items-center mt-8 gap-4 w-full max-w-[357px]">
          {/* Name field */}
          <div className="w-full h-[56px] bg-[#eaeaea] rounded-[60px] flex items-center px-4 gap-3">
            <img src="/Group 1.svg" alt="" className="w-[32px] h-[32px] object-contain" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="name"
              className="flex-1 bg-transparent border-none outline-none text-black"
              style={{
                fontFamily: '"Just Me Again Down Here", cursive',
                fontSize: '30px',
                lineHeight: 'normal',
              }}
            />
          </div>

          {/* Email field */}
          <div className="w-full h-[56px] bg-[#eaeaea] rounded-[60px] flex items-center px-4 gap-3">
            <img src="/Group 2.svg" alt="" className="w-[32px] h-[32px] object-contain" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              className="flex-1 bg-transparent border-none outline-none text-black"
              style={{
                fontFamily: '"Just Me Again Down Here", cursive',
                fontSize: '30px',
                lineHeight: 'normal',
              }}
            />
          </div>

          {/* Password field */}
          <div className="w-full h-[56px] bg-[#eaeaea] rounded-[60px] flex items-center px-4 gap-3">
            <img src="/Group 3.svg" alt="" className="w-[32px] h-[32px] object-contain" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              className="flex-1 bg-transparent border-none outline-none text-black"
              style={{
                fontFamily: '"Just Me Again Down Here", cursive',
                fontSize: '30px',
                lineHeight: 'normal',
              }}
            />
          </div>

          {/* Login button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 px-6 py-2 bg-white border-4 border-black
              cursor-pointer hover:bg-gray-100 active:scale-95 transition-all duration-200 disabled:opacity-60"
            style={{
              color: '#040000',
              textAlign: 'center',
              fontFamily: '"Just Me Again Down Here", cursive',
              fontSize: '40px',
              fontStyle: 'normal',
              fontWeight: 400,
              lineHeight: '16px',
              filter: 'url(#pencil-border)',
            }}
          >
            {loading ? 'loading...' : authMode}
          </button>
        </form>

        {(localError || errorMessage) && (
          <p
            className="text-center text-red-700 mt-4"
            style={{ fontFamily: 'Avenir, sans-serif', fontSize: '16px' }}
          >
            {localError || errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
