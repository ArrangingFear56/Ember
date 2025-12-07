export enum Stage {
  Strangers = 1,
  Friends = 2,
  CloseFriends = 3,
}

export enum GameState {
  Setup = 'SETUP',
  Wheel = 'WHEEL',
  Individual = 'INDIVIDUAL',
  RPS = 'RPS',
  Group = 'GROUP',
}

export enum RoundType {
  Individual = 'Individual',
  RPS = 'RPS',
  Group = 'GroupGame',
}

export interface Player {
  id: string;
  name: string;
  skipTokens: number;
}

export interface RpsState {
  playerA: Player;
  playerB: Player;
  stage: 'VERSUS' | 'RESULT' | 'PUNISHMENT';
  winner?: Player;
  loser?: Player;
  punishment?: string;
}

export interface GroupState {
  type: 'ACTIVITY' | 'POINTING';
  content: string;
}