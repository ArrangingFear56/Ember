import React from 'react';
import { Stage } from '../types';

interface HeaderProps {
  currentStage: Stage;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentStage, onReset }) => {
  const getStageLabel = (s: Stage) => {
    switch(s) {
      case Stage.Strangers: return "Stage 1: Strangers";
      case Stage.Friends: return "Stage 2: Friends";
      case Stage.CloseFriends: return "Stage 3: Close Friends";
    }
  };

  return (
    <header className="flex justify-between items-center p-6 w-full max-w-md mx-auto sticky top-0 z-50 bg-ember-dark/80 backdrop-blur-sm">
      <h1 className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-ember-accent to-ember-secondary">
        EMBER
      </h1>
      <button 
        onClick={onReset}
        className="px-3 py-1 text-xs rounded-full bg-white/5 border border-white/10 text-gray-400 uppercase tracking-wider"
      >
        {getStageLabel(currentStage)}
      </button>
    </header>
  );
};