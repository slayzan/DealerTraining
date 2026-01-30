import { useState, useEffect, useRef } from 'react';
import type { Card } from '../../utils/CardUtils';
import { createDeck, shuffleDeck } from '../../utils/CardUtils';
import { PlayingCard } from '../../components/PlayingCards';
import { Trophy, RotateCcw, Play, CheckCircle, XCircle } from 'lucide-react';

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyConfig {
  drawSpeed: number; // ms
  label: string;
  color: string;
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { drawSpeed: 2000, label: 'Lent (2s)', color: 'bg-green-600' },
  medium: { drawSpeed: 1000, label: 'Normal (1s)', color: 'bg-yellow-600' },
  hard: { drawSpeed: 500, label: 'Rapide (0.5s)', color: 'bg-red-600' }
};

export function DealerCounting() {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  
  // Track current card index instead of a list of visible cards
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // 'fullHand' is the pre-calculated complete hand (reaching >= 17)
  const [fullHand, setFullHand] = useState<Card[]>([]);
  
  const [gameState, setGameState] = useState<'idle' | 'drawing' | 'input' | 'feedback'>('idle');
  const [userGuess, setUserGuess] = useState('');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  
  const timerRef = useRef<number | null>(null);

  // Initial cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const calculateTotal = (currentCards: Card[]): number => {
    let total = 0;
    let aces = 0;

    currentCards.forEach(card => {
      if (card.rank === 'A') {
        aces += 1;
        total += 11;
      } else if (['K', 'Q', 'J', '10'].includes(card.rank)) {
        total += 10;
      } else {
        total += parseInt(card.rank);
      }
    });

    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }

    return total;
  };

  const isBlackjack = (currentCards: Card[]): boolean => {
    if (currentCards.length !== 2) return false;
    const hasAce = currentCards.some(c => c.rank === 'A');
    const hasTen = currentCards.some(c => ['10', 'J', 'Q', 'K'].includes(c.rank));
    return hasAce && hasTen;
  };

  // Helper to pre-calculate the full hand
  const generateFullHand = (): Card[] => {
    let deck = shuffleDeck(createDeck());
    const hand: Card[] = [];
    
    // Draw first card
    hand.push(deck[0]);
    deck = deck.slice(1);
    
    // Draw until >= 17
    while (calculateTotal(hand) < 17) {
      hand.push(deck[0]);
      deck = deck.slice(1);
    }
    
    return hand;
  };

  const startNewRound = () => {
    const hand = generateFullHand();
    setFullHand(hand);
    setCurrentIndex(0);
    setGameState('idle');
    setUserGuess('');
    setFeedback(null);
  };

  const startDrawing = () => {
    setGameState('drawing');
  };

  // Drawing animation loop
  useEffect(() => {
    if (gameState === 'drawing') {
      const drawSpeed = DIFFICULTIES[difficulty].drawSpeed;
      
      timerRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => {
          const nextIndex = prevIndex + 1;
          
          if (nextIndex >= fullHand.length) {
            // End of hand reached
            if (timerRef.current) clearInterval(timerRef.current);
            setGameState('input');
            return prevIndex; // Keep showing the last card
          }
          
          return nextIndex;
        });
      }, drawSpeed);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, difficulty, fullHand]);

  const checkAnswer = () => {
    const total = calculateTotal(fullHand);
    const userVal = parseInt(userGuess);
    const isCorrect = userVal === total;
    
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setScore(s => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userGuess) {
      checkAnswer();
    }
  };

  // Initialize first game
  useEffect(() => {
    startNewRound();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Compte Rapide Croupier</h2>
        <p className="text-sm sm:text-base text-emerald-200 mb-4">
          Le croupier tire jusqu'à 17. Mémorisez les cartes qui défilent et calculez le total.
        </p>
        
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-start sm:items-center justify-between mb-4">
           <div className="flex gap-4 sm:gap-6 text-sm sm:text-base">
            <div className="flex items-center gap-2 text-white">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              <span>{score.correct} / {score.total}</span>
            </div>
            {/* Difficulty Selector */}
            <div className="flex gap-2">
              {(Object.keys(DIFFICULTIES) as Difficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  disabled={gameState === 'drawing'}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    difficulty === d 
                      ? DIFFICULTIES[d].color + ' text-white' 
                      : 'bg-white/10 text-white/50 hover:bg-white/20'
                  }`}
                >
                  {DIFFICULTIES[d].label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={startNewRound}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm sm:text-base rounded-lg transition-colors border border-white/20"
          >
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
            Nouveau
          </button>
        </div>
      </div>

      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 sm:p-12 border border-white/10 min-h-100 flex flex-col items-center justify-between">
        
        {/* Card Display Area - Shows only current card */}
        <div className="flex justify-center items-center h-50">
           {fullHand.length > 0 && (
             <div className="transform transition-all duration-200 hover:scale-105">
               <PlayingCard card={fullHand[currentIndex]} />
               <div className="mt-4 text-center text-emerald-500/50 text-xs font-mono">
                 Carte {currentIndex + 1} / {gameState === 'input' || feedback !== null ? fullHand.length : '?'}
               </div>
             </div>
           )}
        </div>

        {/* Controls / Status */}
        <div className="w-full max-w-md mt-8">
          {gameState === 'idle' && (
            <button
              onClick={startDrawing}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xl shadow-lg shadow-emerald-900/20 transition-all transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6 fill-current" />
              Lancer la distribution
            </button>
          )}

          {gameState === 'input' && feedback === null && (
            <div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
              <label className="block text-center text-white mb-2">Total mémorisé ?</label>
              <input
                type="number"
                value={userGuess}
                onChange={(e) => setUserGuess(e.target.value)}
                onKeyDown={handleKeyPress}
                autoFocus
                className="w-full text-center bg-white/10 border-2 border-white/20 rounded-xl py-3 text-2xl font-mono text-white focus:border-emerald-400 focus:outline-none mb-4"
                placeholder="21"
              />
              <button
                onClick={checkAnswer}
                disabled={!userGuess}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-bold"
              >
                Valider
              </button>
            </div>
          )}

          {feedback !== null && (
            <div className={`p-6 rounded-xl text-center ${
              feedback === 'correct' ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-red-500/20 border border-red-500/50'
            }`}>
              <div className="flex items-center justify-center gap-3 mb-2">
                {feedback === 'correct' ? <CheckCircle className="text-emerald-400 w-8 h-8" /> : <XCircle className="text-red-400 w-8 h-8" />}
                <span className={`text-2xl font-bold ${feedback === 'correct' ? 'text-emerald-200' : 'text-red-200'}`}>
                  {feedback === 'correct' ? 'Correct !' : 'Incorrect'}
                </span>
              </div>
              <div className="text-white/80 mb-4">
                Total : <span className="font-mono font-bold text-white text-lg">{calculateTotal(fullHand)}</span>
                {isBlackjack(fullHand) && <span className="ml-2 text-yellow-400 font-bold">(Blackjack)</span>}
              </div>
              
              {/* Show all cards in feedback for review */}
              <div className="mb-4 pt-4 border-t border-white/10">
                <div className="text-white/50 text-xs mb-2">Cartes tirées :</div>
                <div className="flex justify-center -space-x-4 overflow-x-auto pb-2">
                  {fullHand.map((c, i) => (
                    <div key={i} className="transform scale-75 origin-top">
                      <PlayingCard card={c} size="small" />
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                onClick={startNewRound}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              >
                Continuer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}