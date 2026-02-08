import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../config/api';

interface QuestionProps {
  onContinue: (transcript: string) => void;
}

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    SpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export default function Question({ onContinue }: QuestionProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [aiText, setAiText] = useState('Hi! Hold the mic and tell me what you like to draw.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const [fullTranscript, setFullTranscript] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const isHoldingRef = useRef(false);

  useEffect(() => {
    const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (RecognitionCtor) {
      console.log('Setting up speech recognition');
      const recognition = new RecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('Speech recognition started');
      };

      recognition.onresult = (event: unknown) => {
        const results = (event as { results?: ArrayLike<{ 0?: { transcript?: string } }> })?.results;
        const combined = Array.from(results ?? [])
          .map((r) => r?.[0]?.transcript ?? '')
          .join(' ')
          .trim();
        console.log('Transcript updated:', combined);
        setTranscript(combined);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event);
        const errorEvent = event as { error?: string };

        if (errorEvent.error === 'network') {
          console.error('Network error: Cannot connect to speech recognition service. This may be due to:');
          console.error('1. No internet connection');
          console.error('2. VPN or firewall blocking Google speech services');
          console.error('3. Browser speech API service unavailable');
          // Don't stop holding on network errors - let the user keep trying
          return;
        }

        setIsHolding(false);
        isHoldingRef.current = false;
      };

      recognition.onend = () => {
        console.log('Speech recognition ended. Still holding?', isHoldingRef.current);
        // If the user is still holding, restart recognition
        if (isHoldingRef.current) {
          console.log('Restarting recognition...');
          try {
            recognition.start();
          } catch (err) {
            console.error('Failed to restart recognition:', err);
          }
        }
      };

      recognitionRef.current = recognition;
    } else {
      console.error('Speech recognition not supported');
    }
  }, []);

  const sendToAgent = async (userMessage: string) => {
    if (!userMessage.trim()) return;
    setIsProcessing(true);
    setFullTranscript((prev) => [...prev, `User: ${userMessage}`]);

    try {
      const response = await fetch(`${API_BASE}/api/voice/agent/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_message: userMessage,
          conversation_id: conversationId,
        }),
      });
      const data = await response.json();

      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }
      if (data.response_text) {
        setAiText(data.response_text);
        setFullTranscript((prev) => [...prev, `AI: ${data.response_text}`]);
      }
      setTurnCount((c) => c + 1);

      if (data.audio_url) {
        const audio = new Audio(`${API_BASE}${data.audio_url}`);
        audioRef.current = audio;
        audio.onplay = () => setIsPlayingAudio(true);
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => setIsPlayingAudio(false);
        await audio.play();
      }
    } catch (error) {
      console.error('Failed to talk with ElevenLabs:', error);
      setAiText('I had trouble hearing that. Please hold and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    // Kick off with a welcome prompt from the agent.
    const start = async () => {
      console.log('Starting initial conversation...');
      try {
        const url = `${API_BASE}/api/voice/agent/conversation`;
        console.log('Fetching from:', url);

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_message: 'Start the conversation by asking what I like to draw',
          }),
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Initial conversation response:', data);

        if (data.conversation_id) {
          setConversationId(data.conversation_id);
        }
        if (data.response_text) {
          setAiText(data.response_text);
          setFullTranscript((prev) => [...prev, `AI: ${data.response_text}`]);
        }

        if (data.audio_url) {
          const audioUrl = `${API_BASE}${data.audio_url}`;
          console.log('Loading audio from:', audioUrl);
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audio.onplay = () => {
            console.log('Audio playing');
            setIsPlayingAudio(true);
          };
          audio.onended = () => {
            console.log('Audio ended');
            setIsPlayingAudio(false);
          };
          audio.onerror = (e) => {
            console.error('Audio error:', e);
            setIsPlayingAudio(false);
          };
          await audio.play();
        } else {
          console.log('No audio URL in response');
        }
      } catch (error) {
        console.error('Failed to fetch initial ElevenLabs audio:', error);
        setIsPlayingAudio(false);
      }
    };

    const timer = setTimeout(start, 350);

    return () => {
      clearTimeout(timer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleHoldStart = async () => {
    if (isProcessing || isPlayingAudio) {
      console.log('Cannot start: processing or audio playing');
      return;
    }

    console.log('Starting microphone...');

    // Request microphone permission first
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted');
    } catch (err) {
      console.error('Microphone permission denied:', err);
      alert('Please allow microphone access to use voice input');
      return;
    }

    setTranscript('');
    setIsHolding(true);
    isHoldingRef.current = true;
    try {
      recognitionRef.current?.start();
      console.log('Microphone started successfully');
    } catch (err) {
      console.error('Failed to start recognition:', err);
    }
  };

  const handleHoldEnd = () => {
    if (!isHolding) return;
    console.log('Stopping microphone, transcript:', transcript);
    setIsHolding(false);
    isHoldingRef.current = false;
    recognitionRef.current?.stop();
    const finalText = transcript.trim();
    if (finalText) {
      console.log('Sending to agent:', finalText);
      void sendToAgent(finalText);
      setTranscript('');
    } else {
      console.log('No transcript to send');
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
      <div className="w-full h-[81px] bg-[#ffd000] shrink-0" />

      {/* Content */}
      <div className="flex-1 flex flex-col items-center overflow-y-auto py-8 px-4">
        {/* Audio/processing indicator */}
        {(isPlayingAudio || isProcessing) && (
          <div className="mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-[#ffd000] rounded-full animate-pulse" />
            <p style={{ fontFamily: 'Avenir, sans-serif', fontSize: '16px', color: '#666' }}>
              {isPlayingAudio ? 'Buddy is speaking...' : 'Thinking...'}
            </p>
          </div>
        )}

        {/* Hello */}
        <h1
          className="text-black text-center"
          style={{
            fontFamily: '"Just Me Again Down Here", cursive',
            fontSize: 'clamp(100px, 15vw, 160px)',
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
            fontSize: 'clamp(50px, 7vw, 70px)',
            lineHeight: 'normal',
          }}
        >
          what do you like to draw?
        </p>

        <p
          className="text-black text-center mt-3 max-w-[860px] px-6"
          style={{ fontFamily: 'Avenir, sans-serif', fontSize: '22px', lineHeight: '1.2' }}
        >
          {aiText}
        </p>

        {/* Mic button */}
        <button
          onPointerDown={handleHoldStart}
          onPointerUp={handleHoldEnd}
          onPointerLeave={handleHoldEnd}
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
          className="text-black text-center mt-4"
          style={{
            fontFamily: '"Just Me Again Down Here", cursive',
            fontSize: 'clamp(40px, 5vw, 50px)',
            lineHeight: 'normal',
          }}
        >
          hold to speak
        </p>

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && transcript.trim()) {
              e.preventDefault();
              sendToAgent(transcript.trim());
              setTranscript('');
            }
          }}
          placeholder="Or type your answer here and press Enter..."
          className="mt-4 w-[640px] max-w-[88vw] h-[100px] border-2 border-black bg-white px-3 py-2 text-black outline-none resize-none"
          style={{ fontFamily: 'Avenir, sans-serif', fontSize: '16px', filter: 'url(#pencil-border)' }}
        />

        <button
          onClick={() => onContinue(fullTranscript.join('\n'))}
          disabled={turnCount < 2 || isProcessing}
          className="mt-4 mb-8 px-6 py-2 bg-white border-4 border-black disabled:opacity-50
            cursor-pointer hover:bg-gray-100 active:scale-95 transition-all duration-200"
          style={{
            fontFamily: '"Just Me Again Down Here", cursive',
            fontSize: 'clamp(32px, 4vw, 44px)',
            lineHeight: 'normal',
            filter: 'url(#pencil-border)',
          }}
        >
          continue
        </button>
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
