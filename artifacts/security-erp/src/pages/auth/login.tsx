import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin } from '@workspace/api-client-react';
import { useLocation, Link } from 'wouter';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: 'Login successful' });
        setLocation('/');
      },
      onError: (error) => {
        toast({ 
          title: 'Login failed', 
          description: 'Invalid credentials. Please try again.', 
          variant: 'destructive' 
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-sidebar-primary">
          <div className="w-16 h-16 bg-sidebar-primary/10 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-sidebar-primary/20">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">SecurERP</h1>
          <p className="text-sidebar-accent-foreground/70 text-sm mt-2">Precision Operations Platform</p>
        </div>

        <Card className="border-sidebar-border bg-sidebar-accent/30 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold tracking-tight text-white text-center">
              Command Access
            </CardTitle>
            <CardDescription className="text-center text-sidebar-accent-foreground/60">
              Authenticate to access the control center
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
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-sidebar-primary hover:text-sidebar-primary/80 font-medium">
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  className="bg-sidebar-accent border-sidebar-border text-white placeholder:text-sidebar-accent-foreground/30 focus-visible:ring-sidebar-primary"
                  {...form.register('password')} 
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 mt-2 font-semibold"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...</>
                ) : (
                  'Authorize'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
