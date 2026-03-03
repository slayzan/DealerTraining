import type { Card } from "../CardUtils";

import type {
  HandEvaluation, 
  BoardAnalysis, 
  PlayerResult
} from './common'

import {
  analyzeBoard, 
  evaluateCombo, 
  k_combinations 
} from './common';

// TEXAS HOLD'EM: Find Best Hand for a Player
// In Texas Hold'em, players can use any combination of their 2 hole cards + 5 board cards
// This means we need to evaluate all possible 5-card combinations from 7 total cards
export function solveTexasHoldemHand(hand: Card[], board: Card[], boardAnalysis?: BoardAnalysis): HandEvaluation {
  if (hand.length !== 2) throw new Error("Texas Hold'em hand must have 2 cards");
  if (board.length !== 5) throw new Error("Board must have 5 cards");

  // 1. Analyze Board (if not provided)
  const analysis = boardAnalysis || analyzeBoard(board);

  // 2. Pre-calculate properties for optimization
  const allCards = [...hand, ...board]; // 7 cards total
  
  const allSuits: Record<string, number> = {};
  let allHasFiveOrTen = false;
  
  for (const c of allCards) {
    allSuits[c.suit] = (allSuits[c.suit] || 0) + 1;
    if (c.rank === '5' || c.rank === '10') allHasFiveOrTen = true;
  }

  // 3. Determine Checks
  const checkStraight = allHasFiveOrTen;
  const checkBoardPair = analysis.hasPair;

  // 4. Generate all possible 5-card combinations from 7 cards
  const allCombos = k_combinations(allCards, 5); // C(7,5) = 21 combinations

  let bestEval: HandEvaluation | null = null;

  for (const combo of allCombos) {
    // Optimization: Check Flush possibility for this combo
    // If all 5 cards are the same suit, check flush
    const comboSuit = combo[0].suit;
    const doCheckFlush = combo.every(c => c.suit === comboSuit);

    const evalResult = evaluateCombo(
      combo,
      doCheckFlush,
      checkStraight,
      checkBoardPair
    );

    if (!bestEval || evalResult.score > bestEval.score) {
      bestEval = evalResult;
    }
  }

  if (!bestEval) throw new Error("Evaluation failed");
  return bestEval;
}

// Determine Winner among multiple Texas Hold'em players
export function determineWinnerTexasHoldem(board: Card[], players: { id: number; hand: Card[] }[]): PlayerResult[] {
  const analysis = analyzeBoard(board);
  
  const results = players.map(p => ({
    id: p.id,
    hand: p.hand,
    bestHand: solveTexasHoldemHand(p.hand, board, analysis),
    isWinner: false
  }));

  // Find max score
  const maxScore = Math.max(...results.map(r => r.bestHand.score));
  
  // Mark winners (tie aware)
  results.forEach(r => {
    if (r.bestHand.score === maxScore) {
      r.isWinner = true;
    }
  });

  return results;
}
