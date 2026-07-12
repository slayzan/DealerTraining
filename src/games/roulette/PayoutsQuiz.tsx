import { useState, useRef, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Trophy, RotateCcw, ChevronRight, Plus } from 'lucide-react';
import { BETS, BET_KEYS, type BetKey } from './constants';

interface BetLine {
  key: BetKey;
  chips: number;
}

interface Question {
  lines: BetLine[];
  answer: number;
}

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY = {
  easy:   { label: 'Facile',    desc: '2 types de mises',        betCount: [2, 2], keys: ['plein', 'cheval', 'transversale', 'carre', 'sixain'] as BetKey[], maxChips: 20  },
  medium: { label: 'Moyen',     desc: '3 types de mises',   betCount: [3, 3], keys: BET_KEYS, maxChips: 20 },
  hard:   { label: 'Difficile', desc: '3 à 5 types de mises',   betCount: [3, 5], keys: BET_KEYS, maxChips: 20 },
};

// ---- Question generator ----

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion(difficulty: Difficulty): Question {
  const cfg = DIFFICULTY[difficulty];
  const count = randInt(cfg.betCount[0], cfg.betCount[1]);
  const shuffled = [...cfg.keys].sort(() => Math.random() - 0.5).slice(0, count);

  const lines: BetLine[] = shuffled.map(key => ({
    key,
    chips: randInt(1, cfg.maxChips),
  }));

  const answer = lines.reduce((sum, l) => sum + l.chips * BETS[l.key].payout, 0);
  return { lines, answer };
}

// ---- Results screen ----

interface ResultsProps {
  score: number;
  total: number;
  wrong: { q: Question; given: number }[];
  onRestart: () => void;
  onBack: () => void;
}

function Results({ score, total, wrong, onRestart, onBack }: ResultsProps) {
  const pct = Math.round((score / total) * 100);
  return (
    <div className="space-y-5">
      <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 sm:p-10 border border-white/10 text-center space-y-4">
        <Trophy className="w-14 h-14 text-amber-400 mx-auto" />
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">Session terminée !</h2>
          <p className="text-emerald-200">{score} bonne{score > 1 ? 's' : ''} réponse{score > 1 ? 's' : ''} sur {total}</p>
        </div>
        <div className="inline-block bg-white/10 rounded-full px-10 py-4">
          <span className={`text-4xl font-bold ${pct === 100 ? 'text-green-400' : pct >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
            {pct}%
          </span>
        </div>
        <p className="text-emerald-200 text-sm">
          {pct === 100 ? 'Parfait ! Calculs maîtrisés.' :
           pct >= 80  ? 'Très bien ! Continuez à vous entraîner.' :
           pct >= 50  ? 'Pas mal, encore un peu de pratique.' :
                        'Révisez les tables et recommencez !'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button onClick={onRestart} className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors">
            <RotateCcw className="w-4 h-4" /> Recommencer
          </button>
          <button onClick={onBack} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors">
            ← Choisir le niveau
          </button>
        </div>
      </div>

      {wrong.length > 0 && (
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-red-500/20">
          <h3 className="text-white font-bold mb-4 text-sm sm:text-base">Erreurs à retravailler</h3>
          <div className="space-y-3">
            {wrong.map((w, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-3 sm:p-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  {w.q.lines.map((l, j) => (
                    <span key={j} className={`text-xs px-2 py-1 rounded border font-medium ${BETS[l.key].bg} ${BETS[l.key].color}`}>
                      {l.chips} × {BETS[l.key].label} ({BETS[l.key].payout}:1)
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-white/50">Votre réponse :</span>
                  <span className="text-red-400 line-through font-bold">{w.given}</span>
                  <span className="text-white/50">→ Correct :</span>
                  <span className="text-green-400 font-bold">{w.q.answer}</span>
                </div>
                <div className="mt-1.5 text-xs text-white/30 font-mono">
                  {w.q.lines.map(l => `${l.chips}×${BETS[l.key].payout}`).join(' + ')} = {w.q.answer}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Active quiz ----

interface QuizProps {
  difficulty: Difficulty;
  onBack: () => void;
}

const QUESTIONS_PER_SESSION = 10;

function Quiz({ difficulty, onBack }: QuizProps) {
  const [questions]             = useState<Question[]>(() =>
    Array.from({ length: QUESTIONS_PER_SESSION }, () => generateQuestion(difficulty))
  );
  const [idx, setIdx]           = useState(0);
  const [input, setInput]       = useState('');
  const [status, setStatus]     = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [score, setScore]       = useState(0);
  const [streak, setStreak]     = useState(0);
  const [wrong, setWrong]       = useState<{ q: Question; given: number }[]>([]);
  const [finished, setFinished] = useState(false);
  const inputRef                = useRef<HTMLInputElement>(null);

  const q = questions[idx];

  useEffect(() => {
    if (status === 'idle') inputRef.current?.focus();
  }, [idx, status]);

  const advance = useCallback(() => {
    if (idx + 1 >= questions.length) {
      setFinished(true);
    } else {
      setIdx(i => i + 1);
      setInput('');
      setStatus('idle');
    }
  }, [idx, questions.length]);

  const validate = useCallback(() => {
    if (status !== 'idle' || !input.trim()) return;
    const val = parseInt(input.trim(), 10);
    if (val === q.answer) {
      setStatus('correct');
      setScore(s => s + 1);
      setStreak(s => s + 1);
      setTimeout(() => advance(), 700);
    } else {
      setStatus('wrong');
      setStreak(0);
      setWrong(w => [...w, { q, given: val }]);
    }
  }, [status, input, q, advance]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (status === 'idle') validate();
      else if (status === 'wrong') advance();
    }
  };

  const restart = () => window.location.reload();

  if (finished) {
    return <Results score={score} total={questions.length} wrong={wrong} onRestart={restart} onBack={onBack} />;
  }

  const progress = (idx / questions.length) * 100;

  return (
    <div className="space-y-4">
        <button onClick={onBack} className="text-emerald-300 hover:text-emerald-200 text-sm sm:text-base">
        ← Retour aux paramètres
      </button>
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs text-white/50 tabular-nums whitespace-nowrap">{idx + 1}/{questions.length}</span>
      </div>
      <div className="flex items-center justify-between text-sm px-1">
        <span className="text-emerald-200">Score : <span className="text-green-400 font-bold">{score}</span>/{idx}</span>
        {streak >= 3 && <span className="text-amber-400 font-bold animate-pulse">🔥 ×{streak}</span>}
      </div>

      {/* Question card */}
      <div className={`bg-black/40 backdrop-blur-sm rounded-2xl border transition-colors duration-200 overflow-hidden ${
        status === 'correct' ? 'border-green-500/50' :
        status === 'wrong'   ? 'border-red-500/50'   : 'border-white/10'
      }`}>
        <div className="px-4 py-2.5 border-b border-white/5 bg-white/3 flex items-center justify-between">
          <span className="text-xs text-white/30">{DIFFICULTY[difficulty].label}</span>
        </div>

        <div className="p-3 sm:p-8 space-y-4 sm:space-y-6">
          {/* Bets display */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-center">
            {q.lines.map((line, i) => (
              <div key={i} className="flex items-center gap-1 sm:gap-2">
                {i > 0 && <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-white/30 shrink-0" />}
                <div className={`flex flex-col items-center rounded-xl border px-3 py-2 sm:px-4 sm:py-3 ${BETS[line.key].bg}`}>
                  <span className={`text-xl sm:text-3xl font-bold tabular-nums ${BETS[line.key].color}`}>
                    {line.chips}
                  </span>
                  <span className="text-white text-xs sm:text-sm font-semibold mt-0.5">{BETS[line.key].label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Breakdown hint (shown only on wrong) */}
          {status === 'wrong' && (
            <div className="bg-white/5 rounded-xl p-3 text-center space-y-1">
              <p className="text-white/50 text-xs uppercase tracking-wider mb-2">Détail du calcul</p>
              <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-x-3 gap-y-0.5 font-mono text-xs sm:text-sm">
                {q.lines.map((l, i) => (
                  <span key={i} className={BETS[l.key].color}>
                    {l.chips} × {BETS[l.key].payout} = <strong>{l.chips * BETS[l.key].payout}</strong>
                  </span>
                ))}
              </div>
              <p className="text-white font-bold text-base sm:text-lg mt-1">= {q.answer}</p>
            </div>
          )}

          {/* Question */}
          <div className="text-center">
            <p className="text-white/60 text-sm mb-4">
              Quel est le montant total du paiement ?
            </p>

            {/* Input / feedback */}
          {status === 'idle' ? (
            <div className="flex gap-2 sm:gap-3 max-w-70 sm:max-w-xs mx-auto">
              <input
                ref={inputRef}
                type="number"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Réponse…"
                className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3 text-white text-center text-base sm:text-xl font-bold placeholder:text-white/25 focus:outline-none focus:border-amber-400 transition-colors"
                min={0}
              />
              <button
                onClick={validate}
                disabled={!input.trim()}
                className="shrink-0 px-4 py-2 sm:px-5 sm:py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-sm sm:text-base font-bold rounded-lg sm:rounded-xl transition-colors"
              >
                OK
              </button>
            </div>
            ) : (
              <div className="space-y-3">
                <div className={`flex items-center justify-center gap-2 font-bold text-base sm:text-lg ${status === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                  {status === 'correct'
                    ? <><CheckCircle className="w-5 h-5" /> Exact — {q.answer} jetons</>
                    : <><XCircle className="w-5 h-5" /> La réponse était {q.answer}</>
                  }
                </div>
                {status === 'wrong' && (
                  <>
                    <p className="text-white/50 text-sm">Votre réponse : <span className="text-red-300 font-bold">{input}</span></p>
                    <button
                      onClick={advance}
                      className="flex items-center gap-1 mx-auto px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm font-medium"
                    >
                      {idx + 1 < questions.length ? 'Suivant' : 'Voir le résultat'} <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Difficulty selector screen ----

export function PayoutQuiz({ onBack }: { onBack: () => void }) {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  if (difficulty) {
    return <Quiz difficulty={difficulty} onBack={() => setDifficulty(null)} />;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
        <button onClick={onBack} className="text-emerald-300 hover:text-emerald-200 text-sm sm:text-base">
        ← Retour aux exercices Roulette
      </button>
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-5 sm:p-8 border border-white/10 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Paiements combinés</h2>
        <p className="text-emerald-200 text-sm sm:text-base max-w-md mx-auto">
            Calculez le montant de plusieurs mises simultanées.
        </p>
      </div>

      {/* Example */}
      <div className="bg-black/20 rounded-xl border border-white/10 p-4 sm:p-6">
        <p className="text-white/50 text-xs uppercase tracking-widest mb-3">Exemple</p>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
          {([['plein', 2], ['cheval', 1], ['carre', 3]] as [BetKey, number][]).map(([k, n], i) => (
            <div key={k} className="flex items-center gap-1 sm:gap-2">
              {i > 0 && <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-white/25" />}
              <div className={`rounded-xl border px-3 py-2 sm:px-4 sm:py-2.5 text-center ${BETS[k].bg}`}>
                <div className={`text-lg sm:text-xl font-bold ${BETS[k].color}`}>{n}</div>
                <div className="text-white text-xs font-semibold">{BETS[k].label}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-emerald-200 text-xs sm:text-sm font-mono">
          2×35 + 1×17 + 3×8 = 70+17+24 = <span className="text-white font-bold">111 jetons</span>
        </p>
      </div>

      {/* Difficulty buttons */}
      <div className="grid sm:grid-cols-3 gap-3 sm:gap-4">
        {(Object.entries(DIFFICULTY) as [Difficulty, typeof DIFFICULTY[Difficulty]][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setDifficulty(key)}
            className={`rounded-xl p-5 sm:p-6 text-left border border-white/10 transition-all active:scale-95 hover:scale-105 ${
              key === 'easy'   ? 'bg-linear-to-br from-green-700 to-green-800' :
              key === 'medium' ? 'bg-linear-to-br from-yellow-700 to-amber-700' :
                                 'bg-linear-to-br from-red-700 to-rose-800'
            }`}
          >
            <h3 className="text-lg font-bold text-white mb-1">{cfg.label}</h3>
            <p className="text-white/70 text-sm">{cfg.desc}</p>
            <p className="text-white/40 text-xs mt-3">{QUESTIONS_PER_SESSION} questions</p>
          </button>
        ))}
      </div>
    </div>
  );
}