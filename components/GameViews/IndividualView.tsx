import React from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Player } from '../../types';

interface IndividualViewProps {
  player: Player;
  question: string;
  onNext: () => void;
}

export const IndividualView: React.FC<IndividualViewProps> = ({ player, question, onNext }) => {
  return (
    <div className="flex flex-col h-full justify-center max-w-md mx-auto w-full p-4 animate-fade-in">
      <div className="text-center mb-8">
        <span className="text-sm text-gray-400 uppercase tracking-widest">Selected Player</span>
        <h2 className="text-3xl font-bold text-ember-accent mt-2">{player.name}</h2>
      </div>

      <Card className="mb-8 min-h-[200px] flex items-center justify-center bg-gradient-to-b from-ember-card to-ember-card/50">
        <p className="text-2xl text-center font-medium leading-relaxed">
          {question}
        </p>
      </Card>

      <Button onClick={onNext} fullWidth>
        Next Round
      </Button>
    </div>
  );
};