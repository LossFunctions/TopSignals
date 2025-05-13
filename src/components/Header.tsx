import { useState } from 'react';
import { Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function Header() {
  const [showModal, setShowModal] = useState(false);

  return (
    <header className="w-full py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <Activity className="h-6 w-6 text-emerald-500" />
        <h1 className="text-xl font-semibold text-white">Top Signals</h1>
      </div>
      
      <Button 
        onClick={() => setShowModal(true)}
        className="bg-emerald-500 hover:bg-emerald-600 text-white transition-all duration-200"
        aria-label="Unlock All Signals"
      >
        Unlock All Signals
      </Button>

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
            <Button type="button" className="bg-emerald-500 hover:bg-emerald-600">
              Proceed to Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}