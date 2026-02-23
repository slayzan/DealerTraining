import { useState, useEffect } from 'react';
import { Play, RotateCcw, Users, RefreshCw } from 'lucide-react';
import type { Card } from '../../utils/CardUtils';
import { createDeck, shuffleDeck } from '../../utils/CardUtils';
import { PlayingCard } from '../../components/PlayingCards';
import { motion } from 'motion/react';


export function PuntoGame() {
  const [deck, setDeck] = useState<Card[]>([]);
  const [puntoHand, setPuntoHand] = useState<Card[]>([]);
  const [bancoHand, setBancoHand] = useState<Card[]>([]);
  const [puntoThirdCard, setPuntoThirdCard] = useState<Card | null>(null);
  const [bancoThirdCard, setBancoThirdCard] = useState<Card | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'dealing' | 'result' | 'game-over'>('idle');
  const [winner, setWinner] = useState<'punto' | 'banco' | 'egalite' | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'hard'>('easy');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setDeck(shuffleDeck(createDeck()));
  }, []);

  const getCardValue = (card: Card): number => {
    if (!card) return 0;
    if (['10', 'J', 'Q', 'K'].includes(card.rank)) return 0;
    if (card.rank === 'A') return 1;
    return parseInt(card.rank);
  };

  const calculateScore = (cards: Card[]): number => {
    const total = cards.reduce((sum, card) => sum + getCardValue(card), 0);
    return total % 10;
  };



  const dealGame = async () => {
    let workingDeck = [...deck];
    if (workingDeck.length < 10) {
      workingDeck = shuffleDeck(createDeck());
    }
    
    setGameState('dealing');
    setPuntoHand([]);
    setBancoHand([]);
    setPuntoThirdCard(null);
    setBancoThirdCard(null);
    setWinner(null);
    setFeedback(null);

    // Initial 4 cards deal logic
    const pHand: Card[] = [];
    const bHand: Card[] = [];

    const cardsToDeal = workingDeck.splice(0, 4);
    setDeck(workingDeck);

    // Animation sequence
    if (cardsToDeal[0]) {
      pHand.push(cardsToDeal[0]);
      setPuntoHand([...pHand]);
      await new Promise(r => setTimeout(r, 300));
    }

    if (cardsToDeal[1]) {
      bHand.push(cardsToDeal[1]);
      setBancoHand([...bHand]);
      await new Promise(r => setTimeout(r, 300));
    }

    if (cardsToDeal[2]) {
      pHand.push(cardsToDeal[2]);
      setPuntoHand([...pHand]);
      await new Promise(r => setTimeout(r, 300));
    }

    if (cardsToDeal[3]) {
      bHand.push(cardsToDeal[3]);
      setBancoHand([...bHand]);
      await new Promise(r => setTimeout(r, 300));
    }

    setGameState('result'); // In this context, 'result' means "Hand Active" / "Dealing Done"
  };

  const puntoScore = calculateScore(puntoHand);
  const bancoScore = calculateScore(bancoHand);

  // Check game status helper
  // Natural only applies to the first two cards
  const isNatural = (puntoHand.length === 2 && bancoHand.length === 2) && (puntoScore >= 8 || bancoScore >= 8);
  const isGameOver = !!winner;

  const handleAction = async (action: 'punto-draw' | 'banco-draw' | 'punto-win' | 'banco-win' | 'egalite') => {
    if ((isGameOver || gameState === 'game-over') && action !== 'punto-draw' && action !== 'banco-draw') return; 
    setFeedback(null);

    const reportError = (msg: string) => {
      setFeedback(msg);
      if (difficulty === 'hard') {
        setGameState('game-over');
      }
    };

    // Rule 1: Natural (8 or 9)
    if (isNatural) {
      if (action === 'punto-draw' || action === 'banco-draw') {
        const pNat = puntoScore >= 8;
        const bNat = bancoScore >= 8;
        let reason = "";
        if (pNat && bNat) reason = `Punto (${puntoScore}) et Banco (${bancoScore}) ont un Naturel`;
        else if (pNat) reason = `Punto a un Naturel (${puntoScore})`;
        else reason = `Banco a un Naturel (${bancoScore})`;
        
        reportError(`Incorrect : ${reason}. La partie est terminée (Instant Win).`);
        return;
      }
      checkWinner(action);
      return;
    }

    // Rule 2: Punto Turn (0-5 Draws, 6-7 Stands)
    if (!puntoThirdCard) {
      if (puntoScore <= 5) {
        if (action !== 'punto-draw') {
          reportError(`Incorrect : Punto a ${puntoScore}, il DOIT tirer (règle 0-5).`);
          return;
        }
      } else {
        // Score 6 or 7 -> Stand
        if (action === 'punto-draw') {
           reportError(`Incorrect : Punto a ${puntoScore}, il doit rester (Stand sur 6-7).`);
           return;
        }
      }
    }

    // Rule 3: Banco Turn (Specific Rules)
    const puntoTurnFinished = puntoThirdCard || puntoScore >= 6;
    if (!bancoThirdCard && puntoTurnFinished) {
       // Banco = 0, 1, 2: Always Draw
       if (bancoScore <= 2) {
          if (action !== 'banco-draw') {
             reportError(`Incorrect : Banco a ${bancoScore}, il doit TOUJOURS tirer.`);
             return;
          }
       }

       // Banco = 7: Always Stand
       if (bancoScore === 7) {
          if (action === 'banco-draw') {
             reportError("Incorrect : Banco a 7, il doit rester.");
             return;
          }
       }

       // Banco = 3: Draw unless Punto 3rd card is 8
       if (bancoScore === 3) {
         const p3Val = puntoThirdCard ? getCardValue(puntoThirdCard) : -1;
         if (p3Val === 8) {
            if (action === 'banco-draw') {
              reportError("Incorrect : Banco a 3 mais Punto a tiré un 8 -> Banco doit rester.");
              return;
            }
         } else {
            if (action !== 'banco-draw') {
              reportError("Incorrect : Banco a 3, il doit tirer (sauf si Punto a tiré un 8).");
              return;
            }
         }
       }

       // Banco = 4: Draw if Punto 3rd card is 2-7
       if (bancoScore === 4) {
          const p3Val = puntoThirdCard ? getCardValue(puntoThirdCard) : -1;
          const mustDraw = p3Val === -1 || (p3Val >= 2 && p3Val <= 7);
          
          if (mustDraw) {
             if (action !== 'banco-draw') {
                reportError(`Incorrect : Banco (4) doit tirer contre ${p3Val === -1 ? 'Stand' : p3Val}.`);
                return;
             }
          } else {
             if (action === 'banco-draw') {
                reportError(`Incorrect : Banco (4) doit rester contre ${p3Val}.`);
                return;
             }
          }
       }

       // Banco = 5: Draw if Punto 3rd card is 4-7
       if (bancoScore === 5) {
          const p3Val = puntoThirdCard ? getCardValue(puntoThirdCard) : -1;
          const mustDraw = p3Val === -1 || (p3Val >= 4 && p3Val <= 7);
          
          if (mustDraw) {
             if (action !== 'banco-draw') {
                reportError(`Incorrect : Banco (5) doit tirer contre ${p3Val === -1 ? 'Stand' : p3Val}.`);
                return;
             }
          } else {
             if (action === 'banco-draw') {
                reportError(`Incorrect : Banco (5) doit rester contre ${p3Val}.`);
                return;
             }
          }
       }

       // Banco = 6: Draw if Punto 3rd card is 6-7
       if (bancoScore === 6) {
          const p3Val = puntoThirdCard ? getCardValue(puntoThirdCard) : -1;
          // If Punto stood (-1), Banco stands (Rule: Banco draws 0-5).
          const mustDraw = (p3Val === 6 || p3Val === 7);
          
          if (mustDraw) {
             if (action !== 'banco-draw') {
                reportError(`Incorrect : Banco (6) doit tirer contre ${p3Val}.`);
                return;
             }
          } else {
             if (action === 'banco-draw') {
                reportError(`Incorrect : Banco (6) doit rester contre ${p3Val === -1 ? 'Stand' : p3Val}.`);
                return;
             }
          }
       }
    }

    // Manual Draw Logic
    if (action === 'punto-draw') {
      if (puntoThirdCard) {
        setFeedback("Punto a déjà tiré.");
        return;
      }
      const newDeck = [...deck];
      const card = newDeck.shift();
      if (card) {
        setDeck(newDeck);
        setPuntoThirdCard(card);
        setPuntoHand(prev => [...prev, card]);
        setFeedback(null);
      }
      return;
    }

    if (action === 'banco-draw') {
      if (bancoThirdCard) {
        setFeedback("Banco a déjà tiré.");
        return;
      }
      const newDeck = [...deck];
      const card = newDeck.shift();
      if (card) {
        setDeck(newDeck);
        setBancoThirdCard(card);
        setBancoHand(prev => [...prev, card]);
        setFeedback(null);
      }
      return;
    }

    // Winner checks
    if (['punto-win', 'banco-win', 'egalite'].includes(action)) {
      checkWinner(action);
    }
  };

  const checkWinner = (userClaim: string) => {
    // Recalculate final scores
    const pScore = calculateScore(puntoHand); // includes 3rd card if added
    const bScore = calculateScore(bancoHand);

    let actualWinner = 'egalite';
    if (pScore > bScore) actualWinner = 'punto-win';
    else if (bScore > pScore) actualWinner = 'banco-win';

    if (userClaim === actualWinner) {
      setFeedback("Correct ! Bien joué.");
      setWinner(actualWinner === 'punto-win' ? 'punto' : actualWinner === 'banco-win' ? 'banco' : 'egalite');
    } else {
      setFeedback(`Incorrect. Le vrai résultat est : ${actualWinner.replace('-', ' ').toUpperCase()}`);
      if (difficulty === 'hard') {
        setGameState('game-over');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Distribution Punto Banco</h2>
            <p className="text-emerald-200">Simulation de la distribution avec règles de tirage.</p>
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row gap-2 items-end sm:items-center">
            <div className="bg-black/40 p-1 rounded-lg border border-white/10 flex">
              <button
                onClick={() => setDifficulty('easy')}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  difficulty === 'easy' 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : 'text-emerald-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Facile
              </button>
              <button
                onClick={() => setDifficulty('hard')}
                className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  difficulty === 'hard' 
                    ? 'bg-red-600 text-white shadow-lg' 
                    : 'text-red-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Difficile
              </button>
            </div>

            <button
              onClick={dealGame}
              disabled={gameState === 'dealing'}
              className="flex items-center gap-1 sm:gap-2 px-2 py-1.5 sm:px-6 sm:py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-bold text-[10px] sm:text-base transition-all shadow-lg shadow-emerald-900/20 whitespace-nowrap"
            >
              {gameState === 'idle' ? <Play className="w-3 h-3 sm:w-5 sm:h-5" /> : <RefreshCw className={`w-3 h-3 sm:w-5 sm:h-5 ${gameState === 'dealing' ? 'animate-spin' : ''}`} />}
              {gameState === 'idle' ? 'Distribuer' : 'Nouv. Main'}
            </button>
          </div>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div className={`mb-4 p-4 rounded-lg text-center font-bold ${
            feedback.startsWith('Correct') 
              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30' 
              : 'bg-red-600/20 text-red-300 border border-red-500/30'
          } animate-in fade-in slide-in-from-top-2`}>
            {feedback}
          </div>
        )}

        <div className="relative min-h-75 bg-emerald-900/40 rounded-xl border border-white/5 px-8 py-1 sm:p-1 flex flex-col justify-center">
  
       <div className="flex flex-row items-center justify-between sm:justify-around w-full">

            {/* Banco */}
          <div className="flex flex-col items-center w-1/3">

              {/* Zone haute réservée */}
              <div className="h-27.5 flex items-end justify-center">
                {bancoHand.length === 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="rotate-90 shadow-xl"
                  >
                    <PlayingCard card={bancoHand[2]} size={isMobile ? 'small' : 'medium'} minimal={isMobile}/>
                  </motion.div>
                )}
              </div>

              {/* Zone basse fixe */}
              <div className="h-50 flex flex-col items-center justify-start">

                <div className="flex gap-3 sm:gap-6 mb-6">
                  {bancoHand.slice(0, 2).map((card, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 30, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <PlayingCard card={card} size={isMobile ? 'small' : 'medium'} minimal={isMobile} />
                    </motion.div>
                  ))}
                </div>

                <div className="text-red-400 font-bold text-lg tracking-widest uppercase">
                  Banco
                </div>

              </div>
            </div>

                  {/* Divider */}
                  <div className="flex flex-col items-center justify-center h-32 sm:h-44 w-auto px-0 sm:px-4">
                    <div className="w-px h-full bg-white/10"></div>
                  </div>

                  {/* Punto */}
                <div className="flex flex-col items-center w-1/3">

              <div className="h-27.5 flex items-end justify-center">
                {puntoHand.length === 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="rotate-90 shadow-xl"
                  >
                    <PlayingCard card={puntoHand[2]} size={isMobile ? 'small' : 'medium'} minimal={isMobile}  />
                  </motion.div>
                )}
              </div>

              <div className="h-50 flex flex-col items-center justify-start">

                <div className="flex gap-3  sm:gap-6 mb-6">
                  {puntoHand.slice(0, 2).map((card, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 30, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                      <PlayingCard card={card} size={isMobile ? 'small' : 'medium'} minimal={isMobile}/>
                    </motion.div>
                  ))}
                </div>

                <div className="text-blue-400 font-bold text-lg tracking-widest uppercase">
                  Punto
                </div>

                </div>
              </div>
              </div>
            </div>
          {/* Winner Overlay */}
          {winner && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="bg-black/80 backdrop-blur-md px-8 py-4 rounded-xl border border-white/20 shadow-2xl animate-in zoom-in duration-300">
                <div className="text-center">
                  <div className="text-sm text-emerald-400 uppercase tracking-wider mb-1">Vainqueur</div>
                  <div className={`text-3xl font-bold ${
                    winner === 'punto' ? 'text-blue-400' : 
                    winner === 'banco' ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {winner === 'punto' ? 'PUNTO' : winner === 'banco' ? 'BANCO' : 'ÉGALITÉ'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Game Over Overlay */}
          {gameState === 'game-over' && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 w-full max-w-sm px-4">
              <div className="bg-black/90 backdrop-blur-md px-6 py-6 rounded-xl border border-red-500/50 shadow-2xl animate-in zoom-in duration-300">
                <div className="text-center">
                  <div className="text-sm text-red-400 uppercase tracking-wider mb-2">Game Over</div>
                  <div className="text-xl text-white font-bold mb-4">
                    Mauvais choix !
                  </div>
                  <button 
                    onClick={dealGame}
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Réessayer
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-start gap-2 sm:gap-4 px-1 sm:px-12">
          
          {/* Banco Actions */}
          <div className="flex flex-col gap-2 sm:gap-3 flex-1">
            <button 
              onClick={() => handleAction('banco-draw')}
              disabled={gameState !== 'result' || !!winner}
              className="w-full py-3 sm:py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-200 rounded-lg font-bold text-sm sm:text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Banco Pioche
            </button>
            <button 
              onClick={() => handleAction('banco-win')}
              disabled={gameState !== 'result' || !!winner}
              className="w-full py-3 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm sm:text-base transition-colors shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
              Banco Gagne
            </button>
          </div>

          {/* Middle Action */}
          <div className="flex flex-col gap-2 sm:gap-3 w-[20%] sm:w-40 pt-4 sm:pt-0">
             <button 
              onClick={() => handleAction('egalite')}
              disabled={gameState !== 'result' || !!winner}
              className="w-full py-3 sm:py-3 bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 text-green-200 rounded-lg font-bold text-sm sm:text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Égalité
            </button>
          </div>

          {/* Punto Actions */}
          <div className="flex flex-col gap-2 sm:gap-3 flex-1">
            <button 
              onClick={() => handleAction('punto-draw')}
              disabled={gameState !== 'result' || !!winner}
              className="w-full py-3 sm:py-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-200 rounded-lg font-bold text-sm sm:text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Punto Pioche
            </button>
            <button 
              onClick={() => handleAction('punto-win')}
              disabled={gameState !== 'result' || !!winner}
              className="w-full py-3 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm sm:text-base transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Punto Gagne
            </button>
          </div>

        </div>

        {/* Explanation */}
        <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <h3 className="text-white font-medium mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            Aide Mémoire : Règles de Tirage
          </h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-emerald-200/80">
            <div>
              <p className="font-bold text-emerald-400 mb-1">Punto</p>
              <ul className="list-disc list-inside space-y-1">
                <li>0-5 : <span className="text-white">TIRE</span> une carte</li>
                <li>6-7 : <span className="text-white">RESTE</span></li>
                <li>8-9 : <span className="text-yellow-400">Abbatage</span> (Fin du tour)</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-emerald-400 mb-1">Banco</p>
              <ul className="list-disc list-inside space-y-1">
                <li>0-2 : Tire une carte </li>
                <li>3 : Tire si  Punto tire sauf si la 3ème carte de Punto est un 8</li>
                <li>4 : Tire si  Punto tire entre 2-7</li>
                <li>5 : Tire si  Punto tire entre 4-7</li>
                <li>6 : Tire si  Punto tire entre 6-7</li>
                <li>6-7 : Banco tire entre 0 et 5 (prend les regles de tirage de Punto)</li>
                <li>8-9 : <span className="text-yellow-400">Abbatage</span> (Fin du tour)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
  );
}