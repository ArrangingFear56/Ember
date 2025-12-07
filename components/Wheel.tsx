import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Player } from '../types';

interface WheelProps {
  players: Player[];
  onSpinComplete: (result: string) => void;
  isSpinning: boolean;
}

interface Segment {
  id: string;
  label: string;
  color: string;
  textColor: string;
  type: 'PLAYER' | 'GAME';
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

// Sound effects using Web Audio API
const createAudioContext = () => {
  return new (window.AudioContext || (window as any).webkitAudioContext)();
};

const playTickSound = (audioContext: AudioContext, pitch: number = 1) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800 * pitch;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.05);
};

const playSpinSound = (audioContext: AudioContext) => {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.3);
  oscillator.type = 'sawtooth';
  
  gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
};

const playWinSound = (audioContext: AudioContext) => {
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  
  notes.forEach((freq, i) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    
    const startTime = audioContext.currentTime + (i * 0.1);
    gainNode.gain.setValueAtTime(0.2, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + 0.4);
  });
};

export const Wheel: React.FC<WheelProps> = ({ players, onSpinComplete, isSpinning }) => {
  const [rotation, setRotation] = useState(0);
  const [winningSegment, setWinningSegment] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [tickCount, setTickCount] = useState(0);
  const animationRef = useRef<number>();
  const lastSegmentRef = useRef<number>(-1);
  const spinStartTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context
  useEffect(() => {
    audioContextRef.current = createAudioContext();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Generate segments
  const segments: Segment[] = useMemo(() => {
    const playerSegments: Segment[] = players.map((p, i) => ({
      id: p.id,
      label: p.name,
      color: i % 2 === 0 ? '#1e293b' : '#334155',
      textColor: '#e2e8f0',
      type: 'PLAYER'
    }));

    const gameSegments: Segment[] = [
      { id: 'RPS', label: 'RPS', color: '#8b5cf6', textColor: '#ffffff', type: 'GAME' },
      { id: 'GROUP', label: 'GROUP', color: '#f97316', textColor: '#ffffff', type: 'GAME' }
    ];

    return [...playerSegments, ...gameSegments];
  }, [players]);

  const segmentAngle = 360 / segments.length;

  // Particle animation
  useEffect(() => {
    if (particles.length === 0) return;

    const animate = () => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.5, // gravity
            life: p.life - 1
          }))
          .filter(p => p.life > 0)
      );
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [particles.length > 0]);

  // Confetti burst
  const createConfetti = () => {
    const newParticles: Particle[] = [];
    const colors = ['#8b5cf6', '#f97316', '#ec4899', '#10b981', '#3b82f6', '#f59e0b'];
    
    for (let i = 0; i < 50; i++) {
      const angle = (Math.PI * 2 * i) / 50;
      const velocity = 8 + Math.random() * 6;
      newParticles.push({
        id: Date.now() + i,
        x: 160, // center of 320px wheel
        y: 160,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 3,
        life: 60 + Math.random() * 40,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 4
      });
    }
    
    setParticles(newParticles);
  };

  // Main spinning logic
  useEffect(() => {
    if (isSpinning) {
      spinStartTimeRef.current = Date.now();
      setWinningSegment(null);
      setShowConfetti(false);
      setTickCount(0);
      lastSegmentRef.current = -1;

      // Play spin start sound
      // if (audioContextRef.current) {
      //   playSpinSound(audioContextRef.current);
      // }

      // Calculate winning segment
      const randomOffset = Math.random() * 360;
      const spins = 1800 + Math.random() * 720; // 5-7 full spins
      const newRotation = rotation + spins + randomOffset;
      
      setRotation(newRotation);

      // Calculate winner and show celebration
      const finalTimer = setTimeout(() => {
        const normalizedRotation = newRotation % 360;
        const effectiveAngle = (360 - normalizedRotation) % 360;
        const winningIndex = Math.floor(effectiveAngle / segmentAngle);
        const safeIndex = Math.min(segments.length - 1, Math.max(0, winningIndex));
        const winner = segments[safeIndex];

        setWinningSegment(winner.id);
        setShowConfetti(true);
        createConfetti();
        
        // Play win sound
        if (audioContextRef.current) {
          playWinSound(audioContextRef.current);
        }
        
        // Wait longer before closing to enjoy the celebration
        setTimeout(() => {
          onSpinComplete(winner.id);
        }, 2000);
      }, 4000);

      return () => {
        clearTimeout(finalTimer);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpinning]);

  // Tick sound effect with varying pitch using requestAnimationFrame
  useEffect(() => {
    if (!isSpinning) return;

    const startRotation = rotation - (1800 + Math.random() * 720 + Math.random() * 360);
    const endRotation = rotation;
    const duration = 4000; // 4 seconds
    let animationId: number;

    // Cubic bezier easing function (0.17, 0.67, 0.12, 0.99)
    const easeOutCubic = (t: number): number => {
      const p0 = 0, p1 = 0.17, p2 = 0.12, p3 = 1;
      const cp1 = 0.67, cp2 = 0.99;
      
      // Simplified cubic bezier calculation for t
      const t2 = t * t;
      const t3 = t2 * t;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;
      
      return mt3 * p0 + 3 * mt2 * t * cp1 + 3 * mt * t2 * cp2 + t3 * p3;
    };

    const checkSegment = () => {
      const elapsed = Date.now() - spinStartTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      
      const currentRotation = startRotation + (endRotation - startRotation) * eased;
      const normalizedRotation = currentRotation % 360;
      const effectiveAngle = (360 - normalizedRotation + 360) % 360;
      const currentSegment = Math.floor((effectiveAngle/2) / segmentAngle) % segments.length;
      
      if (currentSegment !== lastSegmentRef.current && lastSegmentRef.current !== -1) {
        setTickCount(prev => prev + 1);
        
        if (elapsed < 3500 && audioContextRef.current) {
          // Vary pitch based on speed - higher pitch as it slows down
          const pitchFactor = Math.min(0.9, 0.1 + (elapsed / 3500) * 0.9);
          playTickSound(audioContextRef.current, pitchFactor);
        }
      }
      
      lastSegmentRef.current = currentSegment;
      
      if (progress < 1) {
        animationId = requestAnimationFrame(checkSegment);
      }
    };

    animationId = requestAnimationFrame(checkSegment);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isSpinning, rotation, segmentAngle, segments.length]);

  // Generate gradient
  const gradientString = useMemo(() => {
    return `conic-gradient(
      ${segments.map((seg, i) => {
        const start = i * segmentAngle;
        const end = (i + 1) * segmentAngle;
        return `${seg.color} ${start}deg ${end}deg`;
      }).join(', ')}
    )`;
  }, [segments, segmentAngle]);

  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-8 relative">
      
      {/* Speed lines during spinning */}
      {isSpinning && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 animate-spin-fast">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 w-1 h-32 bg-gradient-to-t from-violet-500/0 via-violet-400/30 to-violet-500/0 blur-sm"
                style={{
                  transform: `rotate(${i * 30}deg) translateY(-50%)`,
                  transformOrigin: '0 0'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Wheel Container */}
      <div className="relative w-80 h-80 sm:w-96 sm:h-96">
        
        {/* Glow effect during spinning */}
        {isSpinning && (
          <div className="absolute inset-0 rounded-full bg-gradient-radial from-violet-500/20 via-purple-500/10 to-transparent animate-pulse-slow blur-2xl" />
        )}

        {/* Indicator Arrow with animation */}
        <div 
          className={`absolute -top-6 left-1/2 transform -translate-x-1/2 z-20 transition-all duration-200 ${
            isSpinning ? 'scale-110' : 'scale-100'
          } ${tickCount % 2 === 0 && isSpinning ? 'drop-shadow-[0_0_15px_rgba(139,92,246,0.8)]' : 'drop-shadow-lg'}`}
        >
          <div className={`w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] ${
            isSpinning ? 'border-t-violet-400' : 'border-t-white'
          } transition-colors duration-200`}></div>
          {isSpinning && (
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 animate-ping">
             </div>
          )}
        </div>

        {/* Particle effects */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 rounded-full pointer-events-none"
            style={{
              left: particle.x,
              top: particle.y,
              backgroundColor: particle.color,
              width: particle.size,
              height: particle.size,
              opacity: particle.life / 100,
              boxShadow: `0 0 10px ${particle.color}`
            }}
          />
        ))}

        {/* The Wheel */}
        <div 
          className={`w-full h-full rounded-full border-8 shadow-2xl overflow-hidden relative transition-all ${
            isSpinning 
              ? 'border-violet-500/50 shadow-[0_0_80px_-12px_rgba(139,92,246,0.6)] scale-105' 
              : 'border-white/20 shadow-[0_0_50px_-12px_rgba(139,92,246,0.3)] scale-100'
          }`}
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning 
              ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' 
              : 'transform 0.3s ease-out, scale 0.3s ease, border 0.3s ease, box-shadow 0.3s ease'
          }}
        >
          {/* Segments Background */}
          <div 
            className="w-full h-full rounded-full"
            style={{ background: gradientString }}
          />

          {/* Winning segment highlight */}
          {winningSegment && (
            <div className="absolute inset-0">
              <div
                className="absolute inset-0 rounded-full animate-pulse-fast"
                style={{
                  background: `conic-gradient(
                    ${segments.map((seg, i) => {
                      const start = i * segmentAngle;
                      const end = (i + 1) * segmentAngle;
                      const isWinner = seg.id === winningSegment;
                      return `${isWinner ? 'rgba(255, 255, 255, 0.3)' : 'transparent'} ${start}deg ${end}deg`;
                    }).join(', ')}
                  )`
                }}
              />
            </div>
          )}

          {/* Segment dividers and labels using SVG overlay */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400" style={{ pointerEvents: 'none' }}>
            <defs>
              {segments.map((seg, i) => (
                <path
                  key={`path-${seg.id}`}
                  id={`segment-path-${seg.id}`}
                  d={`M 200 200 L 200 50 A 150 150 0 0 1 ${
                    200 + 150 * Math.sin((segmentAngle * Math.PI) / 180)
                  } ${
                    200 - 150 * Math.cos((segmentAngle * Math.PI) / 180)
                  } Z`}
                  transform={`rotate(${i * segmentAngle} 200 200)`}
                />
              ))}
            </defs>
            
            {/* Divider lines */}
            {segments.map((seg, i) => {
              const angle = i * segmentAngle;
              const radian = (angle - 90) * (Math.PI / 180);
              const x2 = 200 + 200 * Math.cos(radian);
              const y2 = 200 + 200 * Math.sin(radian);
              
              return (
                <line
                  key={`line-${seg.id}`}
                  x1="200"
                  y1="200"
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="2"
                />
              );
            })}
            
            {/* Text labels */}
            {segments.map((seg, i) => {
              const angle = (i * segmentAngle) + (segmentAngle / 2);
              const radian = (angle - 90) * (Math.PI / 180);
              
              // Position text at about 65% of radius from center
              const radius = 105;
              const x = 200 + radius * Math.cos(radian);
              const y = 200 + radius * Math.sin(radian);
              
              const isWinner = winningSegment === seg.id;
              
              return (
                <g key={`text-${seg.id}`}>
                  {/* Background for better readability */}
                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${angle} ${x} ${y})`}
                    className={`font-bold uppercase transition-all ${
                      isWinner ? 'animate-pulse-fast' : ''
                    }`}
                    style={{
                      fontSize: seg.type === 'GAME' ? '20px' : '16px',
                      fill: seg.textColor,
                      letterSpacing: '0.1em',
                      filter: isWinner 
                        ? 'drop-shadow(0 0 8px rgba(255,255,255,0.9)) drop-shadow(0 0 16px rgba(255,255,255,0.6))' 
                        : 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                      fontWeight: isWinner ? '900' : '700',
                    }}
                  >
                    {seg.label}
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* Center Cap */}
          <div className={`absolute top-1/2 left-1/2 w-20 h-20 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full transform -translate-x-1/2 -translate-y-1/2 border-4 shadow-inner flex items-center justify-center z-10 transition-all ${
            isSpinning 
              ? 'border-violet-500 shadow-[0_0_30px_rgba(139,92,246,0.5)] scale-110' 
              : 'border-slate-700 scale-100'
          }`}>
            <span className={`text-3xl transition-transform ${isSpinning ? 'animate-spin-slow' : ''}`}>
              
            </span>
          </div>
        </div>

        {/* Ring indicators */}
        {isSpinning && (
          <>
            <div className="absolute inset-0 rounded-full border-4 border-violet-500/30 animate-ping-slow" style={{ animationDelay: '0s' }} />
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 animate-ping-slow" style={{ animationDelay: '0.5s' }} />
          </>
        )}
      </div>

      {/* Status text */}
      <div className="text-center space-y-2">
        {showConfetti && (
          <div className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-bounce mb-2">
            🎉 The Die is Cast! 🎉
          </div>
        )}
        <p className={`text-sm font-medium uppercase tracking-widest transition-all ${
          isSpinning ? 'text-violet-400 text-lg' : 'opacity-60'
        }`}>
          {isSpinning 
            ? "🌟 SPINNING... 🌟" 
            : showConfetti 
              ? "The Die is Cast!"
              : "Ready to Spin!"
          }
        </p>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes spin-fast {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes pulse-fast {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        .animate-spin-fast {
          animation: spin-fast 0.5s linear infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        .animate-pulse-fast {
          animation: pulse-fast 0.5s ease-in-out infinite;
        }
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
};