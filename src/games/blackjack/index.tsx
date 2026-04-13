import { useState } from 'react';
import { BlackjackSelector } from './BlackjackSelector';
import { CountingCards } from './CountingCards';
import { BlackjackCalculation } from './BlackjackCalculation';
import { DealerCounting } from './DealerCounting';
import { BlackjackBankDraw } from './BlackjackBankDraw';

export function BlackjackTraining() {
  const [selectedDrill, setSelectedDrill] = useState<string | null>(null);
   if (!selectedDrill) {
    return <BlackjackSelector onSelectDrill={setSelectedDrill} />;
  }

  return (
    <div>
      <button
        onClick={() => setSelectedDrill(null)}
        className="text-emerald-300 hover:text-emerald-200 mb-4 text-sm sm:text-base"
      >
        ← Retour aux exercices Blackjack
      </button>
            {selectedDrill === 'card-values' && <CountingCards />}
            {selectedDrill === 'blackjack-calcul' && <BlackjackCalculation />}
            {selectedDrill === 'fast-draw' && <DealerCounting />}
            {selectedDrill == 'bank-draw' && <BlackjackBankDraw />}
    </div>
  ); 
}