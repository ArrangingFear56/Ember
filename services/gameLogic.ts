import { Player } from '../types';

export const getRandomPlayer = (players: Player[]): Player => {
  const index = Math.floor(Math.random() * players.length);
  return players[index];
};

export const getRandomPair = (players: Player[]): [Player, Player] => {
  if (players.length < 2) return [players[0], players[0]];
  
  const p1Index = Math.floor(Math.random() * players.length);
  let p2Index = Math.floor(Math.random() * players.length);
  
  while (p1Index === p2Index) {
    p2Index = Math.floor(Math.random() * players.length);
  }
  
  return [players[p1Index], players[p2Index]];
};

export const getRandomItem = <T,>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};