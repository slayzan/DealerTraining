import { useState, useEffect } from 'react';
import type { Card } from '../../utils/CardUtils';
import { createDeck, shuffleDeck } from '../../utils/CardUtils';
import {Trophy, RotateCcw, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { PlayingCard } from '../../components/PlayingCards';

type Difficulty = 'facile' | 'moyen' | 'difficile';

interface DifficultyConfig {
  displayTime: number;
  label: string;
  color: string;
}

const DIFFICULTIES: Record<Difficulty, DifficultyConfig> = {
  facile: { displayTime: 2, label: 'Facile (2s)', color: 'bg-green-600' },
  moyen: { displayTime: 1, label: 'Moyen (1s)', color: 'bg-yellow-600' },
  difficile: { displayTime: 0.5, label: 'Difficile (0.5s)', color: 'bg-red-600' }
};

export function CountingCards() {
    const [difficulty, setDifficulty] = useState<Difficulty>('facile');
  const [cards, setCards] = useState<Card[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showCards, setShowCards] = useState(false);
  const [displayTimer, setDisplayTimer] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

 useEffect(() => {
    if (showCards && displayTimer > 0) {
      const interval = setInterval(() => {
        setDisplayTimer(t => {
          if (t <= 0.1) {
            setShowCards(false);
            return 0;
          }
          return t - 0.1;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [showCards, displayTimer]);

 const generateNewChallenge = () => {
    const deck = shuffleDeck(createDeck());
    const twoCards = deck.slice(0, 2);
    
    setCards(twoCards);
    setUserAnswer('');
    setFeedback(null);
    setShowAnswer(false);
    setShowCards(true);
    setDisplayTimer(DIFFICULTIES[difficulty].displayTime);
    setGameStarted(true);
  };
  
  const calculateCardValue = (card: Card): number => {
    if (card.rank === 'A') return 11; // Will be adjusted if needed
    if (['J', 'Q', 'K'].includes(card.rank)) return 10;
    return parseInt(card.rank);
  };

  const hasAce = (): boolean => {
    return cards.some(card => card.rank === 'A');
  };

  const isBlackjack = (): boolean => {
    if (cards.length !== 2) return false;
    const hasAceCard = cards.some(card => card.rank === 'A');
    const hasTenValueCard = cards.some(c=> ['10', 'J', 'Q', 'K'].includes(c.rank));
    return hasAceCard && hasTenValueCard;
  };

  const calculateValues = (): { low: number; high: number; isBlackjack: boolean } => {
    let total = 0;
    let aces = 0;

    cards.forEach(card => {
      const value = calculateCardValue(card);
      total += value;
      if (card.rank === 'A'){
        aces++;
      }
    });

    // High value (all aces as 11)
    const high = total;
    
    // Low value (all aces as 1)
    const low = total - (aces * 10);

    return { low, high, isBlackjack: isBlackjack() };
  };
  const getCorrectAnswer = (): string => {
    const { low, high } = calculateValues();
    if (isBlackjack()){
      return 'bj';
    }
    if (hasAce() && low !== high) {
      return `${low} ${high}`;
    }
    if (high > 21){
      return low.toString();
    }
    return high.toString();
  };



  const CheckAnswer = () => {
    const correctAnswer = getCorrectAnswer();
    const userTrimmed = userAnswer.trim();
    console.log(`User Answer: ${userTrimmed}, Correct Answer: ${correctAnswer}`);
    const isCorrect = userTrimmed === correctAnswer;
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setScore(prev => ({
      correct: isCorrect ? prev.correct + 1 : prev.correct,
      total: prev.total + 1
    }));

    if (isCorrect) {
       // Auto-launch new game after 1.5 seconds
      setTimeout(() => {
        generateNewChallenge();
      }, 1500);
    } else {
      setShowAnswer(true);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Calcul de Valeur de Cartes</h2>
        <p className="text-sm sm:text-base text-emerald-200 mb-4">
          Mémorisez les cartes et calculez leur valeur totale.
        </p>

        <div className="flex flex-row sm:flex-row flex-wrap gap-3 sm:gap-4 items-stretch justify-between mb-4">
          <div className="flex gap-6  sm:gap-6 text-sm sm:text-base">
            <div className="flex items-center gap-2 text-white">
              <Trophy className="w-6 h-6 text-yellow-400 shrink-0"/>
              <span>{score.correct} / {score.total} ({score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%)</span>
            </div>
          </div>

          <button
            onClick={generateNewChallenge}
            disabled={showCards}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm sm:text-base rounded-lg transition-colors border border-white/20"
          >
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
            {gameStarted ? 'Nouveau défi' : 'Commencer'}
          </button>
        </div>

        <div>
          <label className="block text-white font-medium mb-2 text-sm">Niveau de difficulté :</label>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(DIFFICULTIES) as Difficulty[]).map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                disabled={showCards}
                className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                  difficulty === level
                    ? `${DIFFICULTIES[level].color} text-white`
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {DIFFICULTIES[level].label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 sm:p-12 border border-white/10">
      {/* Cards Display Area */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            {showCards ? (
            <>
              <Eye className="w-6 h-6 text-emerald-400" />
              <div className="text-white font-medium">
                Temps restant : <span className="text-emerald-400 font-mono text-xl">{displayTimer.toFixed(1)}s</span>
              </div>
            </>
            ) : (
              <>
              <EyeOff className="w-6 h-6 text-orange-400"/>
              <div className="text-white font-medium">
                  {cards.length > 0 ? 'Cartes cachées' : 'Prêt à commencer'}
              </div>
              </>
            )}
          </div>
          <div className="flex justify-center gap-3 sm:gap-4 min-h-35 sm:min-h-45 items-center bg-emerald-900/30 rounded-xl p-6 sm:p-8">
            {showCards ? (
              cards.map((card, idx) => (
                <PlayingCard key={idx} card={card} />
              ))
            ) : cards.length > 0 ? (
              cards.map((_, idx) => (
                <div
                  key={idx}
                  className="w-20 sm:w-25 h-28 sm:h-35 bg-linear-to-br from-blue-900 to-blue-950 rounded-lg border-2 border-blue-400 flex items-center justify-center">
                    <div className="text-blue-300 text-4xl">?</div>
                  </div>
            ))) : (<div className="text-emerald-300/50 italic text-sm sm:text-base">
                Cliquez sur "Commencer" pour débuter
              </div>
            )}
          </div>
        </div>
        {/* Answer Input */}
        {cards.length > 0 && !showCards && feedback === null && (
          <div className="max-w-md mx-auto">
            <div className="mb-6">
              <label className="block text-white font-medium mb-3 text-sm sm:text-base">
                Quelle est la valeur totale des cartes ?
              </label>
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Ex: 17 ou 5 15 ou bj"
                className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-lg text-white text-xl sm:text-2xl font-mono placeholder-white/30 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 text-center"
                autoFocus
              />
            </div>

            <button
              onClick={CheckAnswer}
              disabled={!userAnswer}
              className="w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-colors"
            >
              Vérifier
            </button>
          </div>
        )}
        {/* Feedback */}
        {feedback !== null && (
          <div className={`max-w-md mx-auto  p-4 sm:p-6 rounded-lg ${
            feedback === 'correct' 
              ? 'bg-emerald-600/20 border border-emerald-500/30' 
              : 'bg-red-600/20 border border-red-500/30'
            }`}>
            <div className="flex items-center justify-center gap-3 mb-3">
              {feedback === 'correct' ? (
                <>
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                  <div className="text-emerald-200 font-bold text-xl">Excellent !</div>
                </>
              ) : (
                <>
                  <XCircle className="w-8 h-8 text-red-400" />
                  <div className="text-red-200 font-bold text-xl">Incorrect</div>
                </>
              )}
            </div>

            {feedback === 'correct' && (
              <div className="text-center text-emerald-300 text-sm animate-pulse">
                Prochain défi dans un instant...
              </div>
            )}
          
        {/* Show Correct Answer */}
        {showAnswer && (
          <div className='mb-4 space-y-3'>
            <div className="p-4 bg-black/30 rounded">
              <div className="text-white/70 text-sm mb-2">Les cartes étaient :</div>
              <div className='flex justify-center gap-2 mb-3'>
                {cards.map((card, idx) => (
                  <PlayingCard key={idx} card={card} size="small" />
                ))}
              </div>
            </div>
            <div className="p-4 bg-white/10 rounded text-center">
              <div className="text-white/70 text-sm mb-2">
                {isBlackjack() ? 'Blackjack !' : hasAce() ? 'Valeurs possibles :' : 'Valeur totale :'}
              </div>
              <div className='text-white font-mono text-3xl font-bold'>
                {getCorrectAnswer()}
              </div>
            </div>
            <button
              onClick={generateNewChallenge}
                className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg font-medium transition-colors">
                  Continuer
            </button>
          </div> )}
          </div>
        )}
        {/* Rules */}
        <div className="mt-8 sm:mt-12 p-4 bg-blue-600/10 border border-blue-500/20 rounded-lg max-w-md mx-auto">
          <h4 className="font-medium text-white text-sm sm:text-base mb-2">Valeurs des cartes :</h4>
          <ul className="space-y-1 text-xs sm:text-sm text-blue-200">
            <li>• Cartes 2 à 10 : valeur faciale</li>
            <li>• Valet (J), Dame (Q), Roi (K) : 10</li>
            <li>• As (A) : 1 ou 11</li>
            <li>• Si As présent : répondre "valeur_basse valeur_haute exemple: (5 15)"</li>
            <li>• As + figure / 10 = Blackjack répondre ( bj )</li>
          </ul>
        </div>
      </div>
    </div>
  );
}