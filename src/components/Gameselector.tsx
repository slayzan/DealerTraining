import { Spade, Heart, Diamond, Club, GraduationCap, Coins } from 'lucide-react';

interface GameSelectorProps {
    onSelect: (game: 'blackjack' | 'ultimate' | 'menu' | 'punto bunco' | 'omaha') => void;
}

export function GameSelector({ onSelect }: GameSelectorProps) {
    const modules = [
        {
            id: 'blackjack' as const,
            title: 'Blackjack',
            description: 'Apprenez à calculer les blackjacks et les combinaisons de cartes',
            icon: Spade,
            color: 'from-red-600 to-red-700'
        },
        {
            id: 'ultimate' as const,
            title: 'Ultimate Poker Texas Hold\'em',
            description: 'Maîtrisez le tableau de payement et les bases du Poker',
            icon: Heart,
            color: 'from-purple-600 to-purple-700'
        },
        {
            id: 'punto bunco' as const,
            title: 'Punto Bunco',
            description: 'Apprenez les tirages du Punto Bunco et le calcul des egalités',
            icon: Diamond,
            color: 'from-yellow-600 to-yellow-700'
        },
        {
            id: 'omaha' as const,
            title: 'Omaha',
            description: 'Apprenez a lire un board et les combinaisons de mains en Omaha',
            icon: Club,
            color: 'from-blue-600 to-blue-700'
    }
    ];

    return (
        <div className='space-y-6 sm:space-y-8'>
            <div className='text-center mb-8 sm:mb-12'>
                <div className='flex justify-center gap-3 mb-4'>
                    <Diamond className="w-8 h-8 sm:w-12 sm:h-12 text-red-400" />
                    <Spade className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                    <Heart className="w-8 h-8 sm:w-12 sm:h-12 text-red-400" />
                    <Club className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl text-white mb-2 sm:mb-3 px-4">Choisissez votre module d'entraînement</h2>
                <p className="text-sm sm:text-base text-emerald-200 max-w-2xl mx-auto px-4">
                    Développez vos techniques apprises en formation à travers des exercices interactifs.
                </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                {modules.map((module) => {
                    const Icon = module.icon;
                    return (
                        <button
                            key={module.id}
                            onClick={() => onSelect(module.id)}
                            className='group relative overflow-hidden rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-5 sm:p-8 text-left transition-all active:scale-95 sm:hover:scale-105 hover:bg-white/15 hover:border-white/30'>
                                <div className="relative">
                                    <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                                        <div className={`p-2 sm:p-3 rounded-lg bg-linear-to-br ${module.color} shrink-0`}>
                                            <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">{module.title}</h3>
                                            <p className="text-sm sm:text-base text-emerald-200">{module.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-emerald-300 text-xs sm:text-sm font-medium">
                                        Commencer l'entraînement →
                                    </div>
                                </div>
                        </button>
                )})}
            </div>
        </div>
    );
}