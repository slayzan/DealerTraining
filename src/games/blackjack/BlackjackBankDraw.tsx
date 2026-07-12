import { useState, useEffect } from 'react';
import type { Card } from '../../utils/CardUtils';
import {createDeck, shuffleDeck } from '../../utils/CardUtils';
import { PlayingCard } from '../../components/PlayingCards';
import { Trophy, RotateCcw, Clock } from 'lucide-react';

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyConfig {
  label: string;
  color: string;
  description: string;
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  easy: { 
    label: 'Facile', 
    color: 'bg-green-600',
    description: 'Niveau débutant'
  },
  medium: { 
    label: 'Moyen', 
    color: 'bg-yellow-600',
    description: 'Niveau intermédiaire'
  },
  hard: { 
    label: 'Difficile', 
    color: 'bg-red-600',
    description: 'Niveau avancé'
  }
};

export function BlackjackBankDraw() {
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [gameState, setGameState] = useState<'playing' | 'correct' | 'wrong'>('playing');
  const [errorMessage, setErrorMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  
  // Timer and Score states
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    startNewRound();
  }, []);

  // Timer effect
  useEffect(() => {
    if (isGameActive && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (isGameActive && timeLeft === 0) {
      // Temps écoulé
      setIsGameActive(false);
      setGameEnded(true);
      setGameState('wrong');
    }
  }, [isGameActive, timeLeft]);

  // Change difficulty effect
  useEffect(() => {
    handleStartGame();
  }, [difficulty]);

  useEffect(() => {
    if (gameState === 'correct' && !gameEnded) {
      setScore(prev => prev + 1);
      const timer = setTimeout(() => {
        startNewRound();
        setErrorMessage('');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState, gameEnded]);

  const calculateTotal = (cards: Card[]): number => {
    let total = 0;
    let aces = 0;

    cards.forEach(card => {
      if (card.rank === 'A') {
        aces += 1;
        total += 11;
      } else if (['J', 'Q', 'K'].includes(card.rank)) {
        total += 10;
      } else {
        total += parseInt(card.rank);
      }
    });

    // Adjust for aces
    while (total > 21 && aces > 0) {
      total -= 10;
      aces -= 1;
    }

    return total;
  };

  const isBlackjack = (cards: Card[]): boolean => {
    if (cards.length !== 2) return false;
    const total = calculateTotal(cards);
    return total === 21;
  };

  const startNewRound = () => {
    const newDeck = shuffleDeck(createDeck());
  
    const firstCard = newDeck[0];
    setDeck(newDeck.slice(1));
    setDealerCards([firstCard]);
    setGameState('playing');
  };

  const handleHit = () => {
    if (gameState !== 'playing' || deck.length === 0) return;

    const currentTotal = calculateTotal(dealerCards);
    
    // Erreur si on tire alors que total >= 17
    if (currentTotal >= 17) {
      setGameState('wrong');
      setErrorMessage(`❌ Erreur ! Vous avez ${currentTotal}`);
      return;
    }

    const newCard = deck[0];
    const newDealerCards = [...dealerCards, newCard];

    setDealerCards(newDealerCards);
    setDeck(deck.slice(1));
  };

  const handleStand = () => {
    if (gameState !== 'playing') return;

    const total = calculateTotal(dealerCards);
    
    // Erreur si total > 21 (devrait appuyer sur Bust)
    if (total > 21) {
      setGameState('wrong');
      setErrorMessage(`❌ Erreur ! Vous avez ${total}`);
    }
    // Erreur si total < 17 (doit continuer à tirer)
    else if (total < 17) {
      setGameState('wrong');
      setErrorMessage(`❌ Erreur ! Vous avez ${total}`);
    }
    // Correct si 17 <= total <= 21
    else {
      setGameState('correct');
    }
  };

  const handleBust = () => {
    if (gameState !== 'playing') return;

    const total = calculateTotal(dealerCards);
    
    // Correct si total > 21
    if (total > 21) {
      setGameState('correct');
    }
    // Erreur si total <= 21 (pas bust)
    else {
      setGameState('wrong');
      setErrorMessage(`❌ Erreur ! Vous avez ${total}`);
    }
  };

  const handleReset = () => {
    startNewRound();
    setErrorMessage('');
  };

  const handleStartGame = () => {
    startNewRound();
    setScore(0);
    setGameEnded(false);
    setErrorMessage('');
    
    if (difficulty === 'easy') {
      setIsGameActive(false);
      setTimeLeft(0);
    } else {
      setIsGameActive(true);
      setTimeLeft(difficulty === 'medium' ? 30 : 15);
    }
  };


  return (
    <div className="bg-emerald-900/50 rounded-2xl p-4 sm:p-8 shadow-2xl border border-emerald-800">
      
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 flex items-center gap-2">
              Simulation Tirage Banque
            </h2>
          </div>
        </div>

        {/* Difficulty Selector */}
        <div>
          <label className="text-emerald-300 text-sm font-medium mb-2 block">Niveau de difficulté</label>
          <div className="flex gap-2">
            {(Object.keys(DIFFICULTIES) as Difficulty[]).map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficulty(diff)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  difficulty === diff
                    ? `${DIFFICULTIES[diff].color} text-white shadow-lg`
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {DIFFICULTIES[diff].label}
              </button>
            ))}
          </div>
        </div>

        {/* Timer and Score (for Medium and Hard) */}
        {difficulty !== 'easy' && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-black/40 rounded-lg p-3 border border-white/10">
              <div className="flex items-center justify-center gap-2">
                <Clock className={`w-5 h-5 ${timeLeft <= 5 ? 'text-red-400' : 'text-blue-400'}`} />
                <div>
                  <div className="text-xs text-gray-400">Temps restant</div>
                  <div className={`text-xl font-bold ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>
                    {timeLeft}s
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-black/40 rounded-lg p-3 border border-white/10">
              <div className="flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="text-xs text-gray-400">Score</div>
                  <div className="text-xl font-bold text-white">{score}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dealer Cards */}
      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 sm:p-12 border border-white/10 mb-6 sm:mb-8">
        {/* Cards Display */}
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 min-h-50 sm:min-h-70">
          {dealerCards.map((card, index) => (
            <div
              key={`${card.suit}-${card.rank}-${index}`}
              className="transform transition-all hover:scale-105"
            >
              <PlayingCard 
                card={card} 
                size={isMobile ? 'large' : 'large'}
                minimal={isMobile}
              />
            </div>
          ))}
        </div>

        {/* Status Message */}
        {gameState === 'wrong' && (
          <div className="text-center mt-6">
            <div className="text-lg sm:text-xl font-bold text-red-400">
              {isBlackjack(dealerCards)? 'Erreur vous avez un Blackjack' : errorMessage}
            </div>
          </div>
        )}

        {gameState === "correct" && (
          <div className="text-center mt-6">
            <div className="text-lg sm:text-xl font-bold text-emerald-400">
              {isBlackjack(dealerCards)
                ? "Blackjack"
                : `Correct ! Main terminée à ${calculateTotal(dealerCards)}`}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {gameState === 'playing' && !gameEnded ? (
          <>
            <button
              onClick={handleHit}
              className="px-4 sm:px-6 py-5 sm:py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg sm:text-lg rounded-xl shadow-lg transition-all active:scale-95"
            >
              Tirer
            </button>
            
            <button
              onClick={handleStand}
              className="px-4 sm:px-6 py-5 sm:py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg sm:text-lg rounded-xl shadow-lg transition-all active:scale-95"
            >
              Rester
            </button>
            
            <button
              onClick={handleBust}
              className="px-4 sm:px-6 py-5 sm:py-4 bg-red-600 hover:bg-red-500 text-white font-bold text-lg sm:text-lg rounded-xl shadow-lg transition-all active:scale-95"
            >
              Bust
            </button>
          </>
        ) : gameEnded ? (
          <div className="col-span-3 space-y-4">
            <div className="bg-linear-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/30 text-center">
              <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-white mb-2">Temps écoulé !</h3>
              <p className="text-yellow-200 text-lg mb-1">Score final</p>
              <p className="text-4xl font-bold text-yellow-400">{score}</p>
            </div>
            <button
              onClick={handleStartGame}
              className="w-full px-6 py-5 sm:py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Rejouer
            </button>
          </div>
        ) : (
          <button
            onClick={handleReset}
            className="col-span-3 px-6 py-5 sm:py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Nouvelle Main
          </button>
        )}
      </div>
    </div>
  );
}