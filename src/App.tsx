// src/App.tsx
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { SignalsGrid } from '@/components/SignalsGrid';
import { Footer } from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster-simple';
import { Analytics } from '@vercel/analytics/react';
import './App.css';

function App() {
  // Create a state to track if the page has been loaded
  const [loaded, setLoaded] = useState(false);

  // Update the loaded state after component mounts
  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <div className={`min-h-screen flex flex-col justify-between 
      bg-gradient-radial from-neon-bg1 to-neon-bg2 
      transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
      
      <div className="w-full max-w-7xl mx-auto">
        <Header />
        
        <main className="flex-grow py-8">
          <h2 className="text-2xl font-semibold text-[#F5F5F7] text-center mb-8">
            Market Signals Dashboard
          </h2>
          <SignalsGrid />
        </main>
      </div>
      
      <Footer />
      <Toaster />
      <Analytics />
    </div>
  );
}

export default App;