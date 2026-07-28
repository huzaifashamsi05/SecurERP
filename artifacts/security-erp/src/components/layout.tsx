import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  ShieldCheck, 
  Users, 
  Briefcase, 
  MapPin, 
  Clock, 
  CheckSquare, 
  Map, 
  AlertTriangle, 
  FileText, 
  CalendarOff, 
  DollarSign, 
  Receipt, 
  CreditCard, 
  Package, 
  Truck, 
  GraduationCap, 
  UserPlus, 
  Bell, 
  LogOut,
  Menu,
  ChevronDown,
  Building,
  UserCog,
  Network,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useLogout } from '@workspace/api-client-react';

const MODULES = [
  {
    name: 'Overview',
    items: [
      { name: 'Dashboard', path: '/', icon: ShieldCheck, allowedRoles: ['super_admin', 'company_admin', 'operations_manager', 'hr_manager', 'finance_manager', 'field_supervisor', 'guard', 'client'] },
    ]
  },
  {
    name: 'Operations',
    items: [
      { name: 'Sites', path: '/sites', icon: MapPin, allowedRoles: ['super_admin', 'company_admin', 'operations_manager', 'field_supervisor', 'client'] },
      { name: 'Shifts', path: '/shifts', icon: Clock, allowedRoles: ['super_admin', 'company_admin', 'operations_manager', 'field_supervisor', 'guard'] },
      { name: 'Attendance', path: '/attendance', icon: CheckSquare, allowedRoles: ['super_admin', 'company_admin', 'operations_manager', 'hr_manager', 'field_supervisor', 'guard'] },
      { name: 'Patrols', path: '/patrols', icon: Map, allowedRoles: ['super_admin', 'company_admin', 'operations_manager', 'field_supervisor', 'guard'] },
      { name: 'Incidents', path: '/incidents', icon: AlertTriangle, allowedRoles: ['super_admin', 'company_admin', 'operations_manager', 'field_supervisor', 'guard', 'client'] },
      { name: 'Daily Reports', path: '/daily-reports', icon: FileText, allowedRoles: ['super_admin', 'company_admin', 'operations_manager', 'field_supervisor', 'guard', 'client'] },
    ]
  },
  {
    name: 'SaaS Admin',
    items: [
      { name: 'Companies', path: '/admin/companies', icon: Building, allowedRoles: ['super_admin'] },
    ]
  },
  {
    name: 'People',
    items: [
      { name: 'Staff', path: '/staff', icon: UserCog, allowedRoles: ['super_admin', 'company_admin', 'hr_manager'] },
      { name: 'Roles & Access', path: '/roles', icon: Network, allowedRoles: ['super_admin', 'company_admin'] },
      { name: 'Guards', path: '/guards', icon: Users, allowedRoles: ['super_admin', 'company_admin', 'operations_manager', 'hr_manager', 'field_supervisor'] },
      { name: 'Clients', path: '/clients', icon: Briefcase, allowedRoles: ['super_admin', 'company_admin', 'operations_manager', 'finance_manager'] },
    ]
  },
  {
    name: 'HR & Finance',
    items: [
      { name: 'Leave', path: '/leave', icon: CalendarOff, allowedRoles: ['super_admin', 'company_admin', 'hr_manager', 'guard', 'field_supervisor'] },
      { name: 'Payroll', path: '/payroll', icon: DollarSign, allowedRoles: ['super_admin', 'company_admin', 'hr_manager', 'finance_manager'] },
      { name: 'Invoices', path: '/invoices', icon: Receipt, allowedRoles: ['super_admin', 'company_admin', 'finance_manager'] },
      { name: 'Expenses', path: '/expenses', icon: CreditCard, allowedRoles: ['super_admin', 'company_admin', 'finance_manager'] },
      { name: 'Training', path: '/training', icon: GraduationCap, allowedRoles: ['super_admin', 'company_admin', 'hr_manager', 'operations_manager', 'guard'] },
      { name: 'Recruitment', path: '/recruitment', icon: UserPlus, allowedRoles: ['super_admin', 'company_admin', 'hr_manager'] },
    ]
  },
  {
    name: 'Assets',
    items: [
      { name: 'Equipment', path: '/equipment', icon: Package, allowedRoles: ['super_admin', 'company_admin', 'operations_manager'] },
      { name: 'Vehicles', path: '/vehicles', icon: Truck, allowedRoles: ['super_admin', 'company_admin', 'operations_manager'] },
    ]
  }
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const logout = useLogout();
  
  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return null; // AuthProvider handles redirect
  }

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        setLocation('/login');
      }
    });
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2 text-sidebar-primary font-bold text-lg tracking-tight">
            <ShieldCheck className="h-6 w-6" />
            <span>SecurERP</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {MODULES.map((module) => {
            const visibleItems = module.items.filter(item => 
              !item.allowedRoles || item.allowedRoles.includes(user.role)
            );
            
            if (visibleItems.length === 0) return null;
            
            return (
              <div key={module.name}>
                <div className="px-3 mb-2 text-xs font-semibold text-sidebar-accent-foreground/50 uppercase tracking-wider">
                  {module.name}
                </div>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
                    return (
                      <Link 
                        key={item.path} 
                        href={item.path} 
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-foreground font-medium text-xs">
                {user.name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-sidebar-foreground leading-none">{user.name}</span>
                <span className="text-xs text-sidebar-foreground/50 mt-1">{user.role}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center w-full gap-2 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileOpen(false)} />
          <div className="relative w-64 h-full bg-sidebar border-r border-sidebar-border flex flex-col shadow-xl">
            <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
              <div className="flex items-center gap-2 text-sidebar-primary font-bold text-lg tracking-tight">
                <ShieldCheck className="h-6 w-6" />
                <span>SecurERP</span>
              </div>
              <button onClick={() => setIsMobileOpen(false)} className="text-sidebar-foreground/70 hover:text-sidebar-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
              {MODULES.map((module) => {
                const visibleItems = module.items.filter(item => 
                  !item.allowedRoles || item.allowedRoles.includes(user.role)
                );
                if (visibleItems.length === 0) return null;
                return (
                  <div key={module.name}>
                    <div className="px-3 mb-2 text-xs font-semibold text-sidebar-accent-foreground/50 uppercase tracking-wider">
                      {module.name}
                    </div>
                    <div className="space-y-1">
                      {visibleItems.map((item) => {
                        const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
                        return (
                          <Link 
                            key={item.path} 
                            href={item.path} 
                            onClick={() => setIsMobileOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 border-t border-sidebar-border">
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center w-full gap-2 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-destructive transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 flex-shrink-0 border-b border-border bg-card flex items-center justify-between px-6">
          <div className="flex items-center md:hidden">
            <button onClick={() => setIsMobileOpen(true)} className="text-foreground/70 hover:text-foreground">
              <Menu className="h-6 w-6" />
            </button>
            <span className="ml-4 font-bold text-lg text-primary tracking-tight">SecurERP</span>
          </div>
          <div className="hidden md:flex items-center text-sm font-medium text-muted-foreground">
            Command Center
          </div>
          <div className="flex items-center gap-4">
            <Link href="/notifications" className="relative p-2 text-foreground/70 hover:text-foreground hover:bg-accent rounded-full transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-card"></span>
            </Link>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
