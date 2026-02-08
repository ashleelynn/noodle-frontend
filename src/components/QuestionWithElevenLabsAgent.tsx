import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE } from '../config/api';

interface QuestionProps {
  onContinue: (transcript: string) => void;
  authToken?: string;
}

export default function Question({ onContinue, authToken }: QuestionProps) {
  const [speechPreview, setSpeechPreview] = useState('');
  const [aiText, setAiText] = useState('Hi! Hold the mic and tell me what you like to draw.');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fullTranscript, setFullTranscript] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isHolding, setIsHolding] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recognitionRef = useRef<{
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: ((event: unknown) => void) | null;
    onerror: ((event: Event) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
  } | null>(null);
  const isHoldingRef = useRef(false);

  useEffect(() => {
    const initializeAgent = async () => {
      try {
        console.log('[ElevenLabs Agent] Initializing agent connection...');

        const headers: HeadersInit = {};
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
          console.log('[ElevenLabs Agent] Using auth token');
        } else {
          console.warn('[ElevenLabs Agent] No auth token provided');
        }

        const response = await fetch(`${API_BASE}/api/voice/agent/signed-url`, {
          headers,
        });

        console.log('[ElevenLabs Agent] Signed URL response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[ElevenLabs Agent] Failed to get signed URL:', response.status, errorText);
          throw new Error(`Failed to get signed URL: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log('[ElevenLabs Agent] Received data:', data);

        if (!data.signed_url) {
          throw new Error('No signed URL received from server');
        }

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
        console.log('[ElevenLabs Agent] Audio context created');

        console.log('[ElevenLabs Agent] Connecting to WebSocket:', data.signed_url.substring(0, 50) + '...');
        const ws = new WebSocket(data.signed_url);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[ElevenLabs Agent] WebSocket connected successfully');
          setIsConnected(true);
          const initMessage = {
            type: 'conversation_initiation_client_data',
            conversation_config_override: {
              agent: {
                prompt: {
                  prompt: 'You are Luna, a friendly AI art buddy for 4-6 year old children. Ask what they like to draw. Keep replies short and warm.',
                },
              },
            },
          };
          console.log('[ElevenLabs Agent] Sending init message:', initMessage);
          ws.send(JSON.stringify(initMessage));
        };

        ws.onmessage = async (event) => {
          try {
            const msg = JSON.parse(event.data) as {
              type: string;
              event_id?: string;
              response?: string;
              audio_event?: { audio_base_64?: string };
            };

            console.log('[ElevenLabs Agent] Received message type:', msg.type);

            if (msg.type === 'agent_response' && msg.response) {
              console.log('[ElevenLabs Agent] Agent response:', msg.response);
              setAiText(msg.response);
              setFullTranscript((prev) => [...prev, `AI: ${msg.response}`]);
              setIsProcessing(false);
            } else if (msg.type === 'audio' && msg.audio_event?.audio_base_64) {
              console.log('[ElevenLabs Agent] Received audio chunk');
              setIsSpeaking(true);
              await playAudioChunk(msg.audio_event.audio_base_64);
            } else if (msg.type === 'audio_end' || msg.type === 'interruption') {
              console.log('[ElevenLabs Agent] Audio ended or interrupted');
              setIsSpeaking(false);
            } else if (msg.type === 'ping' && msg.event_id && wsRef.current?.readyState === WebSocket.OPEN) {
              console.log('[ElevenLabs Agent] Responding to ping');
              wsRef.current.send(JSON.stringify({ type: 'pong', event_id: msg.event_id }));
            }
          } catch (err) {
            console.error('[ElevenLabs Agent] Error parsing WebSocket message:', err);
          }
        };

        ws.onerror = (error) => {
          console.error('[ElevenLabs Agent] WebSocket error:', error);
          setIsConnected(false);
          setIsProcessing(false);
        };

        ws.onclose = (event) => {
          console.log('[ElevenLabs Agent] WebSocket closed. Code:', event.code, 'Reason:', event.reason);
          setIsConnected(false);
          setIsProcessing(false);
        };
      } catch (err) {
        console.error('[ElevenLabs Agent] Error initializing agent:', err);
        setAiText('Sorry, I had trouble connecting. Please refresh the page.');
      }
    };

    void initializeAgent();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (audioContextRef.current) {
        void audioContextRef.current.close();
      }
    };
  }, [authToken]);

  useEffect(() => {
    const RecognitionCtor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!RecognitionCtor) {
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: unknown) => {
      const results = (event as { results?: ArrayLike<{ 0?: { transcript?: string } }> })?.results;
      const combined = Array.from(results ?? [])
        .map((r) => r?.[0]?.transcript ?? '')
        .join(' ')
        .trim();
      setSpeechPreview(combined);
    };

    recognition.onerror = () => {
      setIsHolding(false);
      isHoldingRef.current = false;
    };

    recognition.onend = () => {
      if (isHoldingRef.current) {
        try {
          recognition.start();
        } catch {
          // ignore restart failures
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore stop failures
      }
      recognitionRef.current = null;
    };
  }, []);

  const playAudioChunk = async (base64Audio: string) => {
    if (!audioContextRef.current) {
      console.error('[ElevenLabs Agent] No audio context available');
      return;
    }

    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start(0);
      console.log('[ElevenLabs Agent] Audio chunk played successfully');
    } catch (err) {
      console.error('[ElevenLabs Agent] Error playing audio chunk:', err);
    }
  };

  const sendTextToAgent = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('[ElevenLabs Agent] Cannot send message - WebSocket not connected');
      return;
    }

    console.log('[ElevenLabs Agent] Sending user message:', text);
    setFullTranscript((prev) => [...prev, `User: ${text}`]);
    wsRef.current.send(JSON.stringify({
      type: 'user_text_message',
      text,
    }));

    setIsProcessing(true);
  }, []);

  const handleHoldStart = async () => {
    if (!isConnected || isSpeaking || isProcessing || !recognitionRef.current) {
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      alert('Please allow microphone access to use voice input');
      return;
    }

    setSpeechPreview('');
    setIsHolding(true);
    isHoldingRef.current = true;
    try {
      recognitionRef.current.start();
    } catch {
      // ignore start failures
    }
  };

  const handleHoldEnd = () => {
    if (!isHolding) return;

    setIsHolding(false);
    isHoldingRef.current = false;
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore stop failures
    }

    const finalText = speechPreview.trim();
    if (finalText) {
      sendTextToAgent(finalText);
      setSpeechPreview('');
    }
  };

  return (
    <div className="h-screen w-screen bg-[#f4f1ed] relative overflow-hidden flex flex-col">
      <svg width="0" height="0" className="absolute">
        <filter id="pencil-border">
          <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="4" seed="1" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <div className="w-full h-[81px] bg-[#ffd000] shrink-0" />

      <div className="flex-1 flex flex-col items-center overflow-y-auto py-3 px-4">
        <div className="mb-1 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <p style={{ fontFamily: 'Avenir, sans-serif', fontSize: '14px', color: '#666' }}>
            {isConnected ? 'Connected to Luna' : 'Connecting...'}
          </p>
        </div>

        <p
          className="text-black text-center mt-3"
          style={{
            fontFamily: '"Just Me Again Down Here", cursive',
            fontSize: 'clamp(50px, 7vw, 70px)',
            lineHeight: 'normal',
          }}
        >
          what do you like to draw?
        </p>

        <p
          className="text-black text-center mt-2 max-w-[860px] px-6"
          style={{ fontFamily: 'Avenir, sans-serif', fontSize: '22px', lineHeight: '1.2' }}
        >
          {aiText}
        </p>

        <button
          onPointerDown={handleHoldStart}
          onPointerUp={handleHoldEnd}
          onPointerLeave={handleHoldEnd}
          disabled={!isConnected || isSpeaking || isProcessing}
          className="mt-4 relative cursor-pointer bg-transparent border-none p-0 outline-none disabled:opacity-50"
        >
          {isHolding && (
            <span className="absolute -inset-4 z-0 flex items-center justify-center pointer-events-none">
              <span className="absolute inset-0 rounded-full bg-[#ffd000] animate-[mic-ping_1.2s_ease-out_infinite]" />
              <span className="absolute inset-0 rounded-full bg-[#ffd000] animate-[mic-ping_1.2s_ease-out_0.4s_infinite]" />
            </span>
          )}
          <span
            className="relative z-10 flex items-center justify-center w-[200px] h-[200px] rounded-full border-[5px] border-black bg-white"
            style={{ filter: 'url(#pencil-border)' }}
          >
            <img src="/mic-icon.png" alt="Microphone" className="w-[95px] h-[128px] object-contain" draggable={false} />
          </span>
        </button>

        <p
          className="text-black text-center mt-3"
          style={{
            fontFamily: '"Just Me Again Down Here", cursive',
            fontSize: 'clamp(42px, 6vw, 54px)',
            lineHeight: 'normal',
          }}
        >
          hold to speak
        </p>

        <div
          className="mt-4 w-[640px] max-w-[88vw] min-h-[170px] border-[4px] border-black bg-white px-3 py-2"
          style={{ filter: 'url(#pencil-border)' }}
        >
          {fullTranscript.length === 0 && !speechPreview ? (
            <p style={{ fontFamily: 'Avenir, sans-serif', fontSize: '14px', color: '#777' }}>
              transcript will appear here...
            </p>
          ) : (
            <>
              {fullTranscript.map((line, index) => (
                <p key={index} style={{ fontFamily: 'Avenir, sans-serif', fontSize: '14px', color: '#111' }}>
                  {line}
                </p>
              ))}
              {speechPreview && (
                <p style={{ fontFamily: 'Avenir, sans-serif', fontSize: '14px', color: '#444' }}>
                  You (live): {speechPreview}
                </p>
              )}
            </>
          )}
        </div>

        <button
          onClick={() => {
            const nextTranscript = [...fullTranscript];
            if (speechPreview.trim()) {
              nextTranscript.push(`User: ${speechPreview.trim()}`);
            }
            onContinue(nextTranscript.join('\n'));
          }}
          disabled={(fullTranscript.length === 0 && !speechPreview.trim()) || isHolding}
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
          0% { transform: scale(1); opacity: .5; }
          100% { transform: scale(1.22); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
