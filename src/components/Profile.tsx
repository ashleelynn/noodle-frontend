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
          <img src="/icon-art-bag.svg" alt="Back to canvas" className="w-[70px] h-[50px] object-contain" />
        </button>
      </div>

      {/* Two-column layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left column: Profile info */}
        <div className="w-1/2 p-8 pt-12 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <svg width="53" height="67" viewBox="0 0 53 67" fill="none" className="shrink-0">
              <circle cx="26" cy="12" r="10" stroke="black" strokeWidth="3" fill="none"/>
              <line x1="26" y1="22" x2="26" y2="50" stroke="black" strokeWidth="3"/>
              <line x1="26" y1="30" x2="10" y2="42" stroke="black" strokeWidth="3"/>
              <line x1="26" y1="30" x2="42" y2="42" stroke="black" strokeWidth="3"/>
              <line x1="26" y1="50" x2="14" y2="65" stroke="black" strokeWidth="3"/>
              <line x1="26" y1="50" x2="38" y2="65" stroke="black" strokeWidth="3"/>
            </svg>
            <h1 className="text-black" style={{ ...font, fontSize: '80px', lineHeight: 'normal' }}>
              my profile..
            </h1>
          </div>

          {/* Name */}
          <label className="block mb-1">
            <span className="text-black" style={{ ...font, fontSize: '40px' }}>name</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-[280px] border-2 border-black bg-transparent px-2 py-1 mb-4 text-black outline-none"
            style={{ ...font, fontSize: '36px', lineHeight: 'normal' }}
          />

          {/* Email */}
          <label className="block mb-1">
            <span className="text-black" style={{ ...font, fontSize: '40px' }}>email</span>
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-[320px] border-2 border-black bg-transparent px-2 py-1 mb-4 text-black outline-none"
            style={{ ...font, fontSize: '36px', lineHeight: 'normal' }}
          />

          {/* Interests */}
          <label className="block mb-1">
            <span className="text-black" style={{ ...font, fontSize: '40px' }}>interests</span>
          </label>
          <textarea
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            rows={5}
            className="block w-full max-w-[440px] border-2 border-black bg-transparent px-2 py-2 text-black outline-none resize-none"
            style={{ ...font, fontSize: '36px', lineHeight: '1.3' }}
          />
        </div>

        {/* Right column: Gallery */}
        <div className="w-1/2 p-8 pt-12 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <img src="/icon-gallery-frame.svg" alt="" className="w-[80px] h-[80px] object-contain shrink-0" />
            <h1 className="text-black" style={{ ...font, fontSize: '80px', lineHeight: 'normal' }}>
              my gallery
            </h1>
          </div>

          {/* Scrollable gallery grid */}
          <div className="grid grid-cols-3 gap-4 pb-8">
            {savedDrawings.length > 0 ? (
              savedDrawings.map((dataUrl, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] border-[3px] border-black bg-white overflow-hidden"
                >
                  <img
                    src={dataUrl}
                    alt={`Drawing ${i + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))
            ) : (
              /* Empty placeholder slots */
              Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[4/3] border-[3px] border-black bg-white"
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
