import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, ShieldAlert, Users, Wallet, Briefcase, UserCog, CheckCircle2, XCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

type RoleDef = {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
  permissions: {
    dashboard: boolean;
    staff: boolean;
    guards: boolean;
    clients: boolean;
    shifts: boolean;
    finance: boolean;
  };
};

const roles: RoleDef[] = [
  {
    id: 'company_admin',
    name: 'Company Admin',
    icon: Building2,
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    description: 'Full control over the company portal. Can hire staff and view all operations.',
    permissions: { dashboard: true, staff: true, guards: true, clients: true, shifts: true, finance: true }
  },
  {
    id: 'hr_manager',
    name: 'HR Manager',
    icon: Users,
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    description: 'Manages recruitment, staff profiles, guard rosters, and training schedules.',
    permissions: { dashboard: true, staff: true, guards: true, clients: false, shifts: false, finance: false }
  },
  {
    id: 'operations_manager',
    name: 'Operations Manager',
    icon: ShieldAlert,
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    description: 'Schedules shifts, tracks patrols, and manages client sites and incidents.',
    permissions: { dashboard: true, staff: false, guards: true, clients: true, shifts: true, finance: false }
  },
  {
    id: 'finance_manager',
    name: 'Finance Manager',
    icon: Wallet,
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    description: 'Handles payroll, client invoicing, and company expenses.',
    permissions: { dashboard: true, staff: false, guards: false, clients: true, shifts: false, finance: true }
  },
  {
    id: 'field_supervisor',
    name: 'Field Supervisor',
    icon: Briefcase,
    color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    description: 'On-ground supervisor managing guard attendance and shift operations.',
    permissions: { dashboard: true, staff: false, guards: true, clients: false, shifts: true, finance: false }
  },
  {
    id: 'guard',
    name: 'Security Guard',
    icon: UserCog,
    color: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    description: 'Field officer performing patrols, submitting daily reports, and logging incidents.',
    permissions: { dashboard: true, staff: false, guards: false, clients: false, shifts: true, finance: false }
  }
];

export default function RoleMatrixPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization Structure</h1>
        <p className="text-muted-foreground mt-1">
          Explore the Role-Based Access Control (RBAC) hierarchy for your company portal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <Card key={role.id} className="relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 transition-transform group-hover:scale-150 ${role.color.split(' ')[0]}`} />
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${role.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  {user?.role === role.id && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Your Role
                    </Badge>
                  )}
                </div>
                <CardTitle>{role.name}</CardTitle>
                <CardDescription className="h-10 line-clamp-2">{role.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <h4 className="text-sm font-semibold text-muted-foreground">Access Permissions</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(role.permissions).map(([module, hasAccess]) => (
                      <div key={module} className="flex items-center gap-2">
                        {hasAccess ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-muted/40" />
                        )}
                        <span className={`capitalize ${hasAccess ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {module}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-primary/5 border-primary/20 mt-8">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">How to invite staff?</h3>
              <p className="text-muted-foreground mt-1">
                As a Company Admin, you can invite new staff members from the <strong className="text-foreground">People &gt; Staff</strong> page. 
                Once created, they can log into this portal using their email. The system will automatically detect their role and restrict their access according to the matrix above.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
