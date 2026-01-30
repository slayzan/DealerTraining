import type { Card } from "../utils/CardUtils";
import { getSuitColor, getSuitSymbol } from "../utils/CardUtils";

interface PlayingCardProps {
  card: Card;
  size?: 'small' | 'medium' | 'large';
}

export function PlayingCard({ card, size = 'medium' }: PlayingCardProps) {
  const suitColor = getSuitColor(card.suit);
  const suitSymbol = getSuitSymbol(card.suit);

    const sizeClasses = {
    small: 'w-14 h-20 sm:w-16 sm:h-24 text-sm',
    medium: 'w-16 h-24 sm:w-20 sm:h-28 text-base',
    large: 'w-20 h-28 sm:w-24 sm:h-36 text-lg',
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

    return (
    <div className={`${sizeClasses[size]} bg-white rounded-lg border-2 border-gray-300 shadow-lg p-2 flex flex-col relative shrink-0`}>
        {/* Top-left corner */}
      <div className={`absolute top-1 left-1 ${suitColor === 'red' ? 'text-red-600' : 'text-gray-900'} font-bold leading-none`}>
        <div className={size === 'small' ? 'text-xs' : 'text-sm'}>{card.rank}</div>
        <div className={size === 'small' ? 'text-base' : 'text-xl'}>{suitSymbol}</div>
      </div>
        {/* Center suit symbol */}
        <div className={`flex-1 flex items-center justify-center ${suitColor === 'red' ? 'text-red-600' : 'text-gray-900'}`}>
            <span className={size === 'small' ? 'text-3xl' : size === 'medium' ? 'text-4xl' : 'text-5xl'}>
                {suitSymbol}
            </span>
        </div>
        {/* Bottom-right corner */}
         <div className={`absolute bottom-1 right-1 ${suitColor === 'red' ? 'text-red-600' : 'text-gray-900'} font-bold leading-none rotate-180`}>
        <div className={size === 'small' ? 'text-xs' : 'text-sm'}>{card.rank}</div>
        <div className={size === 'small' ? 'text-base' : 'text-xl'}>{suitSymbol}</div>
      </div>
    </div>
  );
}