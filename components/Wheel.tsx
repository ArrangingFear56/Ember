import React, { useEffect, useRef, useState } from 'react';
import { Player } from '../types';

interface WheelProps {
  players: Player[];
  onSpinEnd: (winner: Player) => void;
  winner: Player | null;
  isSpinning: boolean;
}

// Premium "Jewel Tone" Palette
const COLORS = [
  '#6366f1', // Indigo 500
  '#ec4899', // Pink 500
  '#10b981', // Emerald 500
  '#f59e0b', // Amber 500
  '#8b5cf6', // Violet 500
  '#06b6d4', // Cyan 500
  '#f43f5e', // Rose 500
  '#14b8a6', // Teal 500
];

export const Wheel: React.FC<WheelProps> = ({ players, onSpinEnd, winner, isSpinning }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);

  // Draw the wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || players.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const arcSize = (2 * Math.PI) / players.length;

    players.forEach((player, i) => {
      const angle = i * arcSize;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle, angle + arcSize);
      ctx.lineTo(centerX, centerY);
      
      // Gradient Fill for Premium Look
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      const color = COLORS[i % COLORS.length];
      gradient.addColorStop(0, color);
      // Darken the outer edge slightly for depth
      // We simulate this by drawing the color, then overlaying a gradient
      ctx.fillStyle = color;
      ctx.fill();
      
      // Inner Shadow/Gradient effect
      const gradientOverlay = ctx.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius);
      gradientOverlay.addColorStop(0, 'rgba(255,255,255,0.1)');
      gradientOverlay.addColorStop(1, 'rgba(0,0,0,0.1)');
      ctx.fillStyle = gradientOverlay;
      ctx.fill();

      // Text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      
      // Typography
      // Increased size to 50px and weight to 900 for maximum impact
      ctx.font = '900 50px Inter, system-ui, sans-serif'; 
      
      // Text Shadow/Outline for clarity
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 4;
      // Moved text closer to edge (radius - 20) to utilize wider part of slice
      ctx.strokeText(player.name, radius - 20, 0);

      ctx.fillStyle = '#ffffff'; 
      ctx.fillText(player.name, radius - 20, 0);
      
      ctx.restore();
    });

    // Outer Ring (Clean finish)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 12;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.stroke();

    // Pointer
    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    // Make pointer sharp and modern
    ctx.moveTo(centerX + 30, centerY - 12); 
    ctx.lineTo(centerX + 65, centerY);     
    ctx.lineTo(centerX + 30, centerY + 12); 
    ctx.fill();
    // Add shadow to pointer
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = 15;

  }, [players]);

  // Handle spin logic
  useEffect(() => {
    if (isSpinning && winner) {
      // Determine target angle
      const winnerIndex = players.findIndex(p => p.id === winner.id);
      if (winnerIndex === -1) return;

      const arcSize = 360 / players.length;
      
      const targetSegmentAngle = (winnerIndex * arcSize) + (arcSize / 2); // Center of segment
      const totalRotation = 360 * 5 + (360 - targetSegmentAngle); // 5 full spins + alignment
      
      setRotation(prev => prev + totalRotation);

      const timer = setTimeout(() => {
        onSpinEnd(winner);
      }, 4000); // 4s spin duration

      return () => clearTimeout(timer);
    }
  }, [isSpinning, winner, players, onSpinEnd]);

  if (players.length === 0) return null;

  return (
    <div className="relative w-full max-w-[340px] aspect-square mx-auto">
      {/* Static Tick Indicator */}
      <div className="absolute top-1/2 right-[-20px] transform -translate-y-1/2 z-10 filter drop-shadow-xl">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
           <path d="M5 12L19 4V20L5 12Z" />
        </svg>
      </div>

      <div 
        className="w-full h-full rounded-full overflow-hidden shadow-[0_0_50px_-10px_rgba(255,255,255,0.1)] ring-8 ring-slate-800/50 backdrop-blur-sm"
        style={{
          transform: `rotate(-${rotation}deg)`,
          transition: isSpinning ? 'transform 4s cubic-bezier(0.1, 0.7, 0.1, 1)' : 'none'
        }}
      >
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={800} 
          className="w-full h-full"
        />
      </div>
    </div>
  );
};