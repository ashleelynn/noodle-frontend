import { useState } from 'react';

interface ProfileProps {
  onGoToCanvas: () => void;
  savedDrawings?: string[]; // array of data URLs from saved canvases
}

export default function Profile({ onGoToCanvas, savedDrawings = [] }: ProfileProps) {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('johndoe@gmail.com');
  const [interests, setInterests] = useState(
    'aliens, spaceships, fairies, cars, superheroes, soccer, animals, minions, trees, power rangers, legos'
  );

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
      <div className="w-full h-[81px] bg-[#ffd000] shrink-0 flex items-center justify-between px-8">
        <p className="text-black" style={{ ...font, fontSize: '50px', lineHeight: 'normal' }}>
          noodle
        </p>

        {/* Paint palette button → back to canvas */}
        <button
          onClick={onGoToCanvas}
          className="cursor-pointer bg-transparent border-none p-0"
          title="Back to canvas"
        >
          <img src="/pallet.png" alt="Back to canvas" className="w-[70px] h-[50px] object-contain" />
        </button>
      </div>

      {/* Two-column layout */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-6 p-6">
        {/* Left column: Profile info */}
        <div className="min-h-0 bg-white border-[6px] border-black p-6 flex flex-col" style={{ filter: 'url(#pencil-border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <img src="/profile.svg" alt="" className="w-[53px] h-[67px] object-contain shrink-0" />
            <h1 className="text-black" style={{ ...font, fontSize: '80px', lineHeight: 'normal' }}>
              my profile..
            </h1>
          </div>

          <div className="flex-1 min-h-0 flex flex-col gap-3">
            <label className="block">
              <span className="text-black" style={{ ...font, fontSize: '40px' }}>name</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full border-[4px] border-black bg-white px-3 py-2 text-black outline-none"
              style={{ ...font, fontSize: '36px', lineHeight: 'normal', filter: 'url(#pencil-border)' }}
            />

            <label className="block">
              <span className="text-black" style={{ ...font, fontSize: '40px' }}>email</span>
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full border-[4px] border-black bg-white px-3 py-2 text-black outline-none"
              style={{ ...font, fontSize: '36px', lineHeight: 'normal', filter: 'url(#pencil-border)' }}
            />

            <label className="block">
              <span className="text-black" style={{ ...font, fontSize: '40px' }}>interests</span>
            </label>
            <textarea
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              rows={6}
              className="block w-full flex-1 min-h-[180px] border-[4px] border-black bg-white px-3 py-2 text-black outline-none resize-none"
              style={{ ...font, fontSize: '36px', lineHeight: '1.25', filter: 'url(#pencil-border)' }}
            />
          </div>
        </div>

        {/* Right column: Gallery */}
        <div className="min-h-0 bg-white border-[6px] border-black p-6 flex flex-col" style={{ filter: 'url(#pencil-border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <img src="/gallery.svg" alt="" className="w-[80px] h-[80px] object-contain shrink-0" />
            <h1 className="text-black" style={{ ...font, fontSize: '80px', lineHeight: 'normal' }}>
              my gallery
            </h1>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="grid grid-cols-3 gap-3">
              {savedDrawings.length > 0 ? (
                savedDrawings.map((dataUrl, i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] border-[5px] border-black bg-white overflow-hidden"
                    style={{ filter: 'url(#pencil-border)' }}
                  >
                    <img
                      src={dataUrl}
                      alt={`Drawing ${i + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ))
              ) : (
                Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] border-[5px] border-black bg-white"
                    style={{ filter: 'url(#pencil-border)' }}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
