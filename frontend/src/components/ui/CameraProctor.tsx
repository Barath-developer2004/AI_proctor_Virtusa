"use client";

import { useEffect, useRef, useState } from "react";
import { sessionAPI } from "@/lib/api";

interface Props {
  sessionId: string;
}

export default function CameraProctor({ sessionId }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [volume, setVolume] = useState(0);
  const [motion, setMotion] = useState(0);
  const [warning, setWarning] = useState<string | null>(null);

  // Audio Context refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);

  // Motion Context refs
  const prevFrameRef = useRef<ImageData | null>(null);
  
  // Rate limiting ref
  const lastViolationRef = useRef<number>(0);

  // Dragging state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number, startY: number, initialX: number, initialY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    // Find absolute position of the widget right before dragging
    const rect = e.currentTarget.parentElement!.getBoundingClientRect();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: rect.left,
      initialY: rect.top,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragStartRef.current) {
        const dx = e.clientX - dragStartRef.current.startX;
        const dy = e.clientY - dragStartRef.current.startY;
        setPosition({
          x: dragStartRef.current.initialX + dx,
          y: dragStartRef.current.initialY + dy
        });
        setHasMoved(true);
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    let animationFrameId: number;
    let isSubscribed = true;

    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
          audio: true,
        });
        
        if (!isSubscribed) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        
        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // --- Audio Processing ---
        const AudioContextCls = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextCls();
        audioCtxRef.current = audioCtx;
        const analyzer = audioCtx.createAnalyser();
        analyzer.fftSize = 256;
        analyzerRef.current = analyzer;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyzer);

        const dataArray = new Uint8Array(analyzer.frequencyBinCount);
        
        let lastFrameTime = performance.now();

        // --- Video/Audio Loop ---
        const loop = () => {
          // 1. Analyze Audio
          analyzer.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avgVolume = sum / dataArray.length;
          setVolume(Math.min(100, Math.round((avgVolume / 128) * 100)));

          const now = performance.now();
          if (avgVolume > 80 && (now - lastViolationRef.current > 3000)) {
            lastViolationRef.current = now;
            setWarning("Noise detected");
            sessionAPI.reportViolation(sessionId, "audio_spike").catch(() => {});
          }

          // 2. Analyze Motion (Frame Diffing) throttled to 4 FPS
          if (now - lastFrameTime > 250) {
            if (
              videoRef.current &&
              canvasRef.current &&
              videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
            ) {
              const ctx = canvasRef.current.getContext("2d", { willReadFrequently: true });
              if (ctx) {
                const width = canvasRef.current.width;
                const height = canvasRef.current.height;
                // Draw video frame to canvas
                ctx.drawImage(videoRef.current, 0, 0, width, height);
                const currentFrame = ctx.getImageData(0, 0, width, height);

                if (prevFrameRef.current) {
                  let diffSum = 0;
                  // Check a sub-grid of pixels for performance (skip 16 bytes = 4 pixels)
                  for (let i = 0; i < currentFrame.data.length; i += 16) {
                    const rDist = Math.abs(currentFrame.data[i] - prevFrameRef.current.data[i]);
                    const gDist = Math.abs(currentFrame.data[i + 1] - prevFrameRef.current.data[i + 1]);
                    const bDist = Math.abs(currentFrame.data[i + 2] - prevFrameRef.current.data[i + 2]);
                    
                    // if pixel moved significantly (color deviation)
                    if (rDist + gDist + bDist > 120) {
                      diffSum++;
                    }
                  }
                  
                  // Max possible pixels checked
                  const pixelsChecked = currentFrame.data.length / 16;
                  const motionPercentage = Math.min(100, Math.round((diffSum / pixelsChecked) * 200)); 
                  setMotion(motionPercentage);

                  if (motionPercentage > 45 && (now - lastViolationRef.current > 3000)) {
                    lastViolationRef.current = now;
                    setWarning("Head movement detected");
                    sessionAPI.reportViolation(sessionId, "head_movement").catch(() => {});
                  }
                }
                prevFrameRef.current = currentFrame;
              }
            }
            lastFrameTime = now;
          }

          animationFrameId = requestAnimationFrame(loop);
        };

        loop();
      } catch (err) {
        console.error("Camera/Mic access denied", err);
      }
    };

    startMedia();

    return () => {
      isSubscribed = false;
      cancelAnimationFrame(animationFrameId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioCtxRef.current?.state !== "closed") {
        audioCtxRef.current?.close().catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Toast auto-clear
  useEffect(() => {
    if (warning) {
      const timer = setTimeout(() => setWarning(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [warning]);

  const widgetStyle: React.CSSProperties = hasMoved
    ? { left: position.x, top: position.y, bottom: 'auto', margin: 0 }
    : { left: '2rem', bottom: '2rem' };

  return (
    <div 
      className="fixed z-50 overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl transition-shadow hover:shadow-cyan-500/20 w-64 pointer-events-none"
      style={widgetStyle}
    >
      {/* Header - Draggable */}
      <div 
        className="bg-gray-800 px-3 py-2 flex items-center justify-between border-b border-gray-700 pointer-events-auto cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-semibold text-gray-200 uppercase tracking-widest">Live Proctor</span>
        </div>
      </div>

      {/* Video Feed */}
      <div className="relative aspect-video bg-black pointer-events-auto">
        <video
          ref={videoRef}
          className="h-full w-full object-cover scale-x-[-1]" /* flip horizontally to act like a mirror */
          autoPlay
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" width={320} height={240} />

        {/* AI Tracking Overlay Box (decorative advanced framing) */}
        <div className="absolute inset-4 border border-cyan-500/30 rounded-lg pointer-events-none transition-all duration-300 pointer-events-none" style={{ borderColor: motion > 45 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(6, 182, 212, 0.3)' }}>
          <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-cyan-400" style={{ borderColor: motion > 45 ? '#ef4444' : '#22d3ee' }} />
          <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-cyan-400" style={{ borderColor: motion > 45 ? '#ef4444' : '#22d3ee' }} />
          <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-cyan-400" style={{ borderColor: motion > 45 ? '#ef4444' : '#22d3ee' }} />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-cyan-400" style={{ borderColor: motion > 45 ? '#ef4444' : '#22d3ee' }} />
        </div>

        {/* Warning Toast */}
        {warning && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-600/90 text-white text-[10px] uppercase font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap backdrop-blur-sm animate-pulse z-10 pointer-events-none">
            {warning}
          </div>
        )}
      </div>

      {/* Metrics Footer */}
      <div className="p-3 space-y-3 bg-gray-900 pointer-events-auto">
        {/* Mic Level */}
        <div>
          <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-mono uppercase tracking-wider">
            <span>MIC Feed</span>
            <span>{volume}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${volume > 80 ? "bg-red-500" : "bg-cyan-500"}`}
              style={{ width: `${volume}%` }}
            />
          </div>
        </div>

        {/* Motion Tracker */}
        <div>
          <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-mono uppercase tracking-wider">
            <span>Movement</span>
            <span>{motion}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${motion > 45 ? "bg-red-500" : "bg-orange-500"}`}
              style={{ width: `${motion}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
