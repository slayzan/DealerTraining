import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PlayingCard } from '../../components/PlayingCards';
import type { Card } from '../../utils/CardUtils';
import {createDeck, shuffleDeck } from '../../utils/CardUtils';
import { solveTexasHoldemHand } from '../../utils/Poker';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';

// Table de paiement Ultimate Texas Hold'em
const PAYOUT_TABLE = {
  'Three of a Kind': {
    bonus: '3x',
    blinde: '0x',
    progressive: null
  },
  'Straight': {
    bonus: '4x',
    blinde: '1x',
    progressive: null
  },
  'Flush': {
    bonus: '7x',
    blinde: '1.5x',
    progressive: null
  },
  'Full House': {
    bonus: '8x',
    blinde: '3x',
    progressive: '50€'
  },
  'Four of a Kind': {
    bonus: '30x',
    blinde: '10x',
    progressive: '500€'
  },
  'Straight Flush': {
    bonus: '50x',
    blinde: '40x',
    progressive: '1500€'
  },
  'Royal Flush': {
    bonus: '50x',
    blinde: '500x',
    progressive: null
  }
} as const;

type PayoutHandType = keyof typeof PAYOUT_TABLE;

// Options de réponses disponibles (valeurs réelles du tableau)
const ANSWER_OPTIONS = {
  bonus: ['3x', '4x', '7x', '8x', '30x', '50x'],
  blinde: ['0x', '1x', '1.5x', '3x', '10x', '40x', '500x'],
  progressive: ['50€', '500€', '1500€', 'Aucun']
} as const;

export function TexasHoldemPayoutQuiz() {
  const [board, setBoard] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [handType, setHandType] = useState<string>('');
  const [questionType, setQuestionType] = useState<'blinde' | 'bonus'>('blinde');
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [gameState, setGameState] = useState<'playing' | 'feedback'>('playing');
  const [correctBlindeAnswer, setCorrectBlindeAnswer] = useState<string>('');
  const [correctBonusAnswer, setCorrectBonusAnswer] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    startNewRound();
  }, []);

  const startNewRound = () => {
    // Dé à 20 faces pour forcer certaines mains rares
    const diceRoll = Math.floor(Math.random() * 20) + 1;
    
    let forcedHand: PayoutHandType | null = null;
    
    // Probabilités ajustées pour les mains les plus rares
    if (diceRoll >= 18 && diceRoll <= 20) {
      // 3 faces sur 20 = 15% Royal Flush
      forcedHand = 'Royal Flush';
    } else if (diceRoll >= 16 && diceRoll <= 17) {
      // 2 faces sur 20 = 10% Straight Flush
      forcedHand = 'Straight Flush';
    } else if (diceRoll >= 14 && diceRoll <= 15) {
      // 2 faces sur 20 = 10% Four of a Kind
      forcedHand = 'Four of a Kind';
    }
    // Full House retiré - sera généré aléatoirement
    
    // Si on doit forcer une main rare, on la génère
    if (forcedHand) {
      const generatedHand = generateForcedHand(forcedHand);
      if (generatedHand) {
        setBoard(generatedHand.board);
        setPlayerHand(generatedHand.playerHand);
        setHandType(forcedHand);
        console.log(handType);
        
        const payoutData = PAYOUT_TABLE[forcedHand];
        
        setCorrectBlindeAnswer(payoutData['blinde'] as string);
        setCorrectBonusAnswer(payoutData['bonus'] as string);
        setQuestionType('blinde');
        setSelectedAnswer('');
        setGameState('playing');
        return;
      }
    }
    
    // Sinon, génération aléatoire normale
    let attempts = 0;
    const maxAttempts = 100;
    
    while (attempts < maxAttempts) {
      const deck = shuffleDeck(createDeck());
      const newBoard = deck.slice(0, 5);
      const newPlayerHand = deck.slice(5, 7);
      
      const evaluation = solveTexasHoldemHand(newPlayerHand, newBoard);
      const handName = evaluation.rankName;
      
      // Vérifie si c'est une main payante
      if (handName in PAYOUT_TABLE) {
        setBoard(newBoard);
        setPlayerHand(newPlayerHand);
        setHandType(handName as PayoutHandType);
        
        const payoutData = PAYOUT_TABLE[handName as PayoutHandType];
        
        setCorrectBlindeAnswer(payoutData['blinde'] as string);
        setCorrectBonusAnswer(payoutData['bonus'] as string);
        setQuestionType('blinde');
        setSelectedAnswer('');
        setGameState('playing');
        return;
      }
      
      attempts++;
    }
    
    // Fallback: Force a Four of a Kind si aucune main trouvée
    const fallbackHand = generateForcedHand('Four of a Kind');
    if (fallbackHand) {
      setBoard(fallbackHand.board);
      setPlayerHand(fallbackHand.playerHand);
      setHandType('Four of a Kind');
      setCorrectBlindeAnswer(PAYOUT_TABLE['Four of a Kind']['blinde'] as string);
      setCorrectBonusAnswer(PAYOUT_TABLE['Four of a Kind']['bonus'] as string);
      setQuestionType('blinde');
      setSelectedAnswer('');
      setGameState('playing');
    }
  };

  // Fonction pour générer une main forcée
  const generateForcedHand = (handType: PayoutHandType): { board: Card[], playerHand: Card[] } | null => {
    switch (handType) {
      case 'Royal Flush': {
        // A♠ K♠ Q♠ J♠ 10♠
        const suit = ['hearts', 'diamonds', 'clubs', 'spades'][Math.floor(Math.random() * 4)] as Card['suit'];
        return {
          board: [
            { rank: 'K', suit },
            { rank: 'Q', suit },
            { rank: 'J', suit },
            { rank: '2', suit: 'hearts' }, // carte neutre
            { rank: '7', suit: 'clubs' }   // carte neutre
          ],
          playerHand: [
            { rank: 'A', suit },
            { rank: '10', suit }
          ]
        };
      }
      
      case 'Straight Flush': {
        // 9♥ 8♥ 7♥ 6♥ 5♥
        const suit = ['hearts', 'diamonds', 'clubs', 'spades'][Math.floor(Math.random() * 4)] as Card['suit'];
        return {
          board: [
            { rank: '8', suit },
            { rank: '7', suit },
            { rank: '6', suit },
            { rank: '2', suit: 'clubs' }, // carte neutre
            { rank: 'K', suit: 'diamonds' } // carte neutre
          ],
          playerHand: [
            { rank: '9', suit },
            { rank: '5', suit }
          ]
        };
      }
      
      case 'Four of a Kind': {
        // K K K K x
        const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7'];
        const quadRank = ranks[Math.floor(Math.random() * ranks.length)] as Card['rank'];
        return {
          board: [
            { rank: quadRank, suit: 'hearts' },
            { rank: quadRank, suit: 'diamonds' },
            { rank: quadRank, suit: 'clubs' },
            { rank: '3', suit: 'hearts' },
            { rank: '7', suit: 'clubs' }
          ],
          playerHand: [
            { rank: quadRank, suit: 'spades' },
            { rank: '2', suit: 'hearts' }
          ]
        };
      }
      
      default:
        return null;
    }
  };

  const checkAnswer = () => {
    const correct = questionType === 'blinde' ? selectedAnswer === correctBlindeAnswer : selectedAnswer === correctBonusAnswer;
    
    // Si c'est correct et qu'on est sur la question BLINDE, passer directement au BONUS
    if (correct && questionType === 'blinde') {
      setQuestionType('bonus');
      setSelectedAnswer('');
      setGameState('playing');
    } else {
      // Sinon afficher le feedback
      setGameState('feedback');
    }
  };

  const handleNextQuestion = () => {
    if (questionType === 'blinde') {
      // Passer à la question BONUS
      setQuestionType('bonus');
      setSelectedAnswer('');
      setGameState('playing');
    } else {
      // Après BONUS, nouvelle main
      startNewRound();
    }
  };

  const getQuestionText = () => {
    return `Combien paie la case ${questionType.toUpperCase()} ?`;
  };

  const getAnswerOptions = () => {
    return { blinde: ANSWER_OPTIONS['blinde'], bonus: ANSWER_OPTIONS['bonus'] };
  };

  const isCorrect = () => {
    return questionType === 'blinde' ? selectedAnswer === correctBlindeAnswer : selectedAnswer === correctBonusAnswer;
  };

  return (
    <div className="bg-emerald-900/50 rounded-2xl p-4 sm:p-8 shadow-2xl border border-emerald-800">
      
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10 mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 flex items-center gap-2">
              Quiz Paiements Ultimate Texas Hold'em
            </h2>
            <p className="text-sm sm:text-base text-emerald-200">
              Mémorise les paiements Bonus, Blinde
            </p>
          </div>
          <button
             onClick={startNewRound}
             className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-900/20"
             title="Nouvelle Main"
          >
             <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Cards Display */}
      <div className="space-y-6 sm:space-y-8 mb-8">
        {/* Board */}
        <div className="flex flex-col items-center">
          <div className="text-emerald-300 text-sm uppercase tracking-widest font-bold mb-3">Board</div>
          <div className="flex gap-2 sm:gap-4 p-4 bg-emerald-800/30 rounded-xl border border-white/5">
            {board.map((card, i) => (
              <motion.div
                  key={`board-${i}`}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
              >
                  <PlayingCard 
                    card={card} 
                    size={isMobile ? 'small' : 'medium'} 
                    minimal={isMobile} 
                  />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Player Hand */}
        <div className="flex flex-col items-center">
          <div className="text-emerald-300 text-sm uppercase tracking-widest font-bold mb-3">Main du joueur</div>
          <div className="flex gap-2 sm:gap-4 p-4 bg-emerald-800/30 rounded-xl border border-white/5">
            {playerHand.map((card, i) => (
              <motion.div
                  key={`hand-${i}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
              >
                  <PlayingCard 
                    card={card} 
                    size={isMobile ? 'small' : 'medium'} 
                    minimal={isMobile} 
                  />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Question Section */}
      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10 mb-8">
        <div className="text-center mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
            {getQuestionText()}
          </h3>
          <p className="text-sm text-emerald-300">
            Analyse les cartes et sélectionne le bon paiement
          </p>
        </div>

        {/* Answer Options */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto">
          {(questionType === 'blinde' ? getAnswerOptions().blinde : getAnswerOptions().bonus).map((option) => {
            const correctAnswer = questionType === 'blinde' ? correctBlindeAnswer : correctBonusAnswer;
            let buttonStyle = 'bg-white/5 hover:bg-white/10 border-white/10 text-white';
            
            if (gameState === 'playing' && selectedAnswer === option) {
              buttonStyle = 'bg-emerald-600 border-emerald-400 text-white';
            } else if (gameState === 'feedback') {
              if (option === correctAnswer) {
                buttonStyle = 'bg-green-600 border-green-400 text-white';
              } else if (selectedAnswer === option && option !== correctAnswer) {
                buttonStyle = 'bg-red-600 border-red-400 text-white';
              } else {
                buttonStyle = 'bg-white/5 border-white/10 text-gray-400';
              }
            }

            return (
              <button
                key={option}
                onClick={() => gameState === 'playing' && setSelectedAnswer(option)}
                disabled={gameState !== 'playing'}
                className={`px-4 py-3 sm:py-4 rounded-xl border-2 font-bold text-sm sm:text-base transition-all ${buttonStyle} disabled:cursor-not-allowed`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-center">
        {gameState === 'playing' ? (
            <button
                onClick={checkAnswer}
                disabled={!selectedAnswer}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl shadow-lg transition-colors flex items-center gap-2"
            >
                Valider
            </button>
        ) : (
            <div className="text-center animate-in fade-in slide-in-from-bottom-4">
                <div className={`text-xl font-bold mb-4 flex items-center justify-center gap-2 ${isCorrect() ? 'text-green-400' : 'text-red-400'}`}>
                    {isCorrect() ? (
                        <>
                            <CheckCircle className="w-6 h-6" />
                            Correct !
                        </>
                    ) : (
                        <>
                            <XCircle className="w-6 h-6" />
                            Incorrect. La bonne réponse est : {questionType === 'blinde' ? correctBlindeAnswer : correctBonusAnswer}
                        </>
                    )}
                </div>
                <button
                    onClick={handleNextQuestion}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-xl shadow-lg transition-colors flex items-center gap-2 mx-auto"
                >
                    <RefreshCw className="w-5 h-5" />
                    {questionType === 'blinde' ? 'Question Suivante (Bonus)' : 'Main Suivante'}
                </button>
            </div>
        )}
      </div>
    </div>
  );
}