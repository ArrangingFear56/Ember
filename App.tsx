import React, { useState } from 'react';
import { SetupView } from './components/SetupView';
import { Header } from './components/Header';
import { Wheel } from './components/Wheel';
import { Button } from './components/Button';
import { IndividualView } from './components/GameViews/IndividualView';
import { RPSView } from './components/GameViews/RPSView';
import { GroupView } from './components/GameViews/GroupView';
import { 
  GameState, 
  Stage, 
  Player, 
  GroupState 
} from './types';
import { 
  getQuestionsForStage, 
  ACTIVITY_PROMPTS, 
  POINTING_PROMPTS 
} from './constants';
import { 
  getRandomPair, 
  getRandomItem 
} from './services/gameLogic';

const App: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>(GameState.Setup);
  const [stage, setStage] = useState<Stage>(Stage.Strangers);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  
  // --- Round Data State (Preserved until Next Round) ---
  const [currentIndividual, setCurrentIndividual] = useState<{player: Player, question: string} | null>(null);
  const [currentRPS, setCurrentRPS] = useState<{pA: Player, pB: Player} | null>(null);
  const [currentGroup, setCurrentGroup] = useState<GroupState | null>(null);

  // --- Setup Handler ---
  const handleSetupComplete = (names: string[], selectedStage: Stage) => {
    const playerObjects = names.map(name => ({
      id: Math.random().toString(36).substr(2, 9),
      name,
      skipTokens: 0
    }));
    setPlayers(playerObjects);
    setStage(selectedStage);
    setGameState(GameState.Wheel);
  };

  const resetGame = () => {
    setGameState(GameState.Setup);
    setPlayers([]);
  };

  // --- Wheel Handler ---
  const handleSpinClick = () => {
    if (isSpinning) return;
    setIsSpinning(true);
  };

  const onSpinComplete = (resultId: string) => {
    setIsSpinning(false);
    
    if (resultId === 'RPS') {
      setupRPSRound();
    } else if (resultId === 'GROUP') {
      setupGroupRound();
    } else {
      // It is a player ID
      const selectedPlayer = players.find(p => p.id === resultId);
      if (selectedPlayer) {
        setupIndividualRound(selectedPlayer);
      } else {
        // Fallback if something weird happens
        setupIndividualRound(players[0]);
      }
    }
  };

  // --- Round Setup Functions ---
  const setupIndividualRound = (player: Player) => {
    const questionLib = getQuestionsForStage(stage);
    const question = getRandomItem(questionLib);
    
    setCurrentIndividual({ player, question });
    setGameState(GameState.Individual);
  };

  const setupRPSRound = () => {
    const [pA, pB] = getRandomPair(players);
    setCurrentRPS({ pA, pB });
    setGameState(GameState.RPS);
  };

  const setupGroupRound = () => {
    // 50% Activity, 50% Pointing
    const isActivity = Math.random() > 0.5;
    
    if (isActivity) {
      let content = getRandomItem(ACTIVITY_PROMPTS);
      
      // Special case for prompt that requires pointing mechanic
      if (content.includes("On the count of three")) {
        content = getRandomItem(POINTING_PROMPTS);
        setCurrentGroup({ type: 'POINTING', content });
      } else {
        setCurrentGroup({ type: 'ACTIVITY', content });
      }
    } else {
      const content = getRandomItem(POINTING_PROMPTS);
      setCurrentGroup({ type: 'POINTING', content });
    }
    
    setGameState(GameState.Group);
  };

  const nextRound = () => {
    setGameState(GameState.Wheel);
    setCurrentIndividual(null);
    setCurrentRPS(null);
    setCurrentGroup(null);
  };

  // --- Render ---
  
  if (gameState === GameState.Setup) {
    return <SetupView onComplete={handleSetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-ember-dark text-white flex flex-col">
      <Header currentStage={stage} onReset={resetGame} />

      <main className="flex-1 flex flex-col relative max-w-md mx-auto w-full">
        
        {/* Wheel View */}
        {gameState === GameState.Wheel && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade-in">
            <Wheel 
              players={players} 
              isSpinning={isSpinning} 
              onSpinComplete={onSpinComplete} 
            />
            <div className="w-full max-w-xs mt-8">
              <Button 
                onClick={handleSpinClick} 
                fullWidth 
                disabled={isSpinning}
                className={isSpinning ? 'opacity-50 cursor-not-allowed' : ''}
              >
                {isSpinning ? 'Spinning...' : 'SPIN THE WHEEL'}
              </Button>
            </div>
          </div>
        )}

        {/* Game Views */}
        {gameState === GameState.Individual && currentIndividual && (
          <div className="flex-1 p-4">
            <IndividualView 
              player={currentIndividual.player} 
              question={currentIndividual.question} 
              onNext={nextRound} 
            />
          </div>
        )}

        {gameState === GameState.RPS && currentRPS && (
          <div className="flex-1 p-4">
            <RPSView 
              playerA={currentRPS.pA} 
              playerB={currentRPS.pB} 
              onNext={nextRound} 
            />
          </div>
        )}

        {gameState === GameState.Group && currentGroup && (
          <div className="flex-1 p-4">
            <GroupView 
              data={currentGroup} 
              onNext={nextRound} 
            />
          </div>
        )}

      </main>
    </div>
  );
};

export default App;