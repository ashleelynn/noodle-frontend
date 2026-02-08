import { useState } from 'react';

type Dance = 'wave' | 'bounce' | 'spin' | 'wiggle';

const DANCES: { id: Dance; label: string }[] = [
  { id: 'wave', label: 'Wave' },
  { id: 'bounce', label: 'Bounce' },
  { id: 'spin', label: 'Spin' },
  { id: 'wiggle', label: 'Wiggle' },
];

interface ChooseDanceProps {
  drawingDataUrl: string;
  title?: string;
  onSelect: (dance: string) => void;
}

export default function ChooseDance({
  drawingDataUrl,
  title = 'my drawing',
  onSelect,
}: ChooseDanceProps) {
  const [selected, setSelected] = useState<Dance | null>(null);

  const font = {
    fontFamily: '"Just Me Again Down Here", cursive',
  };

  return (
    <div className="h-screen w-screen bg-[#f4f1ed] relative overflow-hidden flex flex-col">
      {/* Banner */}
      <div className="w-full h-[81px] bg-[#ffd000] shrink-0 flex items-center justify-between px-8">
        <p className="text-black" style={{ ...font, fontSize: '50px', lineHeight: 'normal' }}>
          noodle
        </p>
        <p className="text-black" style={{ ...font, fontSize: '50px', lineHeight: 'normal' }}>
          {title}
        </p>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative p-4 pt-6 min-h-0">
        {/* Hand-drawn border */}
        <img
          src="/canvas-border.svg"
          alt=""
          className="absolute inset-4 w-[calc(100%-32px)] h-[calc(100%-32px)] pointer-events-none z-10"
        />

        {/* Content centered inside canvas */}
        <div className="absolute inset-[40px] flex flex-col items-center justify-center gap-6 z-20">
          {/* Heading */}
          <h1
            className="text-black text-center"
            style={{ ...font, fontSize: '80px', lineHeight: 'normal' }}
          >
            choose your dance
          </h1>

          {/* Dance option cards */}
          <div className="flex gap-4">
            {DANCES.map((dance) => (
              <button
                key={dance.id}
                onClick={() => {
                  setSelected(dance.id);
                  onSelect(dance.id);
                }}
                className={`w-[137px] h-[157px] border border-black bg-white cursor-pointer
                  overflow-hidden flex items-center justify-center p-2
                  transition-all duration-200 hover:border-2
                  ${selected === dance.id ? 'border-[3px] border-[#ffd000] shadow-[0_0_0_3px_#ffd000]' : ''}`}
              >
                <img
                  src={drawingDataUrl}
                  alt={dance.label}
                  className="max-w-full max-h-full object-contain"
                  style={getDancePreviewStyle(dance.id)}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dance-wave {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes dance-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes dance-spin {
          0% { transform: scaleX(1); }
          25% { transform: scaleX(0.3); }
          50% { transform: scaleX(-1); }
          75% { transform: scaleX(0.3); }
          100% { transform: scaleX(1); }
        }
        @keyframes dance-wiggle {
          0%, 100% { transform: skewX(-3deg) rotate(-2deg); }
          50% { transform: skewX(3deg) rotate(2deg); }
        }
      `}</style>
    </div>
  );
}

function getDancePreviewStyle(dance: Dance): React.CSSProperties {
  switch (dance) {
    case 'wave':
      return { transform: 'rotate(-8deg)' };
    case 'bounce':
      return { transform: 'translateY(-6px)' };
    case 'spin':
      return { transform: 'scaleX(-1)' };
    case 'wiggle':
      return { transform: 'skewX(5deg) rotate(3deg)' };
  }
}
