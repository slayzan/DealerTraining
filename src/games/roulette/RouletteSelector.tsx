import { Hash, Calculator } from 'lucide-react';

interface RouletteSelectorProps {
  onSelectDrill: (drillId: string) => void;
}

const drills = [
   {
    id: 'multiplication-tables',
    title: 'Tables de Multiplication',
    description: 'Maîtrisez les tables de 5, 8, 11, 17 et 35',
    icon: Hash,
  },
  {
    id:'multiple-payements',
    title:'Paiements Combinés',
    description:'Calculez le total de plusieurs mises simultanées',
    icon: Calculator,
  }
]

export function RouletteSelector({ onSelectDrill }: RouletteSelectorProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Entraînement Roulette Anglaise</h2>
        <p className="text-sm sm:text-base text-emerald-200">
          Maîtrisez les mises, les paiements et la gestion d'une table de roulette.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        {drills.map(drill => {
          const Icon = drill.icon;
          return (
            <button
              key={drill.id}
              onClick={() => onSelectDrill(drill.id)}
              className="bg-black/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10 hover:border-white/20 active:bg-white/5 transition-all text-left"
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                <div className="flex items-start gap-3">
                  <div className="p-2 sm:p-3 rounded-lg bg-orange-600/20 shrink-0">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">{drill.title}</h3>
                </div>
              </div>
              <p className="text-emerald-200 text-xs sm:text-sm mb-3 sm:mb-4">{drill.description}</p>
              <div className="text-emerald-400 text-xs sm:text-sm font-medium">Commencer l'exercice →</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
