import type { Card } from "../utils/CardUtils";
import { getSuitColor, getSuitSymbol } from "../utils/CardUtils";

interface PlayingCardProps {
  card: Card;
  size?: 'small' | 'medium' | 'large';
  minimal?: boolean;
  highlight?: boolean;
}

export function PlayingCard({ card, size = 'medium', minimal = false, highlight = false }: PlayingCardProps) {
  const suitSymbol = getSuitSymbol(card.suit);
  const color = getSuitColor(card.suit);
  
  const sizeClasses = {
    small: 'w-10 h-16 sm:w-16 sm:h-24 text-xs sm:text-sm',
    medium: 'w-12 h-20 sm:w-20 sm:h-28 text-xs sm:text-base',
    large: 'w-16 h-24 sm:w-24 sm:h-36 text-sm sm:text-lg'
  };

  if (card.faceDown) {
    return (
      <div className={`${sizeClasses[size]} bg-linear-to-br from-blue-900 to-blue-700 rounded-lg border-2 border-blue-600 flex items-center justify-center shadow-lg relative overflow-hidden shrink-0`}>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-2 border-2 border-white rounded-md" />
          <div className="absolute inset-4 border border-white rounded-sm" />
        </div>
        <div className="text-4xl opacity-30">🂠</div>
      </div>
    );
  }

  // Calculate font sizes based on minimalism
  const rankSize = minimal ? (size === 'small' ? 'text-sm' : 'text-base') : (size === 'small' ? 'text-xs' : 'text-sm');
  const centerSize = minimal ? (size === 'small' ? 'text-2xl' : 'text-3xl') : (size === 'small' ? 'text-3xl' : size === 'medium' ? 'text-4xl' : 'text-5xl');

  return (
    <div className={`${sizeClasses[size]} bg-white rounded-lg p-1 flex flex-col relative shrink-0 select-none ${
      highlight 
        ? 'border-4 border-yellow-400 shadow-[0_0_20px_rgba(251,191,36,0.8)] ring-2 ring-yellow-300/50' 
        : 'border-2 border-gray-300 shadow-lg'
    }`}>
      {/* Top-left corner */}
      <div className={`absolute top-0.5 left-1 ${color === 'red' ? 'text-red-600' : 'text-gray-900'} font-bold leading-none`}>
        <div className={rankSize}>{card.rank}</div>
        {!minimal && <div className={size === 'small' ? 'text-base' : 'text-xl'}>{suitSymbol}</div>}
      </div>
      
      {/* Center suit symbol */}
      <div className={`flex-1 flex items-center justify-center ${color === 'red' ? 'text-red-600' : 'text-gray-900'}`}>
        <span className={centerSize}>
          {suitSymbol}
        </span>
      </div>
      
      {/* Bottom-right corner (rotated) */}
      <div className={`absolute bottom-0.5 right-1 ${color === 'red' ? 'text-red-600' : 'text-gray-900'} font-bold leading-none rotate-180`}>
        <div className={rankSize}>{card.rank}</div>
        {!minimal && <div className={size === 'small' ? 'text-base' : 'text-xl'}>{suitSymbol}</div>}
      </div>
    </div>
  );
}