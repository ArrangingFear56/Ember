import React, { useState, useEffect, useCallback } from 'react';
import { Settings, UserPlus, Users, Trophy, Hand, RotateCcw, X, Info, Volume2, VolumeX, Sparkles, AlertCircle, Shuffle, ArrowRight, Play } from 'lucide-react';
import { Wheel } from './components/Wheel';
import { Player, Stage, GameState, RoundContext, Config, Prompt } from './types';
import { 
  selectWeightedPlayer, 
  selectRoundType, 
  getPromptsForRound, 
  getPointingPrompt,
  getDifficultyColor,
  getStageName
} from './utils';
import { useTTS } from './hooks/useTTS';

// --- Default Data ---
const DEFAULT_CONFIG: Config = {
  enablePreRoll: true,
  useWeightedFairness: true,
  useDifficultyBalancing: true,
  stageLock: false,
};

// --- Branding Component ---
const EmberLogo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="gradTop" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" /> {/* Yellow 300 */}
        <stop offset="100%" stopColor="#FBBF24" /> {/* Amber 400 */}
      </linearGradient>
      <linearGradient id="gradMid" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FBBF24" /> {/* Amber 400 */}
        <stop offset="100%" stopColor="#FB923C" /> {/* Orange 400 */}
      </linearGradient>
      <linearGradient id="gradBot" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FB923C" /> {/* Orange 400 */}
        <stop offset="100%" stopColor="#EA580C" /> {/* Orange 600 */}
      </linearGradient>
      <filter id="soft-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Top Diamond */}
    <rect x="37" y="9" width="26" height="26" rx="5" transform="rotate(45 50 22)" fill="url(#gradTop)" />
    
    {/* Left Diamond */}
    <rect x="9" y="37" width="26" height="26" rx="5" transform="rotate(45 22 50)" fill="url(#gradMid)" />
    
    {/* Right Diamond */}
    <rect x="65" y="37" width="26" height="26" rx="5" transform="rotate(45 78 50)" fill="url(#gradMid)" />
    
    {/* Bottom Diamond */}
    <rect x="37" y="65" width="26" height="26" rx="5" transform="rotate(45 50 78)" fill="url(#gradBot)" />
  </svg>
);

const App: React.FC = () => {
  // --- State ---
  const [players, setPlayers] = useState<Player[]>([]);
  const [hasGameStarted, setHasGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameState>('wheel');
  const [stage, setStage] = useState<Stage>('S1');
  
  // Game Logic State
  const [roundContext, setRoundContext] = useState<RoundContext>({
    selectedPlayerId: null,
    opponentPlayerId: null,
    roundType: 'Individual',
    currentPrompt: null,
    preRollOptions: [],
    isPreRollSelection: false,
  });

  const [roundHistory, setRoundHistory] = useState({
    difficulty: [] as number[],
    roundTypes: { Individual: 0, RPS: 0, Group: 0 }
  });

  const [isSpinning, setIsSpinning] = useState(false);
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  
  // Modals
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');

  // Mini Spin State (Spin Again feature)
  const [showMiniSpin, setShowMiniSpin] = useState(false);
  const [isMiniSpinning, setIsMiniSpinning] = useState(false);
  const [miniSpinWinner, setMiniSpinWinner] = useState<Player | null>(null);

  // Audio State
  const [isMuted, setIsMuted] = useState(false);
  const { speak, stop: stopTTS, resumeContext } = useTTS();

  // --- Persistence ---
  useEffect(() => {
    const saved = localStorage.getItem('ember_v1_session');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.players) setPlayers(data.players);
        if (data.stage) setStage(data.stage);
        if (data.roundHistory) setRoundHistory(data.roundHistory);
        // If we have players and history, assume game was in progress
        if (data.players && data.players.length >= 2) {
             setHasGameStarted(true);
        }
      } catch (e) { console.error("Load failed", e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ember_v1_session', JSON.stringify({
      players, stage, roundHistory
    }));
  }, [players, stage, roundHistory]);

  // --- Helpers ---
  const updatePlayerParticipation = (id: string) => {
    setPlayers(prev => prev.map(p => 
      p.id === id ? { ...p, participationCount: p.participationCount + 1 } : p
    ));
  };

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) return;
    const newP: Player = {
      id: Date.now().toString(),
      name: newPlayerName.trim(),
      participationCount: 0,
      skipToken: false
    };
    setPlayers([...players, newP]);
    setNewPlayerName('');
  };

  const handleRemovePlayer = (id: string) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const handleStartGame = () => {
      if (players.length < 2) return;
      resumeContext(); // Initialize audio context
      setHasGameStarted(true);
  };

  // --- Core Game Loop ---
  
  const startRound = () => {
    if (players.length < 2) {
      alert("Need at least 2 players!");
      return;
    }
    resumeContext(); // Ensure audio context is active
    stopTTS(); // Stop any pending speech

    // 1. Select Player
    const selected = selectWeightedPlayer(players);
    if (!selected) return;

    // 2. Determine Round Type
    let rType = selectRoundType(roundHistory.roundTypes);
    
    setGameState('wheel');
    setIsSpinning(true);
    
    setRoundContext(prev => ({
      ...prev,
      selectedPlayerId: selected.id,
      roundType: rType,
      opponentPlayerId: rType === 'RPS' ? selectWeightedPlayer(players.filter(p => p.id !== selected.id))?.id || null : null
    }));
  };

  const onWheelStop = () => {
    setIsSpinning(false);
    updatePlayerParticipation(roundContext.selectedPlayerId!);

    const winner = players.find(p => p.id === roundContext.selectedPlayerId);
    
    // Announce Winner if not muted
    if (!isMuted && winner) {
        speak(`It's ${winner.name}'s turn!`);
    }

    if (roundContext.roundType === 'Individual') {
      setupIndividualRound();
    } else if (roundContext.roundType === 'RPS') {
      const opponent = players.find(p => p.id === roundContext.opponentPlayerId);
      if (!isMuted && winner && opponent) {
         // Queue this after the winner announcement essentially (or interrupt it, which is fine)
         setTimeout(() => speak(`Rock Paper Scissors! ${winner.name} versus ${opponent.name}.`), 1500);
      }
      setGameState('rps');
    } else {
      setupGroupRound();
    }
  };

  const setupIndividualRound = () => {
    const count = config.enablePreRoll ? 3 : 1;
    const prompts = getPromptsForRound('Individual', stage, roundHistory.difficulty, count);
    
    if (config.enablePreRoll) {
      setRoundContext(prev => ({ ...prev, preRollOptions: prompts, isPreRollSelection: true, currentPrompt: null }));
    } else {
      const p = prompts[0];
      setRoundContext(prev => ({ ...prev, currentPrompt: p, isPreRollSelection: false }));
      // Automatically read prompt if selected immediately
      if (!isMuted && p) {
         setTimeout(() => speak(p.text), 1500); 
      }
    }
    setGameState('individual');
  };

  const setupGroupRound = () => {
    const prompts = getPromptsForRound('Group', stage, roundHistory.difficulty, 1);
    let prompt = prompts[0];

    if (prompt.id === 'TRIGGER_POINTING') {
      prompt = getPointingPrompt(stage);
    }

    setRoundContext(prev => ({ ...prev, currentPrompt: prompt, isPreRollSelection: false }));
    setGameState('group');
    if (!isMuted && prompt) {
        setTimeout(() => speak(prompt.text), 1500);
    }
  };

  const completeRound = (difficulty: number) => {
    stopTTS();
    setRoundHistory(prev => ({
      difficulty: [...prev.difficulty.slice(-4), difficulty], // Keep last 5
      roundTypes: {
        ...prev.roundTypes,
        [roundContext.roundType]: prev.roundTypes[roundContext.roundType] + 1
      }
    }));
    setGameState('wheel');
    setRoundContext(prev => ({ ...prev, currentPrompt: null, selectedPlayerId: null }));
  };

  const handlePreRollSelect = (prompt: Prompt) => {
    setRoundContext(prev => ({ ...prev, currentPrompt: prompt, isPreRollSelection: false }));
    if (!isMuted) {
        speak(prompt.text);
    }
  };

  const handleRPSResult = (winnerId: string | 'draw') => {
    if (winnerId === 'draw') return;

    const loserId = winnerId === roundContext.selectedPlayerId ? roundContext.opponentPlayerId : roundContext.selectedPlayerId;
    
    setRoundContext(prev => ({ ...prev, selectedPlayerId: loserId }));
    
    const activity = getPromptsForRound('Group', stage, [], 1)[0]; 
    setRoundContext(prev => ({ ...prev, currentPrompt: activity, roundType: 'Individual' })); 
    setGameState('individual');
    if (!isMuted && activity) {
        speak(activity.text);
    }
  };

  // --- Mini Spin Logic (Spin Again) ---
  const handleMiniSpinStart = () => {
    if (players.length < 2) return;
    resumeContext();
    // Don't pick the current selected player if possible
    const candidates = players.filter(p => p.id !== roundContext.selectedPlayerId);
    // Fallback if only 1 player or filtering removes everyone (unlikely in group settings)
    const pool = candidates.length > 0 ? candidates : players;
    
    // Random pick
    const winner = pool[Math.floor(Math.random() * pool.length)];
    
    setMiniSpinWinner(winner);
    setIsMiniSpinning(true);
    setShowMiniSpin(true);
  };

  const onMiniSpinStop = () => {
      setIsMiniSpinning(false);
      if(miniSpinWinner && !isMuted) {
          speak(miniSpinWinner.name);
      }
  };

  const closeMiniSpin = () => {
      setShowMiniSpin(false);
      setMiniSpinWinner(null);
  };

  // --- Renders ---

  const renderHeader = () => (
    <div className="fixed top-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-4 py-3 h-[64px] flex flex-col justify-center">
      <div className="max-w-xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
            <EmberLogo className="w-8 h-8" />
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-amber-200 to-orange-400 bg-clip-text text-transparent">Ember</h1>
        </div>
        <div className="flex gap-2">
           {/* Mute Toggle */}
           <button 
             onClick={() => {
                 if (isMuted) {
                     resumeContext();
                 } else {
                     stopTTS();
                 }
                 setIsMuted(!isMuted);
             }} 
             className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 transition-colors"
           >
             {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
           </button>

           <button onClick={() => setShowSettings(!showSettings)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 transition-colors">
             <Settings size={20} />
           </button>
           {/* Only show Add Player in header if game has started */}
           {hasGameStarted && (
               <button onClick={() => setShowPlayerModal(true)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-indigo-400 transition-colors border border-white/5">
                 <UserPlus size={20} />
               </button>
           )}
        </div>
      </div>
      
      {/* Stage Chips - Only visible if game started */}
      {hasGameStarted && (
          <div className="absolute top-[64px] left-0 right-0 flex justify-center pt-3 pb-1">
             <div className="flex gap-1.5 overflow-x-auto hide-scrollbar max-w-full px-4">
                {(['S1', 'S2', 'S3'] as Stage[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStage(s)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border whitespace-nowrap
                      ${stage === s 
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_-5px_rgba(99,102,241,0.5)]' 
                        : 'bg-white/5 border-transparent text-slate-500 hover:bg-white/10'}`}
                  >
                    {getStageName(s)}
                  </button>
                ))}
             </div>
          </div>
      )}
    </div>
  );

  const renderSetupView = () => (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 animate-in fade-in duration-700">
          <div className="mb-12 text-center flex flex-col items-center">
              <div className="mb-6 filter drop-shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                   <EmberLogo className="w-24 h-24" />
              </div>
              <h1 className="text-5xl font-black text-white tracking-tight mb-2">Ember</h1>
              <p className="text-slate-400 text-lg">Social bonding, evolved.</p>
          </div>

          <div className="w-full max-w-sm space-y-4">
               <div className="relative">
                   <input 
                    type="text" 
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    placeholder="Enter player name..."
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-6 pr-14 text-lg text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all shadow-inner"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
                    autoFocus
                   />
                   <button 
                    onClick={handleAddPlayer}
                    disabled={!newPlayerName.trim()}
                    className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-500 rounded-xl flex items-center justify-center text-white disabled:opacity-0 transition-all hover:bg-indigo-400"
                   >
                       <UserPlus size={20} />
                   </button>
               </div>

               {/* Player List Grid */}
               <div className="flex flex-wrap gap-2 justify-center py-4 min-h-[100px]">
                   {players.map(p => (
                       <div key={p.id} className="animate-in zoom-in-50 duration-300">
                           <button 
                            onClick={() => handleRemovePlayer(p.id)}
                            className="group flex items-center gap-2 pl-4 pr-2 py-2 rounded-full bg-slate-800/50 border border-white/5 hover:bg-rose-500/20 hover:border-rose-500/30 transition-all"
                           >
                               <span className="font-bold text-slate-200 group-hover:text-rose-200">{p.name}</span>
                               <div className="bg-black/20 rounded-full p-1 text-slate-500 group-hover:text-rose-300">
                                   <X size={12} />
                               </div>
                           </button>
                       </div>
                   ))}
                   {players.length === 0 && (
                       <p className="text-slate-600 italic text-sm py-4">Add at least 2 players to begin</p>
                   )}
               </div>
          </div>

          <div className="mt-8 w-full max-w-xs">
              <button 
               onClick={handleStartGame}
               disabled={players.length < 2}
               className="w-full py-5 bg-white text-slate-950 font-black text-xl rounded-2xl shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none disabled:scale-100 flex items-center justify-center gap-3"
              >
                  Enter the Circle
                  <ArrowRight size={24} strokeWidth={3} />
              </button>
          </div>
      </div>
  );

  const renderWheelView = () => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] animate-in fade-in duration-700 pb-8 pt-8">
      {/* Centered Wheel Container */}
      <div 
        className="mb-12 scale-100 sm:scale-110 transition-all cursor-pointer active:scale-95 hover:scale-[1.02]"
        onClick={() => {
            if (!isSpinning && players.length >= 2) {
                startRound();
            }
        }}
        role="button"
        aria-label="Spin the wheel"
      >
        <Wheel 
          players={players} 
          isSpinning={isSpinning}
          winner={players.find(p => p.id === roundContext.selectedPlayerId) || null}
          onSpinEnd={onWheelStop}
        />
      </div>
      
      {!isSpinning && (
        <button
          onClick={startRound}
          disabled={players.length < 2}
          className="group relative w-full max-w-[200px] py-4 bg-white text-slate-950 font-black text-xl rounded-2xl shadow-[0_0_40px_-10px_rgba(255,255,255,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500"></div>
          SPIN
        </button>
      )}
      
      {isSpinning && (
         <p className="mt-8 text-indigo-300 animate-pulse font-medium tracking-widest text-sm uppercase">Fate is deciding...</p>
      )}
    </div>
  );

  // Check if prompt supports spin again
  const supportsSpinAgain = roundContext.currentPrompt?.text.toLowerCase().includes('spin again') || false;

  const renderPromptCard = (prompt: Prompt, isGroup: boolean = false) => (
      <div className="w-full max-w-md mx-auto">
           {/* Card Container */}
           <div className={`
             relative p-8 rounded-[2rem] border border-white/10 shadow-2xl overflow-hidden
             ${isGroup ? 'bg-indigo-500/10' : 'glass-panel'}
           `}>
             {/* Decorative blob - subtle background only */}
             <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20 ${isGroup ? 'bg-purple-500' : 'bg-emerald-500'}`}></div>

             <p className="relative z-10 text-2xl font-medium leading-relaxed text-slate-100 text-center">
               {prompt.text}
             </p>

             {supportsSpinAgain && (
                 <div className="mt-8 flex justify-center relative z-20">
                     <button 
                        onClick={handleMiniSpinStart}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-indigo-300 text-sm font-bold border border-white/10 transition-colors"
                     >
                         <Shuffle size={16} />
                         Spin for Player
                     </button>
                 </div>
             )}
           </div>
      </div>
  );

  const renderIndividualView = () => {
    const player = players.find(p => p.id === roundContext.selectedPlayerId);
    
    if (roundContext.isPreRollSelection) {
      return (
        <div className="flex flex-col h-full animate-in slide-in-from-bottom-8 duration-500 p-6 pt-32">
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-3">
                Your Turn
            </span>
            <h2 className="text-4xl font-black text-white mb-2 tracking-tight">{player?.name}</h2>
            <p className="text-slate-400 text-sm font-medium">Choose a card to reveal your fate</p>
          </div>
          <div className="grid gap-4 max-w-md mx-auto w-full">
            {roundContext.preRollOptions.map((opt, idx) => (
               <button
                 key={opt.id}
                 onClick={() => handlePreRollSelect(opt)}
                 className="group relative p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-left transition-all active:scale-[0.98]"
               >
                 <span className="text-lg font-medium text-slate-200 group-hover:text-white transition-colors">{opt.text}</span>
                 {/* Icon removed to prevent overlap */}
               </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center animate-in zoom-in-95 duration-500">
        <div className="mb-10">
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">
            {player?.name}
          </h2>
        </div>

        {roundContext.currentPrompt && renderPromptCard(roundContext.currentPrompt)}

        <div className="mt-12 w-full max-w-xs">
            <button 
            onClick={() => completeRound(roundContext.currentPrompt?.difficulty || 1)}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-slate-700 active:scale-95"
            >
            Next Round
            </button>
        </div>
      </div>
    );
  };

  const renderRPSView = () => {
     const p1 = players.find(p => p.id === roundContext.selectedPlayerId);
     const p2 = players.find(p => p.id === roundContext.opponentPlayerId);

     return (
       <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center animate-in fade-in duration-500">
         <div className="flex items-center justify-center gap-6 mb-12 w-full max-w-md">
           <div className="flex-1 flex flex-col items-center">
             <div className="w-20 h-20 bg-indigo-500/20 border-2 border-indigo-500 rounded-full flex items-center justify-center text-3xl font-bold mb-3 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
               {p1?.name.charAt(0)}
             </div>
             <p className="font-bold text-lg text-white truncate w-full">{p1?.name}</p>
           </div>
           
           <div className="text-3xl font-black text-slate-600 italic">VS</div>
           
           <div className="flex-1 flex flex-col items-center">
             <div className="w-20 h-20 bg-rose-500/20 border-2 border-rose-500 rounded-full flex items-center justify-center text-3xl font-bold mb-3 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
               {p2?.name.charAt(0)}
             </div>
             <p className="font-bold text-lg text-white truncate w-full">{p2?.name}</p>
           </div>
         </div>

         <div className="mb-10 p-4 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
             <p className="text-slate-300 text-sm uppercase tracking-widest font-bold">Showdown</p>
             <h3 className="text-2xl font-bold text-white mt-1">Rock · Paper · Scissors</h3>
         </div>

         <p className="text-slate-400 mb-4 text-sm">Tap the winner</p>
         <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
           <button 
             onClick={() => handleRPSResult(p1?.id || '')}
             className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl hover:bg-indigo-500/30 text-indigo-200 font-bold transition-all active:scale-95"
           >
             {p1?.name} Won
           </button>
           <button 
             onClick={() => handleRPSResult(p2?.id || '')}
             className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl hover:bg-rose-500/30 text-rose-200 font-bold transition-all active:scale-95"
           >
             {p2?.name} Won
           </button>
         </div>
       </div>
     );
  };

  const renderGroupView = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center animate-in zoom-in-95 duration-500">
        <div className="mb-10">
           <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 text-white mb-4 shadow-lg shadow-purple-500/20 transform -rotate-3">
             <Users size={32} />
           </div>
           <h2 className="text-3xl font-bold text-white mt-2">Group Activity</h2>
        </div>

        {roundContext.currentPrompt && renderPromptCard(roundContext.currentPrompt, true)}

        <div className="mt-12 w-full max-w-xs">
            <button 
            onClick={() => completeRound(roundContext.currentPrompt?.difficulty || 1)}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors border border-slate-700"
            >
            Next Round
            </button>
        </div>
    </div>
  );

  const renderMiniSpinModal = () => (
    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="w-full max-w-md flex flex-col items-center">
            <h3 className="text-xl font-bold text-slate-300 mb-8 uppercase tracking-widest">
                {miniSpinWinner ? "Target Selected" : "Spinning..."}
            </h3>
            
            <div className="mb-8 scale-75 sm:scale-100">
                <Wheel 
                    players={players} 
                    isSpinning={isMiniSpinning}
                    winner={miniSpinWinner}
                    onSpinEnd={onMiniSpinStop}
                />
            </div>

            {miniSpinWinner && !isMiniSpinning && (
                <div className="text-center w-full animate-in slide-in-from-bottom-4">
                    <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-8 drop-shadow-sm">
                        {miniSpinWinner.name}
                    </div>
                    <button 
                        onClick={closeMiniSpin} 
                        className="w-full py-4 bg-white text-slate-900 font-bold text-lg rounded-2xl hover:bg-slate-200 transition-colors"
                    >
                        Done
                    </button>
                </div>
            )}

            {!isMiniSpinning && !miniSpinWinner && (
                 <p className="text-slate-500">Preparing spin...</p>
            )}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-safe-area-bottom pt-16">
      {renderHeader()}

      <main className="max-w-xl mx-auto">
        {/* State Routing */}
        {!hasGameStarted 
          ? renderSetupView() 
          : (
            <>
              {gameState === 'wheel' && renderWheelView()}
              {gameState === 'individual' && renderIndividualView()}
              {gameState === 'rps' && renderRPSView()}
              {gameState === 'group' && renderGroupView()}
            </>
          )
        }
      </main>

      {/* Mini Spin Modal */}
      {showMiniSpin && renderMiniSpinModal()}

      {/* --- Player Modal (Only visible if manually triggered after game start) --- */}
      {showPlayerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom-20">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Manage Players</h3>
              <button onClick={() => setShowPlayerModal(false)} className="p-2 bg-white/5 rounded-full text-slate-400 hover:bg-white/10"><X size={20}/></button>
            </div>
            
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Enter name..."
                className="flex-1 bg-slate-950/50 border border-white/10 rounded-xl px-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onKeyDown={(e) => e.key === 'Enter' && handleAddPlayer()}
              />
              <button 
                onClick={handleAddPlayer}
                className="bg-indigo-500 px-5 rounded-xl font-bold text-white hover:bg-indigo-400 transition-colors"
              >
                Add
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {players.map(p => (
                <div key={p.id} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                  <span className="font-medium text-slate-200">{p.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 bg-slate-950 px-2 py-1 rounded">
                      {p.participationCount} turns
                    </span>
                    <button onClick={() => handleRemovePlayer(p.id)} className="text-rose-400 hover:text-rose-300">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {players.length === 0 && <p className="text-center text-slate-500 py-4">No players yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* --- Settings Modal --- */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
           <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[2rem] p-6 shadow-2xl">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-white">Settings</h3>
               <button onClick={() => setShowSettings(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><X size={20}/></button>
             </div>
             
             <div className="space-y-4">
               <div className="flex justify-between items-center p-5 bg-white/5 rounded-2xl border border-white/5">
                 <div>
                   <p className="font-bold text-white">Pre-Roll Choices</p>
                   <p className="text-xs text-slate-400 mt-1">Player picks from 3 prompts</p>
                 </div>
                 <button 
                  onClick={() => setConfig({...config, enablePreRoll: !config.enablePreRoll})}
                  className={`w-14 h-8 rounded-full transition-colors relative ${config.enablePreRoll ? 'bg-indigo-500' : 'bg-slate-700'}`}
                 >
                   <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-all shadow-sm ${config.enablePreRoll ? 'left-7' : 'left-1'}`}></div>
                 </button>
               </div>
               
               <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Session Stats</p>
                 <div className="grid grid-cols-3 gap-3 text-center text-sm">
                   <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                     <div className="text-slate-500 text-xs font-bold uppercase mb-1">Solo</div>
                     <div className="font-bold text-white text-lg">{roundHistory.roundTypes.Individual}</div>
                   </div>
                   <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                     <div className="text-slate-500 text-xs font-bold uppercase mb-1">RPS</div>
                     <div className="font-bold text-white text-lg">{roundHistory.roundTypes.RPS}</div>
                   </div>
                   <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5">
                     <div className="text-slate-500 text-xs font-bold uppercase mb-1">Group</div>
                     <div className="font-bold text-white text-lg">{roundHistory.roundTypes.Group}</div>
                   </div>
                 </div>
                 <button 
                  onClick={() => {
                    if(confirm("Reset entire session?")) {
                       setPlayers([]);
                       setRoundHistory({ difficulty: [], roundTypes: { Individual: 0, RPS: 0, Group: 0 } });
                       localStorage.removeItem('ember_v1_session');
                       window.location.reload();
                    }
                  }}
                  className="w-full mt-6 py-3 text-rose-400 text-sm font-bold bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500/20 transition-colors"
                 >
                   Reset Session
                 </button>
               </div>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;