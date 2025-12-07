export type Stage = 'S1' | 'S2' | 'S3';
export type Difficulty = 1 | 2 | 3;
export type PromptType = 'question' | 'activity' | 'pointing';
export type GameState = 'wheel' | 'individual' | 'rps' | 'group';

export interface Player {
  id: string;
  name: string;
  participationCount: number;
  skipToken: boolean;
  score?: number; // Optional tracking
}

export interface Prompt {
  id: string;
  text: string;
  stage: Stage;
  difficulty: Difficulty;
  type: PromptType;
  tags?: string[];
}

export interface Config {
  enablePreRoll: boolean;
  useWeightedFairness: boolean;
  useDifficultyBalancing: boolean;
  stageLock: boolean;
}

export interface SessionData {
  players: Player[];
  stage: Stage;
  history: {
    difficulty: number[]; // Last N difficulties
    roundTypes: { Individual: number; RPS: number; Group: number };
  };
}

export interface RoundContext {
  selectedPlayerId: string | null;
  opponentPlayerId: string | null; // For RPS
  roundType: 'Individual' | 'RPS' | 'Group';
  currentPrompt: Prompt | null;
  preRollOptions: Prompt[];
  isPreRollSelection: boolean;
}