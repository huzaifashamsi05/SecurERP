import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation, Link } from 'wouter';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    // Mock functionality since API doesn't exist
    toast({ 
      title: 'Recovery email sent', 
      description: 'If an account exists, instructions will be sent to the email.'
    });
    setTimeout(() => setLocation('/login'), 2000);
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-sidebar-primary">
          <div className="w-16 h-16 bg-sidebar-primary/10 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-sidebar-primary/20">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">SecurERP</h1>
        </div>

        <Card className="border-sidebar-border bg-sidebar-accent/30 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold tracking-tight text-white text-center">
              Recover Access
            </CardTitle>
            <CardDescription className="text-center text-sidebar-accent-foreground/60">
              Enter your email to receive recovery instructions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@company.com" 
                  className="bg-sidebar-accent border-sidebar-border text-white placeholder:text-sidebar-accent-foreground/30 focus-visible:ring-sidebar-primary"
                  {...form.register('email')} 
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-3 mt-4">
                <Button 
                  type="submit" 
                  className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 font-semibold"
                >
                  Send Recovery Link
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full text-sidebar-accent-foreground hover:bg-sidebar-accent hover:text-white"
                  onClick={() => setLocation('/login')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Return to Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
