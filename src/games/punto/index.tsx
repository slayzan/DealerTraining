import { useState } from 'react';
import { PuntoSelector } from './PuntoSelector';

export function PuntoTraining() {
    const [selectedDrill, setSelectedDrill] = useState<string | null>(null);

    const handleSelectDrill = (drillId: string) => {
        setSelectedDrill(drillId);
    };

    if (!selectedDrill) {
        return <PuntoSelector onSelectDrill={handleSelectDrill} />;
    }
        return (
            <div>
                <button
                    onClick={() => setSelectedDrill(null)}
                    className="text-emerald-300 hover:text-emerald-200 mb-4 text-sm sm:text-base"
                >
                    ← Retour aux exercices Punto Bunco
                </button>
            </div>
        );
}