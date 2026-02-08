interface DrawingPreviewProps {
  drawingDataUrl: string;
  title?: string;
  onDone: () => void;
}

export default function DrawingPreview({
  drawingDataUrl,
  title = 'my drawing',
  onDone,
}: DrawingPreviewProps) {
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

      {/* Canvas area with drawing */}
      <div className="flex-1 relative p-4 pt-6 min-h-0">
        {/* Hand-drawn border */}
        <img
          src="/canvas-border.svg"
          alt=""
          className="absolute inset-4 w-[calc(100%-32px)] h-[calc(100%-32px)] pointer-events-none z-10"
        />

        {/* Extracted drawing */}
        <div className="absolute inset-[40px] flex items-center justify-center overflow-hidden">
          <img
            src={drawingDataUrl}
            alt="Your drawing"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      </div>

      {/* Done button — bottom right */}
      <div className="flex justify-end px-4 pb-4">
        <button
          onClick={onDone}
          className="px-8 py-2 bg-white border-2 border-black cursor-pointer
            hover:bg-gray-100 active:scale-95 transition-all duration-200"
          style={{
            ...font,
            fontSize: '40px',
            lineHeight: '16px',
            color: '#040000',
          }}
        >
          done
        </button>
      </div>
    </div>
  );
}
