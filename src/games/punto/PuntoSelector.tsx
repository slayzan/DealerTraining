
import {Clock,  Zap, Target, Brain } from 'lucide-react';

export interface PuntoDrill {
  id: string;
  title: string;
  description: string;
  icon: any;
}

interface PuntoSelectorProps {
  onSelectDrill: (drillId: string) => void;
}

export function PuntoSelector({ onSelectDrill }: PuntoSelectorProps) {
  const drills: PuntoDrill[] = [
    {
      id: 'basic-throw',
      title: 'Lancer Basique',
      description: 'Apprenez les techniques de base pour lancer le frisbee avec précision',
      icon: Target,
    },
    {
      id: 'power-throw',
      title: 'Lancer Puissant',
      description: 'Développez votre force et votre technique pour des lancers plus longs',
      icon: Zap,
    },
    {
      id: 'competitive-play',
      title: 'Jeu Compétitif',
      description: 'Entraînez-vous dans des scénarios de jeu réels pour améliorer vos compétences stratégiques',
      icon: Clock,
    },
    {
      id: 'team-coordination',
      title: 'Coordination d\'Équipe',
      description: 'Apprenez à travailler efficacement avec vos coéquipiers sur le terrain',
      icon: Brain,
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Entraînement Punto</h2>
            <p className="text-sm sm:text-base text-emerald-200">
                Choisissez un exercice pour développer vos compétences en Punto.
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
                            <div className='flex items-start justify-between mb-2 sm:mb-3 gap-2'>
                                <div className='flex items-start gap-3'>
                                    <div className='p-2 sm:p-3 rounded-lg bg-yellow-600/20 shrink-0'>
                                        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-base sm:text-lg font-bold text-white">{drill.title}</h3>
                                    </div>
                                </div>
                                <p className="text-emerald-200 text-xs sm:text-sm mb-3 sm:mb-4">{drill.description}</p>
                            </div>
                            <div className="text-emerald-400 text-xs sm:text-sm font-medium">
                                Commencer l'exercice →
                            </div>
                    </button>
                )
            })}
        </div>
    </div>
  );
};  