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

// OMAHA POKER: Find Best Hand for a Player
// In Omaha, players MUST use exactly 2 cards from hand + exactly 3 cards from board
export function solveOmahaHand(hand: Card[], board: Card[], boardAnalysis?: BoardAnalysis): HandEvaluation {
  if (hand.length !== 4) throw new Error("Omaha hand must have 4 cards");
  if (board.length !== 5) throw new Error("Board must have 5 cards");

  // 1. Analyze Board (if not provided)
  const analysis = boardAnalysis || analyzeBoard(board);

  // 2. Pre-calculate Hand properties for optimization
  const handSuits: Record<string, number> = {};
  let handHasFiveOrTen = false;
  
  for (const c of hand) {
    handSuits[c.suit] = (handSuits[c.suit] || 0) + 1;
    if (c.rank === '5' || c.rank === '10') handHasFiveOrTen = true;
  }

  // 3. Determine Checks
  const checkStraight = (analysis.hasFiveOrTen || handHasFiveOrTen);
  const checkBoardPair = analysis.hasPair; // For Full House / Quads check

  // 4. Iterate Combinations
  const handPairs = k_combinations(hand, 2); // 6
  const boardTriplets = k_combinations(board, 3); // 10

  let bestEval: HandEvaluation | null = null;

  for (const pair of handPairs) {
    // Optimization: Check Flush possibility for this pair
    // Pair has 2 cards.
    // To make flush, we need 5 cards same suit.
    // If pair[0].suit == pair[1].suit (2 same suit in hand subset)
    // AND board has >= 3 of that suit.
    // Then we check flush.
    
    const pairSuit = pair[0].suit === pair[1].suit ? pair[0].suit : null;

    for (const triplet of boardTriplets) {
      // Flush Check Logic for this specific 5-card combo
      let doCheckFlush = false;
      if (pairSuit) {
        // If pair is suited, check if triplet is suited AND same suit
        if (triplet.every(c => c.suit === pairSuit)) {
          doCheckFlush = true;
        }
      }

      const fiveCards = [...pair, ...triplet];
      
      const evalResult = evaluateCombo(
        fiveCards,
        doCheckFlush,
        checkStraight,
        checkBoardPair
      );

      if (!bestEval || evalResult.score > bestEval.score) {
        bestEval = evalResult;
      }
    }
  }

  if (!bestEval) throw new Error("Evaluation failed");
  return bestEval;
}

// Determine Winner among multiple Omaha players
export function determineWinner(board: Card[], players: { id: number; hand: Card[] }[]): PlayerResult[] {
  const analysis = analyzeBoard(board);
  
  const results = players.map(p => ({
    id: p.id,
    hand: p.hand,
    bestHand: solveOmahaHand(p.hand, board, analysis),
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
