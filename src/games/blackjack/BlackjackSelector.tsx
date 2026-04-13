import { Target, Zap, Users, Calculator} from 'lucide-react';

export interface BlackjackDrill {
  id: string;
  title: string;
  description: string;
  icon: any;
}

interface BlackjackSelectorProps {
  onSelectDrill: (drillId: string) => void;
}

export function BlackjackSelector({ onSelectDrill }: BlackjackSelectorProps) {
  const drills: BlackjackDrill[] = [
    {
      id: 'card-values',
      title: 'Calculs Cartes',
      description: 'Mémorise et calcule la valeur totale de deux cartes',
      icon: Target,
    },
    {
      id: 'blackjack-calcul',
      title: 'Calcul Blackjack',
      description: 'Pratique le calcul des blackjacks et ameliore ta rapidité',
      icon: Calculator,
    },
    {
      id: 'fast-draw',
      title: 'Tirage Rapide',
      description: 'Memorise les cartes rapidement et trouve le resultat final',
      icon: Zap,
    },
    {
      id: 'bank-draw',
      title: 'Tirage Banque',
      description: 'Tire les cartes comme a la banque le plus rapidement possible',
      icon: Users,
    },
  ];

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Entraînement Blackjack</h2>
                <p className="text-sm sm:text-base text-emerald-200">
                    Choisissez un exercice pour développer vos compétences de distribution au Blackjack.
                </p>
            </div>
        
            <div className='grid sm:grid-cols-2 gap-3 sm:gap-4'>
                {drills.map((drill) => {
                    const Icon = drill.icon;
                    return (
                        <button
                            key={drill.id}
                            onClick={() => onSelectDrill(drill.id)}
                            className="bg-black/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10 hover:border-white/20 active:bg-white/5 transition-all text-left">
                                <div className='flex items-center justify-between mb-2 sm:mb-3 gap-2'>
                                  <div className='flex items-center gap-3'>
                                    <div className='p-2 sm:p-3 rounded-lg bg-red-600/20 shrink-0 flex items-center justify-center'>
                                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
                                    </div>
                                    <div>
                                      <h3 className="text-sm sm:text-lg font-bold text-white">{drill.title}</h3>
                                    </div>
                                  </div>
                                  <p className="text-emerald-200 text-sm sm:text-base px-2">{drill.description}</p>
                                </div>
                                <div className="text-emerald-200 text-xs sm:text-sm  ">
                                    Commencer l'exercice →
                                </div>
                            </button>
                    )
                })}
            </div>
        </div>
    );

}