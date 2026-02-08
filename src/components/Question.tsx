import { useState } from 'react';

interface QuestionProps {
  onContinue: () => void;
}

export default function Question({ onContinue }: QuestionProps) {
  const [isHolding, setIsHolding] = useState(false);

  return (
    <div className="h-screen w-screen bg-[#f4f1ed] relative overflow-hidden flex flex-col">
      {/* Banner */}
      <div className="w-full h-[81px] bg-[#ffd000] shrink-0" />

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-10">
        {/* Hello */}
        <h1
          className="text-black text-center"
          style={{
            fontFamily: '"Just Me Again Down Here", cursive',
            fontSize: '200px',
            lineHeight: 'normal',
          }}
        >
          hello
        </h1>

        {/* Question */}
        <p
          className="text-black text-center mt-2"
          style={{
            fontFamily: '"Just Me Again Down Here", cursive',
            fontSize: '80px',
            lineHeight: 'normal',
          }}
        >
          what do you like to draw?
        </p>

        {/* Mic button */}
        <button
          onPointerDown={() => setIsHolding(true)}
          onPointerUp={() => { setIsHolding(false); onContinue(); }}
          onPointerLeave={() => setIsHolding(false)}
          className="mt-8 relative cursor-pointer bg-transparent border-none p-0 outline-none"
        >
          {/* Pulse rings (visible when holding) */}
          {isHolding && (
            <>
              <span className="absolute inset-0 rounded-full bg-[#ffd000] animate-[mic-ping_1.2s_ease-out_infinite]" />
              <span className="absolute inset-0 rounded-full bg-[#ffd000] animate-[mic-ping_1.2s_ease-out_0.4s_infinite]" />
            </>
          )}

          {/* Mic circle */}
          <div
            className={`relative w-[120px] h-[120px] rounded-full bg-[#ffd000] border-[3px] border-black
              flex items-center justify-center transition-transform duration-150
              ${isHolding ? 'scale-110' : 'scale-100'}`}
          >
            <img
              src="/mic-icon.png"
              alt="Microphone"
              className="w-[70px] h-[70px] object-contain pointer-events-none"
            />
          </div>
        </button>

        {/* Hold to speak */}
        <p
          className="text-black text-center mt-6"
          style={{
            fontFamily: '"Just Me Again Down Here", cursive',
            fontSize: '60px',
            lineHeight: 'normal',
          }}
        >
          hold to speak
        </p>
      </div>

      <style>{`
        @keyframes mic-ping {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
