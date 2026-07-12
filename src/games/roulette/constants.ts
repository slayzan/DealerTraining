export const BETS = {
  plein:        { label: 'Plein',        payout: 35, color: 'text-rose-400',   bg: 'bg-rose-600/20 border-rose-500/30' },
  cheval:       { label: 'Cheval',       payout: 17, color: 'text-amber-400',  bg: 'bg-amber-600/20 border-amber-500/30' },
  transversale: { label: 'Transversale', payout: 11, color: 'text-violet-400', bg: 'bg-violet-600/20 border-violet-500/30' },
  carre:        { label: 'Carré',        payout: 8,  color: 'text-blue-400',   bg: 'bg-blue-600/20 border-blue-500/30' },
  sixain:       { label: 'Sixain',       payout: 5,  color: 'text-teal-400',   bg: 'bg-teal-600/20 border-teal-500/30' },
} as const;

export type BetKey = keyof typeof BETS;
export const BET_KEYS = Object.keys(BETS) as BetKey[];
