import type { Card } from './CardUtils';

export type HandRankName = 
  | 'High Card'
  | 'Pair'
  | 'Two Pair'
  | 'Three of a Kind'
  | 'Straight'
  | 'Flush'
  | 'Full House'
  | 'Four of a Kind'
  | 'Straight Flush'
  | 'Royal Flush';

export interface HandEvaluation {
  rankName: HandRankName;
  rankValue: number; // 0-9
  score: number; // Numeric score for comparison
  description: string;
  bestCards: Card[]; // The 5 cards used
}

// Optimization Flags
interface BoardAnalysis {
  hasPair: boolean;
  hasTrips: boolean;
  hasQuads: boolean; // (On board?) - if board has quads, board has pair & trips.
  possibleFlushSuits: string[]; // Suits with >= 3 cards on board
  hasFiveOrTen: boolean; // Board has 5 or 10
}

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

function getRankValue(rank: string): number {
  return RANKS.indexOf(rank) + 2; // 2=2, ..., A=14
}

function getRankName(val: number): string {
  if (val <= 10) return val.toString();
  if (val === 11) return 'Valet';
  if (val === 12) return 'Dame';
  if (val === 13) return 'Roi';
  if (val === 14) return 'As';
  return '?';
}

// Analyze board for global optimizations
export function analyzeBoard(board: Card[]): BoardAnalysis {
  const counts: Record<string, number> = {};
  const suits: Record<string, number> = {};
  let hasFiveOrTen = false;

  for (const card of board) {
    // Rank counts
    const r = card.rank;
    counts[r] = (counts[r] || 0) + 1;

    // Suit counts
    suits[card.suit] = (suits[card.suit] || 0) + 1;

    // 5 or 10 check
    if (r === '5' || r === '10') hasFiveOrTen = true;
  }

  const countValues = Object.values(counts);
  const hasPair = countValues.some(c => c >= 2);
  const hasTrips = countValues.some(c => c >= 3);
  const hasQuads = countValues.some(c => c >= 4);

  const possibleFlushSuits = Object.keys(suits).filter(s => suits[s] >= 3);

  return {
    hasPair,
    hasTrips,
    hasQuads,
    possibleFlushSuits,
    hasFiveOrTen
  };
}

// Optimized 5-card evaluator
// Takes optimization flags from the specific hand context (Board Analysis + Hand Analysis)
function evaluateCombo(
  cards: Card[], 
  checkFlush: boolean, 
  checkStraight: boolean, 
  checkBoardPair: boolean // If false, skip Full House / Quads check (unless strictly purely from hand? No, Omaha requires 3 board)
): HandEvaluation {
  
  // Sorting is necessary for logic
  // We sort Descending
  const sorted = [...cards].sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank));

  // --- Flush Check ---
  let isFlush = false;
  if (checkFlush) {
    isFlush = sorted.every(c => c.suit === sorted[0].suit);
  }

  // --- Straight Check ---
  let isStraight = false;
  let straightHighRank = 0;
  
  if (checkStraight) {
    const uniqueRanks = Array.from(new Set(sorted.map(c => getRankValue(c.rank))));
    if (uniqueRanks.length === 5) {
      if (uniqueRanks[0] - uniqueRanks[4] === 4) {
        isStraight = true;
        straightHighRank = uniqueRanks[0];
      }
      // Wheel check: A, 5, 4, 3, 2 (14, 5, 4, 3, 2)
      else if (uniqueRanks.includes(14) && uniqueRanks.includes(2) && uniqueRanks.includes(3) && uniqueRanks.includes(4) && uniqueRanks.includes(5)) {
        isStraight = true;
        straightHighRank = 5;
      }
    }
  }

  // --- Rank Counts (Pairs, Trips, Quads) ---
  // We can skip this if we are looking for High Card only? No, always check.
  // Optimization: If !checkBoardPair, checking for Full House or Quads is useless?
  // Wait. If checkBoardPair is FALSE, it means the BOARD has no pair.
  // As derived, in Omaha, you cannot make FH or Quads without Board Pair.
  // So if !checkBoardPair, we can skip `isQuad` and `isFullHouse` logic?
  // We still need to check for Trips, Two Pair, Pair.
  
  const counts: Record<number, number> = {};
  for (const c of sorted) {
    const r = getRankValue(c.rank);
    counts[r] = (counts[r] || 0) + 1;
  }
  
  const countValues = Object.values(counts);
  let isQuad = false;
  let isFullHouse = false;
  let isTrips = false;
  let numPairs = 0;
  let pairs: number[] = [];

  // Only check deep structure if not Straight Flush (optimization? SF is rare, just check all)
  
  if (checkBoardPair) {
     isQuad = countValues.includes(4);
     isTrips = countValues.includes(3); // Could be part of FH
     pairs = Object.keys(counts).filter(r => counts[parseInt(r)] === 2).map(r => parseInt(r)).sort((a,b) => b-a);
     numPairs = pairs.length;
     isFullHouse = isTrips && numPairs >= 1; // 3 + 2
  } else {
     // Board has no pair.
     // Impossible: Quads, Full House.
     // Possible: Trips (Hand AA + Board A..), Two Pair (Hand AB + Board AB..), Pair.
     isQuad = false;
     isFullHouse = false;
     
     isTrips = countValues.includes(3);
     pairs = Object.keys(counts).filter(r => counts[parseInt(r)] === 2).map(r => parseInt(r)).sort((a,b) => b-a);
     numPairs = pairs.length;
  }

  // --- Determine Rank ---
  let rankName: HandRankName = 'High Card';
  let rankValue = 0;
  let score = 0;

  if (isStraight && isFlush) {
    if (straightHighRank === 14 && !sorted.map(c => getRankValue(c.rank)).includes(2)) { 
       rankName = 'Royal Flush';
       rankValue = 9;
       score = 90000000000;
    } else {
       rankName = 'Straight Flush';
       rankValue = 8;
       score = 80000000000 + straightHighRank * 100000000;
    }
  } else if (isQuad) {
    rankName = 'Four of a Kind';
    rankValue = 7;
    const quadRank = parseInt(Object.keys(counts).find(r => counts[parseInt(r)] === 4) || '0');
    const kicker = parseInt(Object.keys(counts).find(r => counts[parseInt(r)] === 1) || '0');
    score = 70000000000 + quadRank * 100000000 + kicker * 1000000;
  } else if (isFullHouse) {
    rankName = 'Full House';
    rankValue = 6;
    const tripsRank = parseInt(Object.keys(counts).find(r => counts[parseInt(r)] === 3) || '0');
    const pairRank = parseInt(Object.keys(counts).find(r => counts[parseInt(r)] === 2) || '0'); 
    score = 60000000000 + tripsRank * 100000000 + pairRank * 1000000;
  } else if (isFlush) {
    rankName = 'Flush';
    rankValue = 5;
    score = 50000000000;
    sorted.forEach((c, i) => {
      score += getRankValue(c.rank) * Math.pow(10, 8 - i*2);
    });
  } else if (isStraight) {
    rankName = 'Straight';
    rankValue = 4;
    score = 40000000000 + straightHighRank * 100000000;
  } else if (isTrips) {
    rankName = 'Three of a Kind';
    rankValue = 3;
    const tripsRank = parseInt(Object.keys(counts).find(r => counts[parseInt(r)] === 3) || '0');
    const kickers = sorted.filter(c => getRankValue(c.rank) !== tripsRank).map(c => getRankValue(c.rank));
    score = 30000000000 + tripsRank * 100000000 + kickers[0] * 1000000 + kickers[1] * 10000;
  } else if (numPairs === 2) {
    rankName = 'Two Pair';
    rankValue = 2;
    const kicker = sorted.find(c => getRankValue(c.rank) !== pairs[0] && getRankValue(c.rank) !== pairs[1]);
    const kickerVal = kicker ? getRankValue(kicker.rank) : 0;
    score = 20000000000 + pairs[0] * 100000000 + pairs[1] * 1000000 + kickerVal * 10000;
  } else if (numPairs === 1) {
    rankName = 'Pair';
    rankValue = 1;
    const pairRank = pairs[0];
    const kickers = sorted.filter(c => getRankValue(c.rank) !== pairRank).map(c => getRankValue(c.rank));
    score = 10000000000 + pairRank * 100000000 + kickers[0] * 1000000 + kickers[1] * 10000 + kickers[2] * 100;
  } else {
    rankName = 'High Card';
    rankValue = 0;
    score = 0;
    sorted.forEach((c, i) => {
      score += getRankValue(c.rank) * Math.pow(10, 8 - i*2);
    });
  }

  // Generate description
  let desc: string = rankName;
  if (rankName === 'High Card') desc = `Hauteur ${sorted[0].rank}`;
  if (rankName === 'Pair') desc = `Paire de ${getRankName(pairs[0])}`;
  if (rankName === 'Two Pair') desc = `Deux Paires (${getRankName(pairs[0])} et ${getRankName(pairs[1])})`;
  if (rankName === 'Three of a Kind') desc = `Brelan de ${getRankName(parseInt(Object.keys(counts).find(r => counts[parseInt(r)] === 3) || '0'))}`;
  if (rankName === 'Straight') desc = `Quinte au ${getRankName(straightHighRank)}`;
  if (rankName === 'Flush') desc = `Couleur au ${sorted[0].rank}`;
  if (rankName === 'Full House') desc = `Full (${getRankName(parseInt(Object.keys(counts).find(r => counts[parseInt(r)] === 3) || '0'))} par ${getRankName(parseInt(Object.keys(counts).find(r => counts[parseInt(r)] === 2) || '0'))})`;
  if (rankName === 'Four of a Kind') desc = `Carré de ${getRankName(parseInt(Object.keys(counts).find(r => counts[parseInt(r)] === 4) || '0'))}`;
  if (rankName === 'Straight Flush') desc = `Quinte Flush au ${getRankName(straightHighRank)}`;
  if (rankName === 'Royal Flush') desc = `Quinte Flush Royale`;

  return {
    rankName,
    rankValue,
    score,
    description: desc,
    bestCards: sorted
  };
}

// Generate combinations helper
function k_combinations<T>(set: T[], k: number): T[][] {
  if (k > set.length || k <= 0) return [];
  if (k === set.length) return [set];
  if (k === 1) return set.map(e => [e]);
  
  const combs: T[][] = [];
  let tailCombs: T[][] = [];
  
  for (let i = 0; i < set.length - k + 1; i++) {
    tailCombs = k_combinations(set.slice(i + 1), k - 1);
    for (let j = 0; j < tailCombs.length; j++) {
      combs.push([set[i], ...tailCombs[j]]);
    }
  }
  return combs;
}

// MAIN FUNCTION: Find Best Hand for a Player
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

// Wrapper for manual check (from Game 1) which passes 5 cards directly
// Used by OmahaHandReader.tsx
export function evaluate5CardHand(cards: Card[]): HandEvaluation {
    // No optimizations possible without context, assume check all
    return evaluateCombo(cards, true, true, true);
}


// Determine Winner among multiple players
export interface PlayerResult {
  id: number;
  hand: Card[]; // 4 cards
  bestHand: HandEvaluation;
  isWinner: boolean;
}

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