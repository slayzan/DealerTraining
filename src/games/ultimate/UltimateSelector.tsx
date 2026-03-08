import { Eye, Zap } from "lucide-react";

export interface UltimateDrill {
  id: string;
  title: string;
  description: string;
  icon: any;
}

interface UltimateSelectorProps {
  onSelectDrill: (drillId: string) => void;
} 

export function UltimateSelector({ onSelectDrill }: UltimateSelectorProps) {
    const drills: UltimateDrill[] = [
        {
            id: 'winner-game',
            title: 'Qui Gagne ?',
            description: 'Analysez les mains et déterminez le gagnant au showdown',
            icon: Eye,
        },
        {
            id: 'ultimate-payout',
            title: 'Payement Ultimate',
            description: 'Apprend le tableau de payement du Texas Ultimate',
            icon: Zap,
        }
    ];

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/10">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Entraînement Ultimate Texas Hold'em</h2>
                <p className="text-sm sm:text-base text-emerald-200">
                    Choisissez un exercice pour développer vos compétences en Ultimate et Texas.
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
                                <div className='flex items-center justify-between mb-2 sm:mb-3 gap-2 '>
                                    <div className='flex items-center gap-3'>
                                        <div className='p-2 sm:p-3 rounded-lg bg-purple-600/20 shrink-0 flex items-center justify-center'>
                                            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm sm:text-lg font-bold text-white">{drill.title}</h3>
                                        </div>
                                    </div>
                                    <p className="text-emerald-200 text-sm sm:text-base px-3">{drill.description}</p>
                                </div>
                                <div className="text-emerald-200 text-xs sm:text-sm">
                                    Commencer l'exercice →
                                </div>
                        </button>
                    )
                })}
            </div>
        </div>
    );
};