import { useState, useEffect, useRef } from 'react';

interface QuestionProps {
  onContinue: (transcript: string) => void;
}

export default function Question({ onContinue }: QuestionProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [transcript, setTranscript] = useState('I like dinosaurs, birthday parties, bright colors, and space rockets.');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Use ElevenLabs Agent only - no fallback
    const playWelcomeAudio = async () => {
      try {
        // Use the conversational agent
        const response = await fetch('http://localhost:8004/api/voice/agent/conversation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_message: 'Start the conversation by asking what I like to draw'
          })
        });

        const data = await response.json();

        if (data.audio_url) {
          // Play ElevenLabs audio
          const audio = new Audio(`http://localhost:8004${data.audio_url}`);
          audioRef.current = audio;

          audio.onplay = () => setIsPlayingAudio(true);
          audio.onended = () => setIsPlayingAudio(false);
          audio.onerror = () => {
            setIsPlayingAudio(false);
            console.error('Failed to play ElevenLabs audio');
          };

          await audio.play();
        } else {
          console.error('No audio URL received from ElevenLabs');
          setIsPlayingAudio(false);
        }
      } catch (error) {
        console.error('Failed to fetch ElevenLabs audio:', error);
        setIsPlayingAudio(false);
      }
    };

    // Start playback after a short delay
    const timer = setTimeout(playWelcomeAudio, 500);

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

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
      <div className="w-full h-[81px] bg-[#ffd000] shrink-0" />

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center -mt-10">
        {/* Audio playing indicator */}
        {isPlayingAudio && (
          <div className="mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-[#ffd000] rounded-full animate-pulse" />
            <p style={{ fontFamily: 'Avenir, sans-serif', fontSize: '16px', color: '#666' }}>
              Playing welcome message...
            </p>
          </div>
        )}

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
          onPointerUp={() => { setIsHolding(false); onContinue(transcript); }}
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

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          className="mt-4 w-[640px] max-w-[88vw] h-[120px] border-2 border-black bg-white px-3 py-2 text-black outline-none resize-none"
          style={{ fontFamily: 'Avenir, sans-serif', fontSize: '16px', filter: 'url(#pencil-border)' }}
        />
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
