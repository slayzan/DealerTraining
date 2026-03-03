import  type {Card}  from '../CardUtils';

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
export interface BoardAnalysis {
  hasPair: boolean;
  hasTrips: boolean;
  hasQuads: boolean;
  possibleFlushSuits: string[]; // Suits with >= 3 cards on board
  hasFiveOrTen: boolean; // Board has 5 or 10
}

export interface PlayerResult {
  id: number;
  hand: Card[]; // 4 cards for Omaha, 2 cards for Texas Hold'em
  bestHand: HandEvaluation;
  isWinner: boolean;
}

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export function getRankValue(rank: string): number {
  return RANKS.indexOf(rank) + 2; // 2=2, ..., A=14
}

export function getRankName(val: number): string {
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
export function evaluateCombo(
  cards: Card[], 
  checkFlush: boolean, 
  checkStraight: boolean, 
  checkBoardPair: boolean
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
      else if (uniqueRanks.includes(14) && uniqueRanks.includes(2) && uniqueRanks.includes(3) && uniqueRanks.includes(4) && uniqueRanks.includes(5)) {
        isStraight = true;
        straightHighRank = 5;
      }
    }
  }

  // --- Rank Counts (Pairs, Trips, Quads) ---
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

  if (checkBoardPair) {
     isQuad = countValues.includes(4);
     isTrips = countValues.includes(3);
     pairs = Object.keys(counts).filter(r => counts[parseInt(r)] === 2).map(r => parseInt(r)).sort((a,b) => b-a);
     numPairs = pairs.length;
     isFullHouse = isTrips && numPairs >= 1;
  } else {
     // Board has no pair.
     // Impossible: Quads, Full House.
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
export function k_combinations<T>(set: T[], k: number): T[][] {
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

export function evaluate5CardHand(cards: Card[]): HandEvaluation {
    return evaluateCombo(cards, true, true, true);
}