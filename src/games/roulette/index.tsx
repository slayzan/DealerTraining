import { useState } from 'react';
import { RouletteSelector } from './RouletteSelector';
import{ MultiplicationTables } from './Multiplication'
import { PayoutQuiz } from './PayoutsQuiz';

export function RouletteTraining() {
  const [selectedDrill, setSelectedDrill] = useState<string | null>(null);

  if (!selectedDrill) {
    return <RouletteSelector onSelectDrill={setSelectedDrill} />;
  }

    const goBack = () => setSelectedDrill(null);

  return (
    <div>
      {selectedDrill === 'payout-quiz' && (
        <>
        <button
          className="text-emerald-300 hover:text-emerald-200 mb-4 text-sm sm:text-base"
        >
          ← Retour aux exercices Roulette
        </button>
        </>
      )}
            {selectedDrill === 'multiplication-tables' && <MultiplicationTables onBack={goBack}/>}
            {selectedDrill === 'multiple-payements' && <PayoutQuiz onBack={goBack}/>}
    </div>
  );
}