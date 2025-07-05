import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = isSignUp 
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success(isSignUp ? 'Account created successfully!' : 'Logged in successfully!');
        resetForm();
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Auth error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isSignUp ? 'Create an Account' : 'Sign In'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {isSignUp 
              ? 'Enter your email and password to create an account'
              : 'Enter your credentials to access your account'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              required
            />
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </Button>

            <div className="text-center text-sm text-gray-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <Button
                type="button"
                variant="link"
                onClick={toggleMode}
                disabled={isSubmitting}
                className="text-emerald-500 hover:text-emerald-400 p-0 ml-1"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Button>
            </div>

            {!isSignUp && (
              <Button
                type="button"
                variant="link"
                disabled={isSubmitting}
                className="text-gray-400 hover:text-white text-sm p-0"
              >
                Forgot password?
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}