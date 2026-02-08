import { useRef, useEffect, useState, useCallback } from 'react';

type Tool = 'pencil' | 'brush' | 'marker' | 'eraser' | 'pen';

const TOOL_CONFIG: Record<Tool, { width: number; opacity: number; cap: CanvasLineCap }> = {
  pencil: { width: 2, opacity: 1, cap: 'round' },
  pen: { width: 4, opacity: 1, cap: 'round' },
  brush: { width: 12, opacity: 0.8, cap: 'round' },
  marker: { width: 20, opacity: 0.5, cap: 'square' },
  eraser: { width: 24, opacity: 1, cap: 'round' },
};

const COLORS = [
  { color: '#000000', label: 'Black' },
  { color: '#e50000', label: 'Red' },
  { color: '#ffd000', label: 'Yellow' },
  { color: '#0051ff', label: 'Blue' },
];

const TOOLS: { id: Tool; icon: string; label: string }[] = [
  { id: 'pencil', icon: '/tool-pencil.svg', label: 'Pencil' },
  { id: 'pen', icon: '/tool-pen.svg', label: 'Pen' },
  { id: 'brush', icon: '/tool-brush.svg', label: 'Brush' },
  { id: 'marker', icon: '/tool-marker.svg', label: 'Marker' },
  { id: 'eraser', icon: '/tool-eraser.svg', label: 'Eraser' },
];

interface DrawingBoardProps {
  aiMessage?: string;
  onSave?: (dataUrl: string) => void;
  onSpeakMessage?: (message: string) => void;
}

export default function DrawingBoard({
  aiMessage = 'start drawing! i\'ll give you tips along the way',
  onSave,
  onSpeakMessage,
}: DrawingBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const [activeTool, setActiveTool] = useState<Tool>('pencil');
  const [activeColor, setActiveColor] = useState('#000000');
  const [isFreestyle, setIsFreestyle] = useState(true);

  // Resize canvas to fit container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    if (!container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      // Save current drawing
      const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        // Fill white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, rect.width, rect.height);
        // Restore previous drawing if it existed
        if (imageData) {
          ctx.putImageData(imageData, 0, 0);
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Speak AI messages when they change
  useEffect(() => {
    if (aiMessage && onSpeakMessage) {
      onSpeakMessage(aiMessage);
    }
  }, [aiMessage, onSpeakMessage]);

  const getCanvasPos = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, []);

  const startDraw = useCallback((e: React.PointerEvent) => {
    isDrawing.current = true;
    lastPos.current = getCanvasPos(e);
    // Capture pointer for smooth drawing
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [getCanvasPos]);

  const draw = useCallback((e: React.PointerEvent) => {
    if (!isDrawing.current || !lastPos.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasPos(e);
    const config = TOOL_CONFIG[activeTool];

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = activeTool === 'eraser' ? '#ffffff' : activeColor;
    ctx.lineWidth = config.width;
    ctx.lineCap = config.cap;
    ctx.globalAlpha = config.opacity;
    ctx.stroke();
    ctx.globalAlpha = 1;

    lastPos.current = pos;
  }, [activeTool, activeColor, getCanvasPos]);

  const endDraw = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
  }, []);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (onSave) {
      onSave(dataUrl);
    }
  };

  return (
    <div className="h-screen w-screen bg-[#f4f1ed] relative overflow-hidden flex flex-col">
      {/* Banner */}
      <div className="w-full h-[81px] bg-[#ffd000] shrink-0 flex items-center justify-between px-8">
        <p
          className="text-black"
          style={{
            fontFamily: '"Just Me Again Down Here", cursive',
            fontSize: '50px',
            lineHeight: 'normal',
          }}
        >
          noodle
        </p>

        {/* Right side: toggle + label */}
        <div className="flex items-center gap-4">
          {/* Toggle */}
          <button
            onClick={() => setIsFreestyle((f) => !f)}
            className="flex items-center gap-3 cursor-pointer bg-transparent border-none p-0"
          >
            <div className="w-[80px] h-[40px] rounded-[30px] border-[3px] border-black flex items-center px-1 relative">
              <div
                className="w-[32px] h-[32px] rounded-full bg-black transition-all duration-200"
                style={{
                  marginLeft: isFreestyle ? '38px' : '0px',
                }}
              />
            </div>
            <span
              className="text-black"
              style={{
                fontFamily: '"Just Me Again Down Here", cursive',
                fontSize: '40px',
                lineHeight: 'normal',
              }}
            >
              {isFreestyle ? 'freestyle' : 'guided'}
            </span>
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex relative p-4 pt-6 gap-3 min-h-0">
        {/* Left toolbar */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          {/* Tool buttons */}
          <div className="bg-white border-[5px] border-black flex flex-col items-center py-3 px-2 gap-2 w-[70px]">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`w-[50px] h-[50px] flex items-center justify-center cursor-pointer
                  border-none rounded-sm transition-colors duration-150 p-1
                  ${activeTool === tool.id ? 'bg-[#ffd000]' : 'bg-transparent hover:bg-gray-100'}`}
                title={tool.label}
              >
                <img src={tool.icon} alt={tool.label} className="w-full h-full object-contain" />
              </button>
            ))}
          </div>

          {/* Color swatches */}
          {COLORS.map((c) => (
            <button
              key={c.color}
              onClick={() => {
                setActiveColor(c.color);
                if (activeTool === 'eraser') setActiveTool('pencil');
              }}
              className={`w-[28px] h-[28px] rounded-full cursor-pointer border-2 transition-transform duration-150
                ${activeColor === c.color ? 'scale-125 border-black' : 'border-transparent hover:scale-110'}`}
              style={{ backgroundColor: c.color }}
              title={c.label}
            />
          ))}
        </div>

        {/* Canvas area */}
        <div className="flex-1 relative min-h-0">
          {/* Hand-drawn border */}
          <img
            src="/canvas-border.svg"
            alt=""
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            style={{ padding: '0' }}
          />

          {/* Actual drawing canvas */}
          <div className="absolute inset-[20px] overflow-hidden">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair"
              onPointerDown={startDraw}
              onPointerMove={draw}
              onPointerUp={endDraw}
              onPointerLeave={endDraw}
            />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-end justify-between px-4 pb-4">
        {/* Save button */}
        <button
          onClick={handleSave}
          className="px-8 py-2 bg-white border-2 border-black cursor-pointer
            hover:bg-gray-100 active:scale-95 transition-all duration-200"
          style={{
            fontFamily: '"Just Me Again Down Here", cursive',
            fontSize: '40px',
            lineHeight: '16px',
            color: '#040000',
          }}
        >
          save
        </button>

        {/* AI suggestion box */}
        <div
          className="bg-white border-[4px] border-black p-4 max-w-[400px]"
        >
          <p
            className="text-black"
            style={{
              fontFamily: '"Just Me Again Down Here", cursive',
              fontSize: '36px',
              lineHeight: 'normal',
            }}
          >
            {aiMessage}
          </p>
        </div>
      </div>
    </div>
  );
}
