import { useState, useRef, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Trophy, RotateCcw, ChevronRight } from 'lucide-react';
import { BETS, BET_KEYS, type BetKey } from './constants';

const TABLES = [...BET_KEYS].sort((a, b) => BETS[a].payout - BETS[b].payout);
type TableValue = BetKey;


const TABLE_COLORS: Record<BetKey, string> = {
  sixain:       'from-teal-600 to-teal-700',
  carre:        'from-blue-600 to-blue-700',
  transversale: 'from-violet-600 to-purple-700',
  cheval:       'from-amber-600 to-orange-600',
  plein:        'from-rose-600 to-red-700',
};


const TABLE_ACCENT: Record<BetKey, string> = {
  sixain:       `${BETS.sixain.color}       border-teal-500/40   bg-teal-600/15`,
  carre:        `${BETS.carre.color}        border-blue-500/40   bg-blue-600/15`,
  transversale: `${BETS.transversale.color} border-violet-500/40 bg-violet-600/15`,
  cheval:       `${BETS.cheval.color}       border-amber-500/40  bg-amber-600/15`,
  plein:        `${BETS.plein.color}        border-rose-500/40   bg-rose-600/15`,
};

interface Question {
  multiplier: number;
  table: TableValue;
  answer: number;
}

function buildQueue(tables: TableValue[]): Question[] {
  const all: Question[] = [];
  for (const t of tables) {
    for (let m = 1; m <= 20; m++) {
      all.push({ multiplier: m, table: t, answer: BETS[t].payout * m });
    }
  }
  return shuffle(all);
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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
          {pct === 100 ? 'Parfait ! Table maîtrisée.' :
           pct >= 80  ? 'Très bien ! Encore un peu de pratique.' :
           pct >= 50  ? 'Pas mal, continuez.' :
                        'Révisez et recommencez !'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button onClick={onRestart} className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors">
            <RotateCcw className="w-4 h-4" /> Recommencer
          </button>
          <button onClick={onBack} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors">
            ← Choisir les tables
          </button>
        </div>
      </div>

      {wrong.length > 0 && (
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-red-500/20">
          <h3 className="text-white font-bold mb-3 text-sm sm:text-base">Erreurs à retravailler</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {wrong.map((w, i) => (
              <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2 text-sm">
                <span className="text-white/80 font-mono">
                  {w.q.table} × {w.q.multiplier}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-red-400 line-through text-xs">{w.given}</span>
                  <span className="text-green-400 font-bold">{w.q.answer}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}interface QuizProps {
  tables: TableValue[];
  onBack: () => void;
}
function Quiz({ tables, onBack }: QuizProps) {
  const [queue, setQueue]     = useState<Question[]>(() => buildQueue(tables));
  const [idx, setIdx]         = useState(0);
  const [input, setInput]     = useState('');
  const [status, setStatus]   = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [score, setScore]     = useState(0);
  const [streak, setStreak]   = useState(0);
  const [wrong, setWrong]     = useState<{ q: Question; given: number }[]>([]);
  const [finished, setFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = queue[idx];

  useEffect(() => {
    if (status === 'idle') inputRef.current?.focus();
  }, [idx, status]);

  const advance = useCallback(() => {
    if (idx + 1 >= queue.length) {
      setFinished(true);
    } else {
      setIdx(i => i + 1);
      setInput('');
      setStatus('idle');
    }
  }, [idx, queue.length]);

  const validate = useCallback(() => {
    if (status !== 'idle' || !input.trim()) return;
    const val = parseInt(input.trim(), 10);
    if (val === q.answer) {
      setStatus('correct');
      setScore(s => s + 1);
      setStreak(s => s + 1);
      setTimeout(() => advance(), 600);
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

  const restart = () => {
    setQueue(buildQueue(tables));
    setIdx(0);
    setInput('');
    setStatus('idle');
    setScore(0);
    setStreak(0);
    setWrong([]);
    setFinished(false);
  };

  if (finished) {
    return <Results score={score} total={queue.length} wrong={wrong} onRestart={restart} onBack={onBack} />;
  }

  const accent = TABLE_ACCENT[q.table];
  const progress = ((idx) / queue.length) * 100;

  return (
    <div className="space-y-4">
      {/* Progress bar + stats */}
      <button onClick={onBack} className="text-emerald-300 hover:text-emerald-200 text-sm sm:text-base">
        ← Retour aux paramètres
      </button>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-amber-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-xs text-white/50 tabular-nums whitespace-nowrap">{idx + 1}/{queue.length}</span>
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

        <div className="p-6 sm:p-10 text-center space-y-6">
          {/* Equation */}
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <span className={`text-4xl sm:text-7xl font-bold tabular-nums ${accent.split(' ')[0]}`}>{BETS[q.table].payout}</span>
            <span className="text-3xl sm:text-5xl text-white/40 font-light">×</span>
            <span className="text-5xl sm:text-7xl font-bold text-white tabular-nums">{q.multiplier}</span>
            <span className="text-3xl sm:text-5xl text-white/40 font-light">=</span>
            {status === 'idle' ? (
              <span className="text-5xl sm:text-7xl font-bold text-white/20">?</span>
            ) : (
              <span className={`text-5xl sm:text-7xl font-bold tabular-nums ${status === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                {q.answer}
              </span>
            )}
          </div>

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
            <div className="space-y-2">
              <div className={`flex items-center justify-center gap-2 font-bold text-base sm:text-lg ${status === 'correct' ? 'text-green-400' : 'text-red-400'}`}>
                {status === 'correct'
                  ? <><CheckCircle className="w-5 h-5" /> Exact !</>
                  : <><XCircle className="w-5 h-5" /> {BETS[q.table].payout} × {q.multiplier} = {q.answer}</>
                }
              </div>
              {status === 'wrong' && (
                <>
                  <p className="text-white/50 text-sm">Votre réponse : <span className="text-red-300">{input}</span></p>
                  <button
                    onClick={advance}
                    className="mt-2 flex items-center gap-1 mx-auto px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors text-sm font-medium"
                  >
                    {idx + 1 < queue.length ? 'Suivant' : 'Voir le résultat'} <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Table Selector Screen ----
export function MultiplicationTables({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<Set<TableValue>>(new Set());
  const [started, setStarted]   = useState(false);

  const toggle = (t: TableValue) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  };

  const selectedTables = TABLES.filter(t => selected.has(t));
  const totalQuestions = selectedTables.length * 20;

  if (started && selectedTables.length > 0) {
    return <Quiz tables={selectedTables} onBack={() => setStarted(false)} />;
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <button onClick={onBack} className="text-emerald-300 hover:text-emerald-200 text-sm sm:text-base">
        ← Retour aux exercices Roulette
      </button>
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-5 sm:p-8 border border-white/10 text-center">
        <div className="text-5xl mb-3">✕</div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Tables de Multiplication</h2>
        <p className="text-emerald-200 text-sm sm:text-base max-w-md mx-auto">
          Entraînez-vous sur les tables indispensables de la roulette.
          Choisissez une ou plusieurs tables à travailler.
        </p>
      </div>

      {/* Table picker */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {TABLES.map(t => {
          const active = selected.has(t);
          return (
            <button
              key={t}
              onClick={() => toggle(t)}
              className={`rounded-xl p-4 sm:p-5 border-2 transition-all active:scale-95 text-center ${
                active
                  ? `bg-linear-to-br ${TABLE_COLORS[t]} border-transparent shadow-lg scale-105`
                  : 'bg-white/5 border-white/10 hover:border-white/25'
              }`}
            >
              <div className={`text-3xl sm:text-4xl font-bold mb-1 ${active ? 'text-white' : 'text-white/70'}`}>{BETS[t].payout}</div>
              <div className={`text-xs ${active ? 'text-white/80' : 'text-white/40'}`}>{BETS[t].label}</div>
            </button>
          );
        })}
      </div>

      {/* Quick-select shortcuts */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-white/40 self-center">Sélection rapide :</span>
        <button
          onClick={() => setSelected(new Set(TABLES))}
          className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          Toutes les tables
        </button>
        <button
          onClick={() => setSelected(new Set())}
          className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          Tout désélectionner
        </button>
        {([['sixain', 'carre', 'transversale'], ['cheval', 'plein']] as BetKey[][]).map((group, i) => (
          <button
            key={i}
            onClick={() => setSelected(new Set(group))}
            className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            {group.map(k => BETS[k].payout).join(', ')}
          </button>
        ))}
      </div>

      {/* Start button */}
      <div className="bg-black/20 rounded-xl p-4 sm:p-6 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          {selectedTables.length === 0 ? (
            <p className="text-white/50 text-sm">Sélectionnez au moins une table pour commencer.</p>
          ) : (
            <>
              <p className="text-white font-medium text-sm sm:text-base">
                {selectedTables.length} table{selectedTables.length > 1 ? 's' : ''} sélectionnée{selectedTables.length > 1 ? 's' : ''} : <span className="text-amber-400">{selectedTables.map(k => BETS[k].payout).join(', ')}</span>
              </p>
              <p className="text-emerald-200/60 text-xs mt-0.5">{totalQuestions} questions</p>
            </>
          )}
        </div>
        <button
          onClick={() => setStarted(true)}
          disabled={selectedTables.length === 0}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-colors text-base"
        >
          Commencer <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Reference tables preview */}
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
        <h3 className="text-sm sm:text-base font-bold text-white mb-3">Aperçu des tables (×1 à ×10)</h3>
        <div className="overflow-x-auto">
          <table className="text-xs text-emerald-200 w-full min-w-85">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-1.5 text-white/40 w-6">×</th>
                {TABLES.map(t => (
                  <th key={t} className={`text-center py-1.5 font-bold ${TABLE_ACCENT[t].split(' ')[0]}`}>{BETS[t].payout}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(m => (
                <tr key={m} className="border-b border-white/5">
                  <td className="py-1 text-white/30 font-bold">{m}</td>
                  {TABLES.map(t => (
                    <td key={t} className="text-center py-1 font-mono text-white/60">{BETS[t].payout * m}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}