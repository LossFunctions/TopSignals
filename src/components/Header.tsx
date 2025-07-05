import { useState } from 'react';
import { Activity, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NotifyMeDialog } from '@/components/NotifyMeDialog';
import { AuthDialog } from '@/components/AuthDialog';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export function Header() {
  const [showModal, setShowModal] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const { user, signOut } = useAuth();
  
  // Check if user is premium or admin
  const isPremium = user?.user_metadata?.is_premium || user?.user_metadata?.is_admin || false;

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please sign in to upgrade to premium');
      setShowModal(false);
      setShowAuthDialog(true);
      return;
    }

    setIsProcessingCheckout(true);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user.email,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;

    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start checkout process';
      toast.error(errorMessage);
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  return (
    <header className="w-full py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <Activity className="h-6 w-6 text-emerald-500" />
        <h1 className="text-xl font-semibold text-white">Top Signals</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <NotifyMeDialog />
        {!isPremium && (
          <Button 
            onClick={() => {
              if (!user) {
                setShowAuthDialog(true);
              } else {
                setShowModal(true);
              }
            }}
            className="bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-200"
            aria-label="Unlock All Signals"
          >
            Unlock All Signals
          </Button>
        )}
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 hidden sm:inline">{user.email}</span>
            <Button 
              onClick={signOut}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              Log Out
            </Button>
          </div>
        ) : (
          <Button 
            onClick={() => setShowAuthDialog(true)}
            variant="outline"
            className="text-white border-gray-600 hover:bg-gray-800 hover:text-white bg-transparent"
          >
            Sign In
          </Button>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md bg-gray-900 border border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Upgrade to Premium</DialogTitle>
            <DialogDescription className="text-gray-400">
              Get access to all signals, historical data, and alerts.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="rounded-lg bg-gray-800 p-4">
              <h3 className="font-medium mb-2">Premium Features</h3>
              <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                <li>Access to 10+ additional market signals</li>
                <li>Real-time alerts via email and SMS</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleCheckout}
              disabled={isProcessingCheckout}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isProcessingCheckout ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Proceed to Checkout'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog}
      />
    </header>
  );
}