import { useState, useEffect } from 'react';
import { Calculator, Clock, Trophy, RotateCcw, CheckCircle, XCircle, Settings } from 'lucide-react';

export function EqualityCalculation() {
  const [targetNumber, setTargetNumber] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  // Settings state
  const [minBet, setMinBet] = useState(20);
  const [maxBet, setMaxBet] = useState(480);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    generateNewChallenge();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const generateNewChallenge = () => {
    // Generate number between minBet and maxBet, multiple of 20
    const validMin = Math.max(20, Math.ceil(minBet / 20) * 20);
    const validMax = Math.max(validMin, Math.floor(maxBet / 20) * 20);
    
    // (validMax - validMin) / 20 gives number of steps
    const steps = (validMax - validMin) / 20;
    const randomStep = Math.floor(Math.random() * (steps + 1));
    const num = validMin + (randomStep * 20);
    
    setTargetNumber(num);
    setUserAnswer('');
    setFeedback(null);
    setShowAnswer(false);
    setIsRunning(true);
    setTimer(0);
  };

  const checkAnswer = () => {
    const val = parseInt(userAnswer);
    const correct = targetNumber * 8;
    
    const isCorrect = val === correct;
    setFeedback(isCorrect ? 'correct' : 'incorrect');
    setScore(s => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1
    }));
    setIsRunning(false);

    if (!isCorrect) {
      setShowAnswer(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && userAnswer) {
      checkAnswer();
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setMinBet(val);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    setMaxBet(val);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Calcul Égalité (Punto Banco)</h2>
            <p className="text-sm sm:text-base text-emerald-200">
              Calculez le paiement pour l'Égalité.
            </p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white hover:bg-white/10'}`}
            title="Paramètres"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {showSettings && (
          <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-emerald-200 text-sm mb-2 font-medium">
                Mise Minimum (Multiple de 20)
              </label>
              <input 
                type="number" 
                step="20" 
                min="20"
                value={minBet}
                onChange={handleMinChange}
                className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-emerald-200 text-sm mb-2 font-medium">
                Mise Maximum (Multiple de 20)
              </label>
              <input 
                type="number" 
                step="20"
                min={minBet} 
                value={maxBet}
                onChange={handleMaxChange}
                className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-white/50 italic">
                Les nouvelles limites seront appliquées au prochain calcul.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-4 sm:gap-6 text-sm sm:text-base">
            <div className="flex items-center gap-2 text-white">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <span className="font-mono">{formatTime(timer)}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              <span>{score.correct} / {score.total} ({score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%)</span>
            </div>
          </div>
          <button
            onClick={generateNewChallenge}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm sm:text-base rounded-lg transition-colors border border-white/20"
          >
            <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
            Nouveau calcul
          </button>
        </div>
      </div>

      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 sm:p-12 border border-white/10">
        <div className="text-center mb-8 sm:mb-12">
          <div className="text-emerald-300 text-sm sm:text-base mb-3">Mise sur Égalité :</div>
          <div className="text-5xl sm:text-7xl font-bold text-white mb-4">{targetNumber}</div>
          <div className="text-emerald-400 text-base sm:text-lg">euros</div>
        </div>

        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <label className="block text-white font-medium mb-3 text-sm sm:text-base">
              Paiement ?
            </label>
            <div className="relative">
              <Calculator className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
              <input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-lg text-white text-xl sm:text-2xl font-mono placeholder-white/30 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                placeholder="Entrez votre réponse..."
                disabled={feedback !== null}
                autoFocus
              />
            </div>
          </div>

          {feedback === null ? (
             <button
              onClick={checkAnswer}
              disabled={!userAnswer}
              className="w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-bold text-lg transition-colors"
            >
              Vérifier
            </button>
          ) : (
            <div className={`p-4 sm:p-6 rounded-lg ${
              feedback === 'correct' 
                ? 'bg-emerald-600/20 border border-emerald-500/30' 
                : 'bg-red-600/20 border border-red-500/30'
            }`}>
              <div className="flex items-center justify-center gap-3 mb-4">
                {feedback === 'correct' ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                    <div className="text-emerald-200 font-bold text-xl">
                      Excellent ! Temps : {formatTime(timer)}
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="w-8 h-8 text-red-400" />
                    <div className="text-red-200 font-bold text-xl">Incorrect</div>
                  </>
                )}
              </div>
              
              {showAnswer && (
                <div className="mb-4 p-4 bg-black/30 rounded text-center">
                  <div className="text-white/70 text-sm mb-2">Réponse correcte :</div>
                  <div className="text-white font-mono text-2xl">
                    {targetNumber} × 8 = {targetNumber * 8}
                  </div>
                </div>
              )}

              <button
                onClick={generateNewChallenge}
                className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg font-medium transition-colors"
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
