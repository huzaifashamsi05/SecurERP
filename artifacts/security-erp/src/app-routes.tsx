import { useEffect } from 'react';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { useAuth, AuthProvider } from '@/contexts/auth-context';
import { Layout } from '@/components/layout';
import Login from '@/pages/auth/login';
import ForgotPassword from '@/pages/auth/forgot-password';
import Dashboard from '@/pages/dashboard';
import Guards from '@/pages/guards/index';
import Clients from '@/pages/people/clients';
import Sites from '@/pages/operations/sites';
import Shifts from '@/pages/operations/shifts';
import Attendance from '@/pages/operations/attendance';
import Incidents from '@/pages/operations/incidents';
import Payroll from '@/pages/hr/payroll';
import Leave from '@/pages/hr/leave';
import Expenses from '@/pages/hr/expenses';
import Invoices from '@/pages/hr/invoices';
import Vehicles from '@/pages/assets/vehicles';
import Equipment from '@/pages/assets/equipment';
import Notifications from '@/pages/notifications';

// Placeholder pages to be implemented
const Placeholder = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="text-center space-y-2">
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <p className="text-muted-foreground">Module under construction</p>
    </div>
  </div>
);

function ProtectedRoute({ component: Component, ...rest }: { component: any, [key: string]: any }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return null;
  if (!isAuthenticated) return null; // AuthProvider redirects
  
  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function Routes() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/guards" component={() => <ProtectedRoute component={Guards} />} />
      <Route path="/guards/:id" component={() => <ProtectedRoute component={() => <Placeholder title="Guard Profile" />} />} />
      <Route path="/clients" component={() => <ProtectedRoute component={Clients} />} />
      <Route path="/clients/:id" component={() => <ProtectedRoute component={() => <Placeholder title="Client Details" />} />} />
      <Route path="/sites" component={() => <ProtectedRoute component={Sites} />} />
      <Route path="/shifts" component={() => <ProtectedRoute component={Shifts} />} />
      <Route path="/attendance" component={() => <ProtectedRoute component={Attendance} />} />
      <Route path="/patrols" component={() => <ProtectedRoute component={() => <Placeholder title="Patrols" />} />} />
      <Route path="/checkpoints" component={() => <ProtectedRoute component={() => <Placeholder title="Checkpoints" />} />} />
      <Route path="/incidents" component={() => <ProtectedRoute component={Incidents} />} />
      <Route path="/incidents/:id" component={() => <ProtectedRoute component={() => <Placeholder title="Incident Details" />} />} />
      <Route path="/daily-reports" component={() => <ProtectedRoute component={() => <Placeholder title="Daily Reports" />} />} />
      
      <Route path="/leave" component={() => <ProtectedRoute component={Leave} />} />
      <Route path="/payroll" component={() => <ProtectedRoute component={Payroll} />} />
      <Route path="/invoices" component={() => <ProtectedRoute component={Invoices} />} />
      <Route path="/expenses" component={() => <ProtectedRoute component={Expenses} />} />
      
      <Route path="/equipment" component={() => <ProtectedRoute component={Equipment} />} />
      <Route path="/vehicles" component={() => <ProtectedRoute component={Vehicles} />} />
      
      <Route path="/training" component={() => <ProtectedRoute component={() => <Placeholder title="Training" />} />} />
      <Route path="/recruitment" component={() => <ProtectedRoute component={() => <Placeholder title="Recruitment Pipeline" />} />} />
      <Route path="/notifications" component={() => <ProtectedRoute component={Notifications} />} />
      
      <Route component={() => (
        <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-bold tracking-tighter text-primary">404</h1>
            <p className="text-xl text-muted-foreground">Coordinates unknown</p>
            <a href="/" className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-10 px-4 py-2 hover:bg-primary/90">
              Return to Command
            </a>
          </div>
        </div>
      )} />
    </Switch>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes />
    </AuthProvider>
  );
}
