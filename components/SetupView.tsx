import React, { useState } from 'react';
import { Button } from './Button';
import { Stage } from '../types';

interface SetupViewProps {
  onComplete: (players: string[], stage: Stage) => void;
}

export const SetupView: React.FC<SetupViewProps> = ({ onComplete }) => {
  const [names, setNames] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [stage, setStage] = useState<Stage>(Stage.Strangers);

  const addPlayer = () => {
    if (inputValue.trim()) {
      setNames([...names, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addPlayer();
  };

  const removePlayer = (index: number) => {
    setNames(names.filter((_, i) => i !== index));
  };

  const canStart = names.length >= 2;

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto p-6 pt-12 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-ember-accent to-ember-secondary">
          EMBER
        </h1>
        <p className="text-gray-400">Social Connection Game</p>
      </div>

      {/* Stage Selection */}
      <div className="space-y-4">
        <h2 className="text-sm text-gray-400 uppercase tracking-widest font-bold">Select Vibe</h2>
        <div className="grid grid-cols-1 gap-3">
          {[
            { val: Stage.Strangers, label: 'Stage 1: Strangers', desc: 'Lightweight icebreakers' },
            { val: Stage.Friends, label: 'Stage 2: Friends', desc: 'Medium depth conversations' },
            { val: Stage.CloseFriends, label: 'Stage 3: Close Friends', desc: 'Deep, personal questions' },
          ].map((option) => (
            <button
              key={option.val}
              onClick={() => setStage(option.val)}
              className={`p-4 rounded-xl text-left transition-all border ${
                stage === option.val 
                  ? 'bg-ember-accent/20 border-ember-accent ring-1 ring-ember-accent' 
                  : 'bg-ember-card border-white/5 hover:bg-white/5'
              }`}
            >
              <div className={`font-bold ${stage === option.val ? 'text-ember-accent' : 'text-white'}`}>{option.label}</div>
              <div className="text-xs text-gray-400 mt-1">{option.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Player Input */}
      <div className="space-y-4">
        <h2 className="text-sm text-gray-400 uppercase tracking-widest font-bold">Players</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter name..."
            className="flex-1 bg-ember-card border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-ember-accent"
          />
          <Button onClick={addPlayer} className="py-3 px-4 !rounded-xl">
            +
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
          {names.length === 0 && <span className="text-gray-600 text-sm italic">Add at least 2 players</span>}
          {names.map((name, i) => (
            <span key={i} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm">
              {name}
              <button onClick={() => removePlayer(i)} className="text-gray-400 hover:text-white">&times;</button>
            </span>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <Button 
          fullWidth 
          onClick={() => onComplete(names, stage)} 
          disabled={!canStart}
          className={!canStart ? "opacity-50 cursor-not-allowed grayscale" : ""}
        >
          Start Game
        </Button>
      </div>
    </div>
  );
};