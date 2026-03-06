import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PlayingCard } from '../../components/PlayingCards';
import type {Card} from '../../utils/CardUtils';
import {createDeck, shuffleDeck } from '../../utils/CardUtils';
import type { PlayerResult } from '../../utils/Poker';
import { determineWinnerTexasHoldem } from '../../utils/Poker';
import { Trophy, RefreshCw, CheckCircle, XCircle, Eye, Settings } from 'lucide-react';

export function TexasHoldemWinnerGame() {
  const [board, setBoard] = useState<Card[]>([]);
  const [players, setPlayers] = useState<{ id: number; name: string; hand: Card[] }[]>([]);
  const [results, setResults] = useState<PlayerResult[] | null>(null);
  const [selectedWinners, setSelectedWinners] = useState<number[]>([]); // Player IDs
  const [gameState, setGameState] = useState<'playing' | 'feedback'>('playing');
  const [isMobile, setIsMobile] = useState(false);
  
  // Settings
  const [playerCount, setPlayerCount] = useState(3);
  const [showSettings, setShowSettings] = useState(false);

  // Helper function to check if a card is in the best hand
  const isCardInBestHand = (card: Card, bestCards: Card[]) => {
    return bestCards.some(bc => bc.rank === card.rank && bc.suit === card.suit);
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    startNewRound();
  }, [playerCount]);

  const startNewRound = () => {
    const deck = shuffleDeck(createDeck());
    const newBoard = deck.slice(0, 5);
    
    // Create players with 2 cards each (Texas Hold'em)
    const newPlayers = [];
    let deckIdx = 5;
    
    for (let i = 0; i < playerCount; i++) {
        const hand = deck.slice(deckIdx, deckIdx + 2);
        deckIdx += 2;
        newPlayers.push({
            id: i,
            name: `Joueur ${i+1}`,
            hand
        });
    }

    setBoard(newBoard);
    setPlayers(newPlayers);
    setResults(null);
    setSelectedWinners([]);
    setGameState('playing');
  };

  const toggleSelection = (playerId: number) => {
    if (gameState !== 'playing') return;
    
    if (selectedWinners.includes(playerId)) {
        setSelectedWinners(selectedWinners.filter(id => id !== playerId));
    } else {
        setSelectedWinners([...selectedWinners, playerId]);
    }
  };

  const checkAnswer = () => {
    if (selectedWinners.length === 0) return;

    const computedResults = determineWinnerTexasHoldem(board, players);
    setResults(computedResults);
    setGameState('feedback');
  };

  const getFeedbackState = () => {
      if (!results) return null;
      
      const realWinners = results.filter(r => r.isWinner).map(r => r.id);
      
      // Check if selected matches real winners exactly
      const isCorrect = selectedWinners.length === realWinners.length && 
                        selectedWinners.every(id => realWinners.includes(id));
      
      return { isCorrect, realWinners };
  };

  const feedback = getFeedbackState();

  return (
    <div className="bg-emerald-900/50 rounded-2xl p-4 sm:p-8 shadow-2xl border border-emerald-800">
      
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10 mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 flex items-center gap-2">
              <Eye className="w-6 h-6 text-emerald-400" />
              Qui Gagne ? (Showdown)
            </h2>
            <p className="text-sm sm:text-base text-emerald-200">
              Analysez le board et les mains. Sélectionnez le(s) gagnant(s).
            </p>
          </div>
          <div className="flex gap-2">
            <button
               onClick={startNewRound}
               className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-900/20"
               title="Nouvelle Main"
            >
               <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white hover:bg-white/10'}`}
              title="Paramètres"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
           <div className="p-4 bg-white/5 rounded-lg border border-white/10 animate-in fade-in slide-in-from-top-2">
              <label className="flex flex-col gap-2">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-emerald-400 font-bold">Nombre de joueurs</span>
                    <span className="bg-black/40 px-3 py-1 rounded text-white font-mono">{playerCount}</span>
                 </div>
                 <input 
                   type="range" 
                   min="2" 
                   max="9" 
                   value={playerCount} 
                   onChange={(e) => setPlayerCount(parseInt(e.target.value))}
                   className="w-full accent-emerald-500 h-2 bg-black/40 rounded-lg appearance-none cursor-pointer"
                 />
                 <div className="flex justify-between text-xs text-gray-400 px-1 font-mono">
                   <span>2</span><span>9</span>
                 </div>
              </label>
           </div>
        )}
      </div>

      {/* Board Area */}
      <div className="flex flex-col items-center mb-8 sm:mb-12">
        <div className="text-emerald-300 text-sm uppercase tracking-widest font-bold mb-3">Board (Table)</div>
        <div className="flex gap-2 sm:gap-4 p-4 bg-emerald-800/30 rounded-xl border  border-white/5">
          {board.map((card, i) => {
            // Check if any winner uses this board card
            const shouldHighlight = gameState === 'feedback' && results?.some(r => 
              r.isWinner && isCardInBestHand(card, r.bestHand.bestCards)
            );
            
            return (
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
                    highlight={shouldHighlight}
                  />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {players.map((player) => {
            const isSelected = selectedWinners.includes(player.id);
            const playerResult = results?.find(r => r.id === player.id);
            const isWinner = playerResult?.isWinner;
            
            // Visual state colors
            let borderColor = 'border-white/10';
            let bgColor = 'bg-black/20';
            
            if (gameState === 'playing' && isSelected) {
                borderColor = 'border-yellow-500';
                bgColor = 'bg-yellow-500/10';
            } else if (gameState === 'feedback') {
                if (isWinner) {
                    borderColor = 'border-green-500';
                    bgColor = 'bg-green-500/20';
                } else if (isSelected && !isWinner) {
                    borderColor = 'border-red-500';
                    bgColor = 'bg-red-500/20';
                }
            }

            return (
                <motion.div
                    key={player.id}
                    className={`relative rounded-xl p-2 sm:p-4 border-2 transition-all cursor-pointer ${borderColor} ${bgColor}`}
                    onClick={() => toggleSelection(player.id)}
                    whileHover={gameState === 'playing' ? { scale: 1.02 } : {}}
                    whileTap={gameState === 'playing' ? { scale: 0.98 } : {}}
                >
                    <div className="flex justify-between items-center mb-2 sm:mb-3">
                        <span className="font-bold text-white text-sm sm:text-base">{player.name}</span>
                        {gameState === 'playing' && (
                            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-yellow-500 bg-yellow-500 text-black' : 'border-white/30'}`}>
                                {isSelected && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />}
                            </div>
                        )}
                        {gameState === 'feedback' && isWinner && (
                            <div className="bg-green-500 text-black text-[10px] sm:text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                                <Trophy className="w-3 h-3" /> GAGNANT
                            </div>
                        )}
                    </div>
                    
                    <div className="flex justify-center gap-2 sm:gap-2">
                        {player.hand.map((card, i) => {
                            // Check if this card is in the best hand for this player AND player is a winner
                            const shouldHighlight = gameState === 'feedback' && playerResult && 
                              playerResult.isWinner && isCardInBestHand(card, playerResult.bestHand.bestCards);
                            
                            return (
                                <PlayingCard 
                                    key={i} 
                                    card={card} 
                                    size="small" 
                                    minimal={isMobile}
                                    highlight={shouldHighlight}
                                />
                            );
                        })}
                    </div>
                    
                    {/* Hand Result Description */}
                    {gameState === 'feedback' && playerResult && (
                        <div className={`mt-2 sm:mt-3 text-xs sm:text-sm font-medium p-2 rounded ${isWinner ? 'bg-green-500/20 text-green-200' : 'bg-black/40 text-gray-400'}`}>
                            {playerResult.bestHand.description}
                        </div>
                    )}
                </motion.div>
            );
        })}
      </div>

      {/* Action Bar */}
      <div className="flex justify-center">
        {gameState === 'playing' ? (
            <button
                onClick={checkAnswer}
                disabled={selectedWinners.length === 0}
                className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold text-lg rounded-xl shadow-lg transition-colors flex items-center gap-2"
            >
                Valider
            </button>
        ) : (
            <div className="text-center animate-in fade-in slide-in-from-bottom-4">
                <div className={`text-xl font-bold mb-4 flex items-center justify-center gap-2 ${feedback?.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                    {feedback?.isCorrect ? (
                        <>
                            <CheckCircle className="w-6 h-6" />
                            Correct ! Bien joué.
                        </>
                    ) : (
                        <>
                            <XCircle className="w-6 h-6" />
                            Incorrect. Regardez les résultats.
                        </>
                    )}
                </div>
                <button
                    onClick={startNewRound}
                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg rounded-xl shadow-lg transition-colors flex items-center gap-2"
                >
                    <RefreshCw className="w-5 h-5" />
                    Main Suivante
                </button>
            </div>
        )}
      </div>

    </div>
  );
}
