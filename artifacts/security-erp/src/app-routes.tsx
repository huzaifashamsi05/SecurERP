import { useEffect } from 'react';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { useAuth, AuthProvider } from '@/contexts/auth-context';
import { Layout } from '@/components/layout';
import Login from '@/pages/auth/login';
import ForgotPassword from '@/pages/auth/forgot-password';
import Dashboard from '@/pages/dashboard';
import Guards from '@/pages/guards/index';
import GuardProfile from '@/pages/guards/guard-profile';
import Clients from '@/pages/people/clients';
import ClientDetails from '@/pages/people/client-details';
import Sites from '@/pages/operations/sites';
import Shifts from '@/pages/operations/shifts';
import Attendance from '@/pages/operations/attendance';
import Patrols from '@/pages/operations/patrols';
import Checkpoints from '@/pages/operations/checkpoints';
import Incidents from '@/pages/operations/incidents';
import DailyReports from '@/pages/operations/daily-reports';
import Payroll from '@/pages/hr/payroll';
import Leave from '@/pages/hr/leave';
import Expenses from '@/pages/hr/expenses';
import Invoices from '@/pages/hr/invoices';
import Training from '@/pages/hr/training';
import Recruitment from '@/pages/hr/recruitment';
import Vehicles from '@/pages/assets/vehicles';
import Equipment from '@/pages/assets/equipment';
import Notifications from '@/pages/notifications';
import Companies from '@/pages/admin/companies';
import Staff from '@/pages/people/staff';
import RoleMatrixPage from '@/pages/people/role-matrix';

function ProtectedRoute({ component: Component, allowedRoles, ...rest }: { component: any, allowedRoles?: string[], [key: string]: any }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  if (isLoading) return null;
  if (!isAuthenticated || !user) return null; // AuthProvider redirects
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized users to dashboard
    setLocation('/');
    return null;
  }
  
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
      <Route path="/admin/companies" component={() => <ProtectedRoute component={Companies} allowedRoles={['super_admin']} />} />
      <Route path="/staff" component={() => <ProtectedRoute component={Staff} allowedRoles={['super_admin', 'company_admin', 'hr_manager']} />} />
      <Route path="/roles" component={() => <ProtectedRoute component={RoleMatrixPage} allowedRoles={['super_admin', 'company_admin']} />} />
      
      <Route path="/guards" component={() => <ProtectedRoute component={Guards} allowedRoles={['super_admin', 'company_admin', 'operations_manager', 'hr_manager', 'field_supervisor']} />} />
      <Route path="/guards/:id" component={() => <ProtectedRoute component={GuardProfile} allowedRoles={['super_admin', 'company_admin', 'operations_manager', 'hr_manager', 'field_supervisor']} />} />
      <Route path="/clients" component={() => <ProtectedRoute component={Clients} allowedRoles={['super_admin', 'company_admin', 'operations_manager', 'finance_manager']} />} />
      <Route path="/clients/:id" component={() => <ProtectedRoute component={ClientDetails} allowedRoles={['super_admin', 'company_admin', 'operations_manager', 'finance_manager']} />} />
      <Route path="/sites" component={() => <ProtectedRoute component={Sites} allowedRoles={['super_admin', 'company_admin', 'operations_manager', 'field_supervisor', 'client']} />} />
      <Route path="/shifts" component={() => <ProtectedRoute component={Shifts} allowedRoles={['super_admin', 'company_admin', 'operations_manager', 'field_supervisor', 'guard']} />} />
      <Route path="/attendance" component={() => <ProtectedRoute component={Attendance} allowedRoles={['super_admin', 'company_admin', 'operations_manager', 'hr_manager', 'field_supervisor', 'guard']} />} />
      <Route path="/patrols" component={() => <ProtectedRoute component={Patrols} allowedRoles={['super_admin', 'company_admin', 'operations_manager', 'field_supervisor', 'guard']} />} />
      <Route path="/checkpoints" component={() => <ProtectedRoute component={Checkpoints} allowedRoles={['super_admin', 'company_admin', 'operations_manager', 'field_supervisor']} />} />
      <Route path="/incidents" component={() => <ProtectedRoute component={Incidents} allowedRoles={['super_admin', 'company_admin', 'operations_manager', 'field_supervisor', 'guard', 'client']} />} />
      <Route path="/daily-reports" component={() => <ProtectedRoute component={DailyReports} allowedRoles={['super_admin', 'company_admin', 'operations_manager', 'field_supervisor', 'guard', 'client']} />} />
      
      <Route path="/leave" component={() => <ProtectedRoute component={Leave} allowedRoles={['super_admin', 'company_admin', 'hr_manager', 'guard', 'field_supervisor']} />} />
      <Route path="/payroll" component={() => <ProtectedRoute component={Payroll} allowedRoles={['super_admin', 'company_admin', 'hr_manager', 'finance_manager']} />} />
      <Route path="/invoices" component={() => <ProtectedRoute component={Invoices} allowedRoles={['super_admin', 'company_admin', 'finance_manager']} />} />
      <Route path="/expenses" component={() => <ProtectedRoute component={Expenses} allowedRoles={['super_admin', 'company_admin', 'finance_manager']} />} />
      
      <Route path="/equipment" component={() => <ProtectedRoute component={Equipment} allowedRoles={['super_admin', 'company_admin', 'operations_manager']} />} />
      <Route path="/vehicles" component={() => <ProtectedRoute component={Vehicles} allowedRoles={['super_admin', 'company_admin', 'operations_manager']} />} />
      
      <Route path="/training" component={() => <ProtectedRoute component={Training} allowedRoles={['super_admin', 'company_admin', 'hr_manager', 'operations_manager', 'guard']} />} />
      <Route path="/recruitment" component={() => <ProtectedRoute component={Recruitment} allowedRoles={['super_admin', 'company_admin', 'hr_manager']} />} />
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

