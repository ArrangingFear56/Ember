import React, { useState } from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Player, RpsState } from '../../types';
import { getRandomItem } from '../../services/gameLogic';
import { ACTIVITY_PROMPTS } from '../../constants';

interface RPSViewProps {
  playerA: Player;
  playerB: Player;
  onNext: () => void;
}

export const RPSView: React.FC<RPSViewProps> = ({ playerA, playerB, onNext }) => {
  const [state, setState] = useState<RpsState>({
    playerA,
    playerB,
    stage: 'VERSUS'
  });

  const handleWinner = (winner: Player, loser: Player) => {
    const punishment = getRandomItem(ACTIVITY_PROMPTS);
    setState({
      ...state,
      stage: 'RESULT',
      winner,
      loser,
      punishment
    });
  };

  const handleRevealPunishment = () => {
    setState({ ...state, stage: 'PUNISHMENT' });
  };

  if (state.stage === 'VERSUS') {
    return (
      <div className="flex flex-col h-full justify-center max-w-md mx-auto w-full p-4 space-y-6">
        <div className="text-center">
          <h2 className="text-sm text-ember-secondary font-bold uppercase tracking-widest mb-2">Duel Round</h2>
          <div className="flex items-center justify-center space-x-4 text-2xl font-bold">
            <span className="text-white">{playerA.name}</span>
            <span className="text-gray-500 text-sm">VS</span>
            <span className="text-white">{playerB.name}</span>
          </div>
          <p className="text-gray-400 text-sm mt-4">Play Rock-Paper-Scissors in real life!</p>
        </div>

        <Card className="space-y-4">
            <h3 className="text-center text-white font-semibold mb-4">Who Won?</h3>
            <Button variant="outline" fullWidth onClick={() => handleWinner(playerA, playerB)}>
                {playerA.name} Won
            </Button>
            <Button variant="outline" fullWidth onClick={() => handleWinner(playerB, playerA)}>
                {playerB.name} Won
            </Button>
        </Card>
      </div>
    );
  }

  if (state.stage === 'RESULT') {
     return (
      <div className="flex flex-col h-full justify-center max-w-md mx-auto w-full p-4 space-y-6">
        <div className="text-center">
            <h2 className="text-3xl font-bold text-ember-accent">Winner: {state.winner?.name}!</h2>
            <p className="text-gray-400 mt-2">You get a virtual "Skip Token" for later.</p>
        </div>
        
        <div className="p-4 bg-ember-card rounded-xl border border-red-500/20">
            <p className="text-center text-gray-300 text-sm mb-2">The loser ({state.loser?.name}) must...</p>
            <Button variant="danger" fullWidth onClick={handleRevealPunishment}>
                Reveal Punishment
            </Button>
        </div>
      </div>
     )
  }

  // PUNISHMENT STAGE
  return (
    <div className="flex flex-col h-full justify-center max-w-md mx-auto w-full p-4 space-y-6">
       <div className="text-center mb-4">
         <h2 className="text-xl font-bold text-red-400 uppercase tracking-widest">Punishment</h2>
         <p className="text-white text-lg mt-1">For {state.loser?.name}</p>
       </div>

       <Card className="min-h-[180px] flex flex-col justify-center items-center bg-red-900/10 border-red-500/30">
          <p className="text-xl text-center font-medium">{state.punishment}</p>
       </Card>

       <Button onClick={onNext} fullWidth>Next Round</Button>
    </div>
  );
};