import React from 'react';
import { Card } from '../Card';
import { Button } from '../Button';
import { GroupState } from '../../types';

interface GroupViewProps {
  data: GroupState;
  onNext: () => void;
}

export const GroupView: React.FC<GroupViewProps> = ({ data, onNext }) => {
  const isPointing = data.type === 'POINTING';

  return (
    <div className="flex flex-col h-full justify-center max-w-md mx-auto w-full p-4 space-y-6">
      <div className="text-center">
        <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${isPointing ? 'bg-ember-secondary/20 text-ember-secondary' : 'bg-blue-500/20 text-blue-400'}`}>
            {isPointing ? 'Pointing Game' : 'Group Activity'}
        </span>
      </div>

      <Card className={`min-h-[240px] flex flex-col justify-center items-center ${isPointing ? 'bg-orange-900/10 border-orange-500/20' : 'bg-blue-900/10 border-blue-500/20'}`}>
        {isPointing && (
            <p className="text-sm text-gray-400 uppercase tracking-wider mb-4 font-bold">
                On the count of three, point to the person who...
            </p>
        )}
        <p className="text-2xl text-center font-bold leading-relaxed text-white">
          {data.content}
        </p>
      </Card>

      <Button onClick={onNext} fullWidth variant={isPointing ? 'secondary' : 'primary'}>
        Next Round
      </Button>
    </div>
  );
};