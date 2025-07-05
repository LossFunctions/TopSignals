// src/App.tsx
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { SignalsGrid } from '@/components/SignalsGrid';
import { Footer } from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster-simple';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import './App.css';

function App() {
  // Create a state to track if the page has been loaded
  const [loaded, setLoaded] = useState(false);
  const { user } = useAuth();

  // Update the loaded state after component mounts
  useEffect(() => {
    setLoaded(true);
  }, []);

  // Handle checkout success/cancel from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const checkout = urlParams.get('checkout');
    const sessionId = urlParams.get('session_id');

    if (checkout === 'success' && sessionId) {
      toast.success('🎉 Welcome to Premium! Your account has been upgraded successfully.');
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (checkout === 'cancel') {
      toast.error('Checkout was cancelled. You can try again anytime.');
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Show premium status message for premium users
  useEffect(() => {
    if (user?.user_metadata?.is_premium) {
      const isAdmin = user?.user_metadata?.is_admin;
      if (isAdmin) {
        toast.success('Welcome back, Admin! You have full access to all features.');
      }
    }
  }, [user]);

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
      <SpeedInsights />
    </div>
  );
}

export default App;