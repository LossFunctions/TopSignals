import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bell, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { SIGNAL_CONFIG, type SignalKey } from '@/types/subscription';
import { formatPhoneNumber } from '@/lib/subscriptionUtils';

// Form validation schema
const formSchema = z.object({
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format')
    .transform((val) => formatPhoneNumber(val))
    .refine((val) => /^\+[1-9]\d{1,14}$/.test(val), {
      message: 'Invalid phone number format',
    }),
  signals: z.object({
    pi_cycle: z.boolean(),
    four_year: z.boolean(),
    coinbase_rank: z.boolean(),
    monthly_rsi: z.boolean(),
    weekly_ema: z.boolean(),
  }).refine((signals) => Object.values(signals).some(Boolean), {
    message: 'Please select at least one signal alert',
  }),
});

type FormData = z.infer<typeof formSchema>;

export function NotifyMeDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: '',
      signals: {
        pi_cycle: false,
        four_year: false,
        coinbase_rank: false,
        monthly_rsi: false,
        weekly_ema: false,
      },
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('✅ You\'re subscribed! We\'ll text you when signals trigger.');
        form.reset();
        setOpen(false);
      } else {
        toast.error(result.error || 'Failed to subscribe. Please try again.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bell className="h-4 w-4" />
          Notify Me
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-[#0a0a0a] border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white flex items-center gap-2">
            <Bell className="h-6 w-6 text-yellow-500" />
            Get SMS Alerts
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Enter your phone number and select which signals you want to be notified about via SMS.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="tel"
                      placeholder="1-347-400-1111"
                      className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500"
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription className="text-gray-500">
                    We'll send you alerts so you make sure to sell at the right time!
                  </FormDescription>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="text-sm font-medium text-white">Select Signals to Monitor</div>
              
              {Object.entries(SIGNAL_CONFIG).map(([key, config]) => (
                <FormField
                  key={key}
                  control={form.control}
                  name={`signals.${key as SignalKey}`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-gray-800 p-4 bg-gray-900/50">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSubmitting}
                          className="data-[state=checked]:bg-yellow-600"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-white font-normal cursor-pointer">
                          {config.name}
                        </FormLabel>
                        <FormDescription className="text-gray-500 text-sm">
                          {config.description}
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              ))}
              
              {form.formState.errors.signals && (
                <p className="text-sm text-red-400">{form.formState.errors.signals.message}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  'Subscribe to Alerts'
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Message and data rates may apply. Reply STOP to unsubscribe.
            </p>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}