import { useState } from 'react';
import { GameSelector } from './components/Gameselector';
import { BlackjackTraining } from './games/blackjack';
import { UltimateTraining } from './games/ultimate';
import { PuntoTraining } from './games/punto';
import { OmahaTraining } from './games/omaha';

import './App.css'
import Logo from './assets/DealerBg.png'

function App() {
  const [currentModule, setCurrentModule] = useState<'menu' | 'blackjack' | 'ultimate' | 'punto bunco' | 'omaha'>('menu');
  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-emerald-900 via-emerald-800 to-green-900">
       <header className="h-22 border-b border-white/10 bg-black/40 backdrop-blur-sm ">
          <div className="h-full mx-auto  flex items-center">
            <img src={Logo} alt="Dealer Training" className=" pb-3 h-20 w-auto object-contain" />
          <div className='flex w-full justify-end gap-8'>
            {/*<h1 className='text-white'>Se Connecter</h1>
            <h1 className='text-white'>S'inscrire</h1> 8*/}
            { currentModule !== 'menu' && (
              <button
              className="px-4 sm:px-6 mx-4 py-3 bg-white/10 hover:bg-white/20 text-white text-sm sm:text-base rounded-lg transition-colors border border-white/20 whitespace-nowrap "
              onClick={() => setCurrentModule('menu')}> ← Menu Principal</button>
              )}
          </div>
          </div>
        </header>

      <main className='max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8'>
        { currentModule === 'menu' && <GameSelector onSelect={setCurrentModule} /> }
        { currentModule === 'blackjack' && <BlackjackTraining /> }
        { currentModule === 'ultimate' && <UltimateTraining /> }
        { currentModule === 'punto bunco' && <PuntoTraining /> }
        { currentModule === 'omaha' && <OmahaTraining /> }
      </main>
      </div>
    </>
  )
}

export default App

