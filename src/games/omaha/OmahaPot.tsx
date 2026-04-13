import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Settings, Play, RefreshCw, Calculator, CheckCircle, XCircle } from 'lucide-react';


type Action = 'POT' | 'Call' | 'Straddle' | null;

interface Player {
  id: number;
  name: string;
  position: string;
  currentBet: number;
  hasFolded: boolean;
  isDealer: boolean;
  isActive: boolean;
  lastAction: Action;
}

interface GameSettings {
  sb: number;
  bb: number;
  straddle: boolean;
  maxBetCap: number;
}

export function OmahaPotGame() {
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const gameIdRef = useRef(0);
  const [settings, setSettings] = useState<GameSettings>({ sb: 2, bb: 4, straddle: false, maxBetCap: 10000 });
  const [players, setPlayers] = useState<Player[]>([]);
  const [pot, setPot] = useState(0);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'waiting_input' | 'feedback' | 'finished'>('idle');
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  
  // Game state tracking
  const [currentHighBet, setCurrentHighBet] = useState(0);
  

  const [showSettings, setShowSettings] = useState(false);

  
  
  // Initialize table
  useEffect(() => {
    initializeTable();
  }, [settings]);

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const initializeTable = () => {

    clearAllTimeouts();

    const positions = ['SB', 'BB', 'UTG', 'UTG+1', 'MP', 'MP+1', 'CO', 'BTN'];
    const newPlayers = Array(8).fill(null).map((_, i) => ({
      id: i,
      name: `Joueur ${i + 1}`,
      position: positions[i],
      currentBet: 0,
      hasFolded: false,
      isDealer: i === 7,
      isActive: false,
      lastAction: null
    })) as Player[];

    // Post Blinds immediately for visual feedback
    newPlayers[0].currentBet = settings.sb;
    newPlayers[1].currentBet = settings.bb;

    let initialPot = settings.sb + settings.bb;
    let initialHighBet = settings.bb;

    if (settings.straddle) {
      const straddleAmt = settings.bb * 2;
      newPlayers[2].currentBet = straddleAmt;
      newPlayers[2].lastAction = "Straddle";
      initialPot += straddleAmt;
      initialHighBet = straddleAmt;
    }

    setPlayers(newPlayers);
    setPot(initialPot);
    setCurrentHighBet(initialHighBet);
    setGameState('idle');
    setFeedback(null);
    setDiceResult(null);
    setUserInput('');
  };

  

  const startHand = () => {

    clearAllTimeouts();

    gameIdRef.current += 1; // ✅ NOUVEAU GAME
    const currentGameId = gameIdRef.current;

    const newPlayers: Player[] = players.map(p => ({
      ...p,
      currentBet: 0,
      hasFolded: false,
      isActive: false,
      lastAction: null
    }));
 
    // Post Blinds
    let currentPot = 0;
    
    // SB
    newPlayers[0].currentBet = settings.sb;
    
    // BB
    newPlayers[1].currentBet = settings.bb;

    currentPot = settings.sb + settings.bb;
    let highBet = settings.bb;
    let nextIdx = 2; // UTG

    // Straddle
    if (settings.straddle) {
      const straddleAmount = settings.bb * 2;
      newPlayers[2].currentBet = straddleAmount; // UTG posts straddle
      newPlayers[2].lastAction = "Straddle";
      currentPot += straddleAmount;
      highBet = straddleAmount;
      nextIdx = 3; // UTG+1 starts
    }

    setPlayers(newPlayers);
    setPot(currentPot);
    setCurrentHighBet(highBet);
    setCurrentPlayerIdx(nextIdx % 8);

    setGameState('playing');
    setFeedback(null);
    setDiceResult(null);
    setUserInput('');
    
    
    // Start loop
    const t = setTimeout(() => {
    playTurn(nextIdx % 8, newPlayers, currentPot, highBet, currentGameId);
  }, 500);

  timeoutsRef.current.push(t);
  };

  const playTurn = (
    playerIdx: number, 
    currentPlayers: Player[], 
    currentTotalPot: number, 
    highBet: number,
    gameId:number
  ) => {
    // Check if round should end (everyone matched highBet)
    // If all active players have the same bet amount equal to the high bet, the round is complete.
    const activeParticipants = currentPlayers.filter(p => !p.hasFolded);
    const allBetsEqual = activeParticipants.every(p => p.currentBet === highBet);
    if (gameId !== gameIdRef.current) return;

    if (allBetsEqual && activeParticipants.length > 0) {
      setGameState('finished');
      setPlayers(currentPlayers.map(p => ({ ...p, isActive: false }))); // Clear active highlight
      return;
    }
    
    // Update active player visually
    const updatedPlayers = currentPlayers.map((p, i) => ({
      ...p,
      isActive: i === playerIdx
    }));
    setPlayers(updatedPlayers);
    setCurrentPlayerIdx(playerIdx);

    // Roll Dice
    const roll = Math.floor(Math.random() * 6) + 1;
    setDiceResult(roll);
    const dice = diceResult;
    console.log(dice);

    const t = setTimeout(() => {
      if (gameId !== gameIdRef.current) return;
      handleDiceResult(roll, playerIdx, updatedPlayers, currentTotalPot, highBet);
    }, 1000);
    timeoutsRef.current.push(t);

  };

  const handleDiceResult = (
    roll: number, 
    playerIdx: number, 
    currentPlayers: Player[], 
    currentTotalPot: number, 
    highBet: number
  ) => {
    const player = currentPlayers[playerIdx];
    const currentGameId = gameIdRef.current;


    // 1,4,6: POT (Player wants to raise POT)
    if (roll === 1 || roll === 6 || roll === 4 ) {
      setGameState('waiting_input');
      // Wait for user input
      return;
    } 
    // 2, 3, 5: CALL
    else {
      // Execute Call
      const toCall = highBet - player.currentBet;
      const newPlayers = [...currentPlayers];
      newPlayers[playerIdx].currentBet += toCall;
      newPlayers[playerIdx].lastAction = "Call";
      
      const newPot = currentTotalPot + toCall;
      setPlayers(newPlayers);
      setPot(newPot);
      
      // Next player
      const nextIdx = (playerIdx + 1) % 8;
      setTimeout(() => {
         playTurn(nextIdx, newPlayers, newPot, highBet, currentGameId);
      }, 1500);
    }
  };

  const submitPotCalculation = () => {
    const currentGameId = gameIdRef.current;
    const val = parseInt(userInput);
    if (isNaN(val)) return;

    const player = players[currentPlayerIdx];
    
    // Somme des mises SAUF le joueur qui annonce pot
    const committedByOthers = players.reduce((sum, p, idx) => {
      if (idx === currentPlayerIdx) return sum;
      return sum + p.currentBet;
    }, 0);

    // Validation
    const isValid = validatePotRaise(val, { highBet: currentHighBet, committedByOthers });

    if (isValid) {
      setFeedback({
        correct: true,
        message: "Correct !"
      });
      
      // Apply the POT bet
      const newPlayers = [...players];
      const raiseAmount = val; // Raise TO val
      // The player adds (RaiseTo - CurrentBet) chips
      const added = raiseAmount - player.currentBet;
      newPlayers[currentPlayerIdx].currentBet = raiseAmount;
      newPlayers[currentPlayerIdx].lastAction = "POT";
      
      const newPot = pot + added;
      const newHighBet = raiseAmount;

      setPlayers(newPlayers);
      setPot(newPot);
      setCurrentHighBet(newHighBet);
      
      setTimeout(() => {
        setFeedback(null);
        setUserInput('');
        
        // Check for max bet cap
        if (newHighBet >= settings.maxBetCap) {
          setGameState('finished');
          setPlayers(newPlayers.map(p => ({ ...p, isActive: false })));
          return;
        }

        setGameState('playing');
        const nextIdx = (currentPlayerIdx + 1) % 8;
        playTurn(nextIdx, newPlayers, newPot, newHighBet,currentGameId);
      }, 1500);

    } else {
      setFeedback({
        correct: false,
        message: "Incorrect"
      });
      
      setUserInput('');
      
      setTimeout(() => {
        setFeedback(null);
      }, 1000);
    }
  };

  return (
    <div className="bg-emerald-900/50 rounded-2xl p-4 sm:p-8 shadow-2xl border border-emerald-800">
      
      {/* Header / Config */}
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10 mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Calculs de Pots</h2>
            <p className="text-sm sm:text-base text-emerald-200">
              Calcule les pots d'une table pre-flop.
            </p>
          </div>
          <div className="flex gap-2">
            <button
               onClick={() => {
                initializeTable();
                setTimeout(startHand, 100);
              }}
             
              className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-lg shadow-emerald-900/20"
              title="Nouvelle Main / Relancer"
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

        {showSettings && (
          <div className="mb-4 p-4 bg-white/5 rounded-lg border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="flex flex-col">
              <span className="text-emerald-400 text-xs mb-1">Petite Blinde</span>
              <input 
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={settings.sb}
                onChange={(e) => {
                  const val = e.target.value;
                    if (val === '') {
                    setSettings({ ...settings, sb: '' as any }); // temporaire
                    return;
                  }
                  if (!/^\d+$/.test(val)) return;
                  const num = parseInt(val);
                  const bb = settings.bb

                  if (bb < num) {
                    console.warn("BB doit être >= SB");
                    return;
                  }
                setSettings({ ...settings, sb: num });
                }}
                className="w-full bg-black/40 border border-emerald-700/50 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-emerald-400 text-xs mb-1">Grosse Blinde</span>
              <input 
                type="number" 
                value={settings.bb}
                onChange={(e) => {
                const val = e.target.value;
                  if (val === '') {
                    setSettings({ ...settings, bb: '' as any }); // temporaire
                    return;
                  }
                const num = parseInt(val);
                  if (!isNaN(num)) {
                    setSettings({ ...settings, bb: num });
                  }
              }}
                className="w-full bg-black/40 border border-emerald-700/50 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-emerald-400 text-xs mb-1">Mise Max</span>
              <input 
                type="number" 
                value={settings.maxBetCap}
                onChange={(e) => setSettings({...settings, maxBetCap: parseInt(e.target.value) || 0})}
                className="w-full bg-black/40 border border-emerald-700/50 rounded px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </label>
            <label className="flex items-center gap-2 cursor-pointer h-full pt-4">
              <input 
                type="checkbox" 
                checked={settings.straddle}
                onChange={(e) => setSettings({...settings, straddle: e.target.checked})}
                className="rounded border-emerald-700 bg-black/40 text-emerald-500 focus:ring-emerald-500 w-5 h-5"
              />
              <span className="text-white text-sm">Option</span>
            </label>
          </div>
        )}
      </div>

      {/* Table Area */}
      <div className="relative aspect-3/4 sm:aspect-video w-full bg-emerald-950/40 rounded-3xl border border-white/5 shadow-2xl mb-8 overflow-hidden [--rx:39%] [--ry:36%] sm:[--rx:44%] sm:[--ry:40%]">
        
        {/* Visual Table */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[52%] h-[48%] sm:w-[70%] sm:h-[60%] bg-emerald-800 rounded-full border-8 sm:border-12 border-emerald-950 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
           {gameState === 'idle' && (
              <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                 <div className="text-center">
                    <div className="text-2xl sm:text-4xl font-black text-black/50 tracking-widest">OMAHA</div>
                    <div className="text-xs sm:text-lg font-bold text-black/40 mt-1">POT LIMIT</div>
                 </div>
              </div>
           )}
        </div>

        {/* Players */}
        {players.map((player, idx) => {
          // Calculate position around an ellipse
          const angle = (idx / 8) * 2 * Math.PI + Math.PI / 2;
          
          return (
            <motion.div
              key={player.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-24 sm:w-32 flex flex-col items-center transition-all duration-300 ${
                 player.isActive ? 'scale-110 z-20' : 'scale-100 z-10'
              }`}
              style={{ 
                left: `calc(50% + var(--rx) * ${Math.cos(angle)})`, 
                top: `calc(50% + var(--ry) * ${Math.sin(angle)})` 
              }}
            >
               {player.lastAction && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${
                     player.lastAction === 'POT' ? 'bg-red-600 text-white' : 
                     player.lastAction === 'Call' ? 'bg-blue-600 text-white' : 
                     'bg-gray-600 text-gray-300'
                   }`}
                 >
                   {player.lastAction}
                 </motion.div>
               )}

               {/* Player Avatar/Card */}
               <div className={`relative w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 sm:border-4 shadow-lg mb-2 ${
                 player.isActive 
                   ? 'bg-yellow-500 border-white ring-4 ring-yellow-500/30' 
                   : 'bg-gray-700 border-gray-600'
               }`}>
                 <span className="text-white font-bold text-[10px] sm:text-xs">{player.position}</span>
                 {player.isDealer && (
                   <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full flex items-center justify-center text-[8px] sm:text-[10px] font-bold text-black border border-gray-300 shadow-sm">
                     D
                   </div>
                 )}
               </div>
               
               {/* Chips / Action */}
               {player.currentBet > 0 && (
                 <div className="bg-black/60 text-white px-2 py-1 rounded-full text-xs font-mono mb-1 border border-white/10">
                   {player.currentBet} €
                 </div>
               )}
            </motion.div>
          );
        })}


      </div>

      {/* Control / Feedback Panel */}
      <div className="bg-black/30 rounded-xl p-6 min-h-35 flex items-center justify-center">
        {gameState === 'idle' && (
          <button 
            onClick={startHand}
            className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-900/50 transition-all hover:-translate-y-1"
          >
            <Play className="w-6 h-6" />
            Distribuer / Nouvelle Main
          </button>
        )}

        {gameState === 'finished' && (
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <div className="text-2xl font-bold text-white mb-2">Tour terminé !</div>
            <div className="text-emerald-300 mb-4">
               {currentHighBet >= settings.maxBetCap 
                 ? `Limite de mise atteinte (${settings.maxBetCap})` 
                 : "Toutes les mises sont égalisées."}
            </div>
            <button 
              onClick={initializeTable}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold mx-auto transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Nouvelle Main
            </button>
          </div>
        )}

        {gameState === 'waiting_input' && (
          <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-yellow-400" />
                  Calcul du POT
                </h3>
                {feedback && feedback.correct && (
                   <div className="text-green-400 text-sm font-bold flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                      <CheckCircle className="w-4 h-4" />
                      Correct !
                   </div>
                )}
                {feedback && !feedback.correct && (
                   <div className="text-red-400 text-sm font-bold flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
                      <XCircle className="w-4 h-4" />
                      Incorrect
                   </div>
                )}
              </div>
              
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="number"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Montant total de la relance ?"
                className={`flex-1 bg-white/10 border-2 rounded-xl px-4 py-3 text-white text-xl font-mono focus:outline-none transition-colors ${
                  feedback?.correct ? 'border-green-500/50 bg-green-500/10' :
                  feedback?.correct === false ? 'border-red-500/50 bg-red-500/10' :
                  'border-white/20 focus:border-yellow-400'
                }`}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && submitPotCalculation()}
                disabled={!!feedback}
              />
              <button 
                onClick={submitPotCalculation}
                disabled={!!feedback}
                className="w-full sm:w-auto px-6 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-colors shadow-lg active:scale-95 transform"
              >
                Valider
              </button>
            </div>  
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Logique de calcul pour le Pot-Limit Omaha (PLO).
*/

/**
 * Calcule la relance maximale autorisée ("POT").
 * Formule: (3 * HighBet) + (committedByOthers - HighBet)
*/
function calculateMaxRaise(highBet: number, committedByOthers: number): number {
  const othersExcludingHighBet = committedByOthers - highBet;
  return (highBet * 3) + othersExcludingHighBet;
}

function validatePotRaise(
  playerInput: number,
  params: { highBet: number; committedByOthers: number }
): boolean {
  const expected = calculateMaxRaise(params.highBet, params.committedByOthers);
  return playerInput === expected;
}
