import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLogin, useVerifyIdentity } from '@workspace/api-client-react';
import { useLocation, Link } from 'wouter';
import { ShieldCheck, Loader2, ArrowRight, UserCog, Shield, Building2, UserCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const passwordSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const loginMutation = useLogin();
  const verifyMutation = useVerifyIdentity();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [identity, setIdentity] = useState<{ role: string; companyName: string | null } | null>(null);

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '' },
  });

  const onEmailSubmit = (data: z.infer<typeof emailSchema>) => {
    verifyMutation.mutate(
      { data: { email: data.email } },
      {
        onSuccess: (res) => {
          setEmail(data.email);
          setIdentity({ role: res.role || 'operator', companyName: res.companyName || null });
          setStep(2);
        },
        onError: () => {
          toast({ 
            title: 'Identity Not Found', 
            description: 'No account exists with this email address.', 
            variant: 'destructive' 
          });
        }
      }
    );
  };

  const onPasswordSubmit = (data: z.infer<typeof passwordSchema>) => {
    loginMutation.mutate(
      { data: { email, password: data.password } }, 
      {
        onSuccess: () => {
          toast({ title: 'Authentication Successful', description: 'Welcome to SecurERP.' });
          window.location.href = '/';
        },
        onError: () => {
          toast({ 
            title: 'Access Denied', 
            description: 'Invalid password. Please verify and try again.', 
            variant: 'destructive' 
          });
        }
      }
    );
  };

  const handleDemoLogin = (demoEmail: string) => {
    // Fast path for demo
    verifyMutation.mutate(
      { data: { email: demoEmail } },
      {
        onSuccess: (res) => {
          setEmail(demoEmail);
          setIdentity({ role: res.role || 'operator', companyName: res.companyName || null });
          setStep(2);
          // Automatically submit password for demo
          setTimeout(() => {
            passwordForm.setValue('password', 'password123');
            loginMutation.mutate({ data: { email: demoEmail, password: 'password123' } }, {
              onSuccess: () => {
                toast({ title: 'Demo Access Granted' });
                window.location.href = '/';
              }
            });
          }, 600);
        }
      }
    );
  };

  // Human readable role formatter
  const formatRole = (role: string) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Side - Image/Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-950 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity scale-105 transform hover:scale-110 transition-transform duration-30000"
          style={{ backgroundImage: `url('/login-bg.jpg')` }}
        />
        
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-purple-900/40 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        {/* Content overlay */}
        <div className="relative z-10 p-12 flex flex-col justify-between h-full w-full max-w-2xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center gap-3 text-white"
          >
            <div className="w-12 h-12 bg-primary/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
              <ShieldCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight">SecurERP</span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="space-y-6"
          >
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h1 className="text-5xl font-bold tracking-tight text-white leading-tight">
                    Precision Operations. <br />
                    <span className="text-primary-foreground/70">Uncompromised Security.</span>
                  </h1>
                  <p className="text-lg text-white/60 max-w-md mt-4">
                    The ultimate multi-tenant platform for security guard management. Monitor fleets, deploy teams, and generate real-time reports with military-grade precision.
                  </p>
                </motion.div>
              ) : (
                <motion.div key="step2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary-foreground text-sm font-medium border border-primary/30 mb-6">
                    <UserCircle className="w-4 h-4" />
                    Verified Identity
                  </div>
                  <h1 className="text-5xl font-bold tracking-tight text-white leading-tight">
                    Welcome to <br />
                    <span className="text-primary-foreground">{identity?.companyName || 'SecurERP SaaS'}</span>
                  </h1>
                  <p className="text-lg text-white/60 max-w-md mt-4">
                    You are logging into your dedicated enterprise portal as a <strong>{formatRole(identity?.role || '')}</strong>.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          <div className="text-white/40 text-sm font-medium tracking-wide">
            © 2026 SecurERP Systems. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
          <div className="w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md relative z-10">
          <div className="lg:hidden flex flex-col items-center justify-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">SecurERP</h2>
          </div>

          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="form-step-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Sign In</h2>
                    <p className="text-muted-foreground text-sm">
                      Enter your email to locate your company portal.
                    </p>
                  </div>

                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="name@company.com" 
                        className="pl-4 py-6 bg-muted/50 border-border focus-visible:ring-primary/50 transition-all text-base"
                        {...emailForm.register('email')} 
                      />
                      {emailForm.formState.errors.email && (
                        <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full py-6 text-base font-semibold group transition-all duration-300"
                      disabled={verifyMutation.isPending}
                    >
                      {verifyMutation.isPending ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Locating Portal...</>
                      ) : (
                        <span className="flex items-center">
                          Continue
                          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      )}
                    </Button>
                  </form>

                  {/* Quick Login Section for Demo */}
                  <div className="pt-8 mt-8 border-t border-border">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4 text-center">
                      Quick Demo Access
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Button 
                        variant="outline" 
                        type="button"
                        className="h-auto py-3 px-2 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                        onClick={() => handleDemoLogin('superadmin@securerp.com')}
                      >
                        <Shield className="h-5 w-5 text-purple-500" />
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-semibold">Super Admin</span>
                          <span className="text-[10px] text-muted-foreground">SaaS Owner</span>
                        </div>
                      </Button>

                      <Button 
                        variant="outline" 
                        type="button"
                        className="h-auto py-3 px-2 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                        onClick={() => handleDemoLogin('admin@alpha.com')}
                      >
                        <Building2 className="h-5 w-5 text-blue-500" />
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-semibold">Company Admin</span>
                          <span className="text-[10px] text-muted-foreground">Alpha Security</span>
                        </div>
                      </Button>

                      <Button 
                        variant="outline" 
                        type="button"
                        className="h-auto py-3 px-2 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-colors"
                        onClick={() => handleDemoLogin('guard1@alpha.com')}
                      >
                        <UserCog className="h-5 w-5 text-emerald-500" />
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-semibold">Patrol Guard</span>
                          <span className="text-[10px] text-muted-foreground">Field Officer</span>
                        </div>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="form-step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-8"
                >
                  <div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="-ml-3 mb-4 text-muted-foreground"
                      onClick={() => setStep(1)}
                      disabled={loginMutation.isPending}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" /> Not you?
                    </Button>
                    <h2 className="text-3xl font-bold tracking-tight mb-2">Enter Password</h2>
                    <p className="text-muted-foreground text-sm flex flex-col gap-1">
                      <span>{email}</span>
                      <span className="font-medium text-foreground">{identity?.companyName ? `${identity.companyName} Portal` : 'SaaS Admin Portal'}</span>
                    </p>
                  </div>

                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link href="/forgot-password" className="text-sm text-primary hover:text-primary/80 transition-colors">
                          Forgot password?
                        </Link>
                      </div>
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••"
                        className="pl-4 py-6 bg-muted/50 border-border focus-visible:ring-primary/50 transition-all text-base tracking-widest"
                        {...passwordForm.register('password')} 
                        autoFocus
                      />
                      {passwordForm.formState.errors.password && (
                        <p className="text-sm text-destructive">{passwordForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full py-6 text-base font-semibold group transition-all duration-300"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Authenticating...</>
                      ) : (
                        <span className="flex items-center">
                          Authorize Access
                          <ShieldCheck className="ml-2 h-5 w-5" />
                        </span>
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
