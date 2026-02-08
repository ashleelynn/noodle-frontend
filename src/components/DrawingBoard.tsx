import { useRef, useEffect, useState, useCallback } from 'react';

type Tool = 'pen' | 'brush' | 'pencil' | 'eraser';

const TOOL_CONFIG: Record<Tool, { width: number; opacity: number; cap: CanvasLineCap }> = {
  pen: { width: 4, opacity: 1, cap: 'round' },
  brush: { width: 12, opacity: 0.8, cap: 'round' },
  pencil: { width: 4, opacity: 1, cap: 'round' },
  eraser: { width: 24, opacity: 1, cap: 'round' },
};

const TOOLS: { id: Tool; icon: string; label: string }[] = [
  { id: 'pen', icon: '/tool-pen.svg', label: 'Pen' },
  { id: 'brush', icon: '/tool-brush.svg', label: 'Brush' },
  { id: 'pencil', icon: '/tool-pencil.svg', label: 'Pencil' },
  { id: 'eraser', icon: '/tool-eraser.svg', label: 'Eraser' },
];

const COLORS = [
  { color: '#000000', icon: '/color-black.svg', label: 'Black' },
  { color: '#E21C1C', icon: '/color-red.svg', label: 'Red' },
  { color: '#FFEE00', icon: '/color-yellow.svg', label: 'Yellow' },
  { color: '#0062FF', icon: '/color-blue.svg', label: 'Blue' },
];

const hslToHex = (h: number, s: number, l: number) => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;

  if (hp >= 0 && hp < 1) {
    r = c;
    g = x;
  } else if (hp >= 1 && hp < 2) {
    r = x;
    g = c;
  } else if (hp >= 2 && hp < 3) {
    g = c;
    b = x;
  } else if (hp >= 3 && hp < 4) {
    g = x;
    b = c;
  } else if (hp >= 4 && hp < 5) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const m = l - c / 2;
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToRgb = (hex: string) => {
  if (!hex.startsWith('#') || hex.length !== 7) return null;
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
};

interface DrawingBoardProps {
  aiMessage?: string;
  drawingPrompt?: string;
  onSave?: (dataUrl: string) => void;
  onSpeakMessage?: (message: string) => void;
  onProfile?: () => void;
}

export default function DrawingBoard({
  aiMessage = 'start drawing! i\'ll give you tips along the way',
  drawingPrompt = 'dinosaur\'s birthday',
  onSave,
  onSpeakMessage,
  onProfile,
}: DrawingBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const lastPressure = useRef(1);
  const isWheelDragging = useRef(false);

  const [activeTool, setActiveTool] = useState<Tool>('pen');
  const [activeColor, setActiveColor] = useState('#000000');
  const [isFreestyle, setIsFreestyle] = useState(true);
  const [showColorWheel, setShowColorWheel] = useState(false);
  const isIpad = (() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    const platform = navigator.platform;
    const touchPoints = navigator.maxTouchPoints || 0;
    return /iPad/.test(ua) || (platform === 'MacIntel' && touchPoints > 1);
  })();

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
      let imageData: ImageData | undefined;
      try {
        imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
      } catch {
        imageData = undefined;
      }

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.fillStyle = '#f4f1ed';
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

  const getCanvasPosFromClient = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const getPressure = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== 'pen') return 1;
    return Math.max(0.1, e.pressure || 0.1);
  }, []);

  const shouldHandleDrawingPointer = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return true;
    if (isIpad) return e.pointerType === 'pen';
    return e.pointerType !== 'touch';
  }, [isIpad]);

  const drawPencilGrain = useCallback((
    ctx: CanvasRenderingContext2D,
    from: { x: number; y: number },
    to: { x: number; y: number },
    color: string,
    width: number,
  ) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 1) return;

    const dots = Math.max(18, Math.floor(distance * 4.2));
    const jitter = Math.max(1.4, width * 2.2);

    ctx.save();
    ctx.fillStyle = color;
    for (let i = 0; i < dots; i += 1) {
      const t = i / dots;
      const x = from.x + dx * t + (Math.random() - 0.5) * jitter;
      const y = from.y + dy * t + (Math.random() - 0.5) * jitter;
      const r = 0.3 + Math.random() * 1.2;
      ctx.globalAlpha = 0.08 + Math.random() * 0.14;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }, []);

  const drawStrokeTo = useCallback((clientX: number, clientY: number, pressure: number) => {
    if (!isDrawing.current || !lastPos.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasPosFromClient(clientX, clientY);
    const config = TOOL_CONFIG[activeTool];
    const blendedPressure = (lastPressure.current + pressure) / 2;

    let strokeWidth = config.width;
    let strokeOpacity = config.opacity;
    let strokeStyle = activeTool === 'eraser' ? '#f4f1ed' : activeColor;

    if (activeTool === 'brush') {
      strokeWidth = Math.max(4, config.width * (0.35 + blendedPressure * 1.05));
      strokeOpacity = Math.min(1, 0.3 + blendedPressure * 0.7);
      const rgb = hexToRgb(activeColor);
      if (rgb) {
        const { r, g, b } = rgb;
        strokeStyle = `rgba(${r}, ${g}, ${b}, ${strokeOpacity})`;
      }
    } else if (activeTool === 'pencil') {
      strokeWidth = config.width * 0.9;
      strokeOpacity = 0.72;
    }

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = config.cap;
    ctx.globalAlpha = activeTool === 'brush' ? 1 : strokeOpacity;
    ctx.stroke();

    if (activeTool === 'pencil') {
      drawPencilGrain(ctx, lastPos.current, pos, activeColor, strokeWidth);
    }

    ctx.globalAlpha = 1;

    lastPos.current = pos;
    lastPressure.current = pressure;
  }, [activeTool, activeColor, drawPencilGrain, getCanvasPosFromClient]);

  const beginStroke = useCallback((clientX: number, clientY: number, pressure: number) => {
    isDrawing.current = true;
    lastPos.current = getCanvasPosFromClient(clientX, clientY);
    lastPressure.current = pressure;
  }, [getCanvasPosFromClient]);

  const startDraw = useCallback((e: React.PointerEvent) => {
    if (!shouldHandleDrawingPointer(e)) return;
    e.preventDefault();
    beginStroke(e.clientX, e.clientY, getPressure(e));
    // Capture pointer for smooth drawing
    const target = e.target as HTMLElement;
    if (typeof target.setPointerCapture === 'function') {
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // Safari may reject pointer capture; drawing should continue without it.
      }
    }
  }, [beginStroke, getPressure, shouldHandleDrawingPointer]);

  const draw = useCallback((e: React.PointerEvent) => {
    if (!shouldHandleDrawingPointer(e)) return;
    drawStrokeTo(e.clientX, e.clientY, getPressure(e));
  }, [drawStrokeTo, getPressure, shouldHandleDrawingPointer]);

  const endDraw = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
    lastPressure.current = 1;
  }, []);

  const isStylusTouch = (touch: unknown) => {
    const typed = touch as { touchType?: string };
    return (typed.touchType ?? '') === 'stylus';
  };

  const startDrawTouch = useCallback((e: React.TouchEvent) => {
    if (!isIpad) return;
    const touch = e.touches[0];
    if (!touch || !isStylusTouch(touch)) return;
    e.preventDefault();
    beginStroke(touch.clientX, touch.clientY, 1);
  }, [beginStroke, isIpad]);

  const drawTouch = useCallback((e: React.TouchEvent) => {
    if (!isIpad) return;
    const touch = e.touches[0];
    if (!touch || !isStylusTouch(touch)) return;
    e.preventDefault();
    drawStrokeTo(touch.clientX, touch.clientY, 1);
  }, [drawStrokeTo, isIpad]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    if (onSave) {
      onSave(dataUrl);
    }
  };

  const pickFromColorWheel = useCallback((clientX: number, clientY: number, target: HTMLDivElement) => {
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const radius = rect.width / 2;
    const distance = Math.hypot(dx, dy);

    if (distance > radius) return;

    const hue = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    const saturation = Math.min(1, distance / radius);
    const color = hslToHex(hue, saturation, 0.5);
    setActiveColor(color);
    if (activeTool === 'eraser') setActiveTool('pencil');
  }, [activeTool]);

  const handleWheelPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    isWheelDragging.current = true;
    pickFromColorWheel(e.clientX, e.clientY, e.currentTarget);
  }, [pickFromColorWheel]);

  const handleWheelPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isWheelDragging.current) return;
    e.preventDefault();
    pickFromColorWheel(e.clientX, e.clientY, e.currentTarget);
  }, [pickFromColorWheel]);

  const handleWheelPointerEnd = useCallback(() => {
    isWheelDragging.current = false;
  }, []);

  const handleWheelTouch = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0] ?? e.changedTouches[0];
    if (!touch) return;
    e.preventDefault();
    pickFromColorWheel(touch.clientX, touch.clientY, e.currentTarget);
  }, [pickFromColorWheel]);

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

        {/* Right side: toggle + person icon */}
        <div className="flex items-center gap-6">
          {/* Toggle */}
          <button
            onClick={() => setIsFreestyle((f) => !f)}
            className="flex items-center gap-3 cursor-pointer bg-transparent border-none p-0"
          >
            <div
              className={`w-[80px] h-[40px] rounded-[30px] border-[3px] border-black flex items-center px-1 relative transition-colors duration-200
                ${isFreestyle ? 'bg-transparent' : 'bg-black'}`}
            >
              <div
                className={`w-[32px] h-[32px] rounded-full transition-all duration-200
                  ${isFreestyle ? 'bg-black' : 'bg-white'}`}
                style={{
                  marginLeft: isFreestyle ? '38px' : '0px',
                }}
              />
            </div>
            <span
              className="text-black whitespace-nowrap"
              style={{
                fontFamily: '"Just Me Again Down Here", cursive',
                fontSize: '48px',
                lineHeight: 'normal',
              }}
            >
              {isFreestyle ? 'freestyle' : 'buddy mode'}
            </span>
          </button>

          {/* Person icon → profile */}
          <button
            onClick={onProfile}
            className="cursor-pointer bg-transparent border-none p-0"
            title="My profile"
          >
            <img src="/profile.svg" alt="My profile" className="w-[53px] h-[67px] object-contain" />
          </button>
        </div>
      </div>

      {/* Full-size canvas (bottom layer) */}
      <div className="flex-1 relative min-h-0">
        {/* Hand-drawn border overlay */}
        <img
          src="/canvas-border.svg"
          alt=""
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        <div className="absolute inset-0">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            style={{ touchAction: 'none' }}
            onPointerDown={startDraw}
            onPointerMove={draw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
            onTouchStart={startDrawTouch}
            onTouchMove={drawTouch}
            onTouchEnd={endDraw}
            onTouchCancel={endDraw}
          />
        </div>

        {/* Left toolbar (floating on top) */}
        <div className="absolute top-4 left-4 z-20">
          <div
            className="bg-white border-[5px] border-black flex flex-col items-center py-3 px-2 gap-2 w-[70px]"
            style={{ filter: 'url(#pencil-border)' }}
          >
            {/* Tool buttons */}
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

            {/* Divider */}
            <div className="w-[50px] h-[2px] bg-black/20" />

            {/* Color swatches */}
            {COLORS.map((c) => (
              <button
                key={c.color}
                onClick={() => {
                  setActiveColor(c.color);
                  if (activeTool === 'eraser') setActiveTool('pencil');
                }}
                className={`w-[36px] h-[36px] flex items-center justify-center cursor-pointer border-2 rounded-sm transition-transform duration-150
                  ${activeColor === c.color ? 'scale-125 border-black' : 'border-transparent hover:scale-110'}`}
                title={c.label}
              >
                <img src={c.icon} alt={c.label} className="w-full h-full object-contain" />
              </button>
            ))}

            {/* Color palette picker */}
            <button
              onClick={() => setShowColorWheel((v) => !v)}
              className="w-[42px] h-[42px] flex items-center justify-center cursor-pointer border-none bg-transparent hover:scale-110 transition-transform duration-150"
              title="Choose color"
            >
              <img src="/color-palette.svg" alt="Choose color" className="w-full h-full object-contain" />
            </button>
          </div>

          {showColorWheel && (
            <div
              className="absolute left-[86px] top-0 z-30 bg-white border-[5px] border-black p-3"
              style={{ filter: 'url(#pencil-border)' }}
            >
              <div
                className="relative w-[170px] h-[170px] rounded-full cursor-crosshair"
                style={{
                  backgroundImage: `
                    radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.12) 58%, rgba(255,255,255,0) 74%),
                    conic-gradient(#ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)
                  `,
                  touchAction: 'none',
                }}
                onPointerDown={handleWheelPointerDown}
                onPointerMove={handleWheelPointerMove}
                onPointerUp={handleWheelPointerEnd}
                onPointerCancel={handleWheelPointerEnd}
                onPointerLeave={handleWheelPointerEnd}
                onTouchStart={handleWheelTouch}
                onTouchMove={handleWheelTouch}
                onTouchEnd={handleWheelPointerEnd}
                aria-label="Color wheel"
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span
                  className="text-black text-[14px]"
                  style={{ fontFamily: '"Just Me Again Down Here", cursive' }}
                >
                  wheel
                </span>
                <div
                  className="w-[28px] h-[28px] rounded-full border-2 border-black"
                  style={{ backgroundColor: activeColor }}
                  title={activeColor}
                />
              </div>
            </div>
          )}
        </div>

        {/* Drawing prompt — buddy mode only (floating on top) */}
        {!isFreestyle && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white border-[4px] border-black px-6 py-3"
            style={{ filter: 'url(#pencil-border)' }}
          >
            <p
              className="text-black text-center"
              style={{
                fontFamily: '"Just Me Again Down Here", cursive',
                fontSize: '48px',
                lineHeight: 'normal',
              }}
            >
              {drawingPrompt}
            </p>
          </div>
        )}

        {/* Bottom bar (floating on top) */}
        <div className="absolute bottom-4 left-4 right-4 z-20 flex items-end justify-between pointer-events-none">
          {/* Save button */}
          <button
            onClick={handleSave}
            className="pointer-events-auto w-[220px] h-[88px] bg-white border-[6px] border-black cursor-pointer
              flex items-center justify-center
              hover:bg-gray-100 active:scale-95 transition-all duration-200"
            style={{
              fontFamily: '"Just Me Again Down Here", cursive',
              fontSize: '56px',
              lineHeight: '20px',
              color: '#040000',
              filter: 'url(#pencil-border)',
            }}
          >
            save
          </button>

          {/* AI suggestion box */}
          <div
            className="pointer-events-auto w-[560px] min-h-[150px] bg-white border-[6px] border-black p-5"
            style={{ filter: 'url(#pencil-border)' }}
          >
            <p
              className="text-black"
              style={{
                fontFamily: '"Just Me Again Down Here", cursive',
                fontSize: '52px',
                lineHeight: 'normal',
              }}
            >
              {aiMessage}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
