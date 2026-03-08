import { useState } from 'react';
import { UltimateSelector } from './UltimateSelector';
import { TexasHoldemWinnerGame } from './TexasBoardWinner';
import { TexasHoldemPayoutQuiz } from './TexasUltimatePayout';

export function UltimateTraining() {
    const [selectedDrill, setSelectedDrill] = useState<string | null>(null);

    const handleSelectDrill = (drillId: string) => {
        setSelectedDrill(drillId);
    };
    if (!selectedDrill) {
        return <UltimateSelector onSelectDrill={handleSelectDrill} />;
    }
    return (
        <div>
            <button
                onClick={() => setSelectedDrill(null)}
                className="text-emerald-300 hover:text-emerald-200 mb-4 text-sm sm:text-base"
            >
                ← Retour aux exercices poker
            </button>
            {selectedDrill == 'winner-game' && <TexasHoldemWinnerGame />}
            {selectedDrill == 'ultimate-payout' && <TexasHoldemPayoutQuiz />}
        </div>
    );
}