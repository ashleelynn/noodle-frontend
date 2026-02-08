interface DrawModeProps {
  onSelectFreestyle: () => void;
  onSelectBuddy: () => void;
}

export default function DrawMode({ onSelectFreestyle, onSelectBuddy }: DrawModeProps) {
  const font = {
    fontFamily: '"Just Me Again Down Here", cursive',
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
        <p className="text-black" style={{ ...font, fontSize: '50px', lineHeight: 'normal' }}>
          noodle
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <h1
          className="text-black text-center"
          style={{ ...font, fontSize: '88px', lineHeight: 'normal' }}
        >
          What do you want to draw today?
        </h1>

        <div className="mt-10 w-full max-w-[760px] flex flex-col gap-6">
          <button
            onClick={onSelectFreestyle}
            className="w-full h-[140px] bg-[#ffd000] border-[6px] border-black cursor-pointer
              hover:scale-[1.01] active:scale-[0.98] transition-transform duration-150"
            style={{ filter: 'url(#pencil-border)' }}
          >
            <span className="text-black" style={{ ...font, fontSize: '72px', lineHeight: 'normal' }}>
              Freestyle Mode
            </span>
          </button>

          <button
            onClick={onSelectBuddy}
            className="w-full h-[140px] bg-[#74c8ff] border-[6px] border-black cursor-pointer
              hover:scale-[1.01] active:scale-[0.98] transition-transform duration-150"
            style={{ filter: 'url(#pencil-border)' }}
          >
            <span className="text-black" style={{ ...font, fontSize: '72px', lineHeight: 'normal' }}>
              Buddy Mode
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
