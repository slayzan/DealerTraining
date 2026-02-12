import { useState } from 'react';
import { OmahaSelector } from './OmahaSelector';
import { OmahaPotGame } from './OmahaPot';

export function OmahaTraining() {
    const [selectedDrill, setSelectedDrill] = useState<string | null>(null);

    const handleSelectDrill = (drillId: string) => {
        setSelectedDrill(drillId);
    };

    if (!selectedDrill) {
        return <OmahaSelector onSelectDrill={handleSelectDrill} />;
    }
        return (
            <div>
                <button
                    onClick={() => setSelectedDrill(null)}
                    className="text-emerald-300 hover:text-emerald-200 mb-4 text-sm sm:text-base"
                >
                    ← Retour aux exercices Omaha
                </button>
                {selectedDrill === 'Pot-Calcul' && <OmahaPotGame />}
            </div>
        );
}