import { useState, useEffect } from 'react';
import Banner from './Banner';
import HeroImage from './HeroImage';
import Title from './Title';
import StartButton from './StartButton';

interface LandingProps {
  onStart: () => void;
}

export default function Landing({ onStart }: LandingProps) {
  const [showContent, setShowContent] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShowContent(true), 300);
    const t2 = setTimeout(() => setShowButton(true), 800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="h-screen w-screen bg-[#f4f1ed] relative overflow-hidden flex flex-col">
      <Banner />

      <div className="flex-1 flex flex-col items-center justify-center -mt-10">
        <div
          className={`flex flex-col items-center transition-all duration-700 ${
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <HeroImage />
          <Title />

          <div
            className={`mt-8 transition-all duration-500 ${
              showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <StartButton onClick={onStart} />
          </div>
        </div>
      </div>
    </div>
  );
}
