import { Player, Prompt, Stage, Difficulty } from './types';
import { QUESTIONS_S1, QUESTIONS_S2, QUESTIONS_S3, ACTIVITIES, POINTING_PACK } from './constants';

// --- Weighted Fairness (Yung's Model) ---
export const selectWeightedPlayer = (players: Player[]): Player | null => {
  if (players.length === 0) return null;

  // w = 1 / (participationCount + 1)
  const weights = players.map(p => 1 / (p.participationCount + 1));
  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  
  // Random value between 0 and totalWeight
  let random = Math.random() * totalWeight;
  
  // Apply jitter (±5%) to avoid perfect predictability
  const jitter = 0.95 + Math.random() * 0.1; 
  random *= jitter;

  // Iterate to find the winner
  for (let i = 0; i < players.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return players[i];
    }
  }
  return players[players.length - 1]; // Fallback
};

// --- Round Type Selection ---
export const selectRoundType = (
  counts: { Individual: number; RPS: number; Group: number }
): 'Individual' | 'RPS' | 'Group' => {
  const types: ('Individual' | 'RPS' | 'Group')[] = ['Individual', 'RPS', 'Group'];
  
  // Sort by count ascending (least used first)
  const sorted = types.sort((a, b) => counts[a] - counts[b]);
  
  // 60% chance to pick the least used, 25% second, 15% third to ensure variety but trend towards balance
  const r = Math.random();
  if (r < 0.6) return sorted[0];
  if (r < 0.85) return sorted[1];
  return sorted[2];
};

// --- Prompt Selection & Filtering ---
export const getQuestionsForStage = (stage: Stage): Prompt[] => {
  switch (stage) {
    case 'S1': return QUESTIONS_S1;
    case 'S2': return QUESTIONS_S2;
    case 'S3': return QUESTIONS_S3;
    default: return QUESTIONS_S1;
  }
};

export const getPromptsForRound = (
  type: 'Individual' | 'RPS' | 'Group',
  stage: Stage,
  difficultyHistory: number[],
  count: number = 1
): Prompt[] => {
  let pool: Prompt[] = [];

  if (type === 'Individual') {
    pool = getQuestionsForStage(stage);
  } else if (type === 'Group') {
    // For group, we mix activities and pointing
    // 50/50 split on intention, but logic handles actual prompt fetch
    pool = ACTIVITIES; 
  } else {
    // RPS losers get an Activity
    pool = ACTIVITIES;
  }

  // Filter out Pointing prompts from standard Activity pool if we are just looking for general activities
  // Pointing prompts are handled specifically if the "TRIGGER_POINTING" activity is selected
  // OR if we explicitly want pointing. 
  // For simplicity: Pointing prompts are a separate library accessed via trigger or specific Group logic.
  // The logic below assumes we are selecting from the primary pool passed.

  // Difficulty Balancing
  // Attempt to find prompts that don't repeat the last difficulty too often
  // Rule: Avoid 3 consecutive same difficulty.
  const lastDiff = difficultyHistory[difficultyHistory.length - 1];
  const secondLastDiff = difficultyHistory[difficultyHistory.length - 2];
  
  let validPrompts = pool.filter(p => {
      // Stage enforcement for activities (some are S3 only implicitly by content, though mostly S1/S2)
      // Note: Pointing specific S3 check happens later if Pointing is triggered.
      return true;
  });

  if (lastDiff && lastDiff === secondLastDiff) {
      // Try to avoid this difficulty
      const betterPrompts = validPrompts.filter(p => p.difficulty !== lastDiff);
      if (betterPrompts.length >= count) validPrompts = betterPrompts;
  }

  // Shuffle and pick
  const shuffled = [...validPrompts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const getPointingPrompt = (stage: Stage): Prompt => {
    let pool = POINTING_PACK;
    if (stage !== 'S3') {
        pool = pool.filter(p => p.stage !== 'S3');
    }
    const r = Math.floor(Math.random() * pool.length);
    return pool[r];
};

export const getDifficultyColor = (d: Difficulty) => {
    switch(d) {
        case 1: return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
        case 2: return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
        case 3: return 'bg-rose-500/20 text-rose-300 border-rose-500/50';
        default: return 'bg-slate-500/20 text-slate-300';
    }
};

export const getStageName = (s: Stage) => {
    switch(s) {
        case 'S1': return 'Icebreaker';
        case 'S2': return 'Fun';
        case 'S3': return 'Intimate';
    }
}