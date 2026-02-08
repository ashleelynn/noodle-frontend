import { useState } from 'react';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  onSignUp: () => void;
}

export default function Login({ onLogin, onSignUp }: LoginProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
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
            onClick={onSignUp}
            className="font-black cursor-pointer bg-transparent border-none p-0"
            style={{
              fontFamily: 'Avenir, sans-serif',
              fontSize: '20px',
            }}
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
            className="mt-2 px-6 py-2 bg-white border-4 border-black
              cursor-pointer hover:bg-gray-100 active:scale-95 transition-all duration-200"
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
            login
          </button>
        </form>
      </div>
    </div>
  );
}
