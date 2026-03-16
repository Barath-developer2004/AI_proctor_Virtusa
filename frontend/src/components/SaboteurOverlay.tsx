"use client";

import { useEffect, useState } from "react";

export default function SaboteurOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="space-y-4 text-center">
        {/* Animated skull */}
        <div className="text-6xl animate-bounce">💀</div>
        
        {/* Glitch text effect */}
        <h2 className="text-3xl font-black tracking-widest text-jatayu-danger">
          SABOTEUR PROTOCOL
        </h2>
        <p className="text-sm text-gray-400 max-w-xs mx-auto">
          A subtle logical bug has been injected into your code. 
          You have <span className="font-bold text-jatayu-warn">60 seconds</span> to find and fix it.
        </p>

        {/* Pulsing border */}
        <div className="mx-auto h-1 w-48 overflow-hidden rounded-full bg-jatayu-danger/30">
          <div className="h-full w-full animate-pulse bg-jatayu-danger rounded-full" />
        </div>
      </div>
    </div>
  );
}
