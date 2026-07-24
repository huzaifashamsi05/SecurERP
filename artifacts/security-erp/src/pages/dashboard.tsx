import { 
  useGetDashboardSummary, 
  useGetAttendanceOverview, 
  useGetIncidentStats,
  useGetDashboardActivity
} from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert, Users, Clock, MapPin, Building, AlertTriangle, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  const { data: attendanceData, isLoading: loadingAttendance } = useGetAttendanceOverview();
  const { data: incidentStats, isLoading: loadingIncidents } = useGetIncidentStats();
  const { data: activities, isLoading: loadingActivity } = useGetDashboardActivity();

  const INCIDENT_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#22c55e'];

  if (loadingSummary) {
    return <div className="h-full flex items-center justify-center">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time operational overview.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Guards</p>
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold">{summary?.activeGuards || 0}</div>
              <div className="text-sm text-muted-foreground font-mono">/ {summary?.totalGuards || 0}</div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <span className="text-emerald-500 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded mr-2">+2%</span> from last week
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Sites</p>
              <Building className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold">{summary?.totalSites || 0}</div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              <span className="text-emerald-500 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded mr-2">+1</span> from last month
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Shifts</p>
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold">{summary?.activeShifts || 0}</div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              Current shift window
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Today's Incidents</p>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold">{summary?.todayIncidents || 0}</div>
            </div>
            <div className="mt-4 flex items-center text-xs text-muted-foreground">
              {summary?.todayIncidents === 0 ? (
                <span className="text-emerald-500 font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> All clear</span>
              ) : (
                <span className="text-destructive font-medium flex items-center gap-1"><ShieldAlert className="h-3 w-3"/> Requires attention</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Chart */}
        <Card className="col-span-1 lg:col-span-2 shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-base font-semibold">Attendance Overview</CardTitle>
            <CardDescription>7-day deployment statistics</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              {!loadingAttendance && attendanceData && attendanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '6px', fontSize: '13px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '13px' }} />
                    <Bar dataKey="present" name="Present" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="absent" name="Absent" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="late" name="Late" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Insufficient data</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Incident Stats Pie */}
        <Card className="shadow-sm">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="text-base font-semibold">Incidents by Type</CardTitle>
            <CardDescription>Monthly distribution</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              {!loadingIncidents && incidentStats && incidentStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incidentStats}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="type"
                    >
                      {incidentStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={INCIDENT_COLORS[index % INCIDENT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '6px', fontSize: '13px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle" 
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No incidents reported</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card className="shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <CardDescription>System-wide operational log</CardDescription>
          </div>
          <button className="text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {!loadingActivity && activities?.length ? (
              activities.map((activity) => (
                <div key={activity.id} className="p-4 hover:bg-muted/50 transition-colors flex items-start gap-4">
                  <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                    {activity.type === 'incident' ? <AlertTriangle className="h-4 w-4 text-destructive" /> : 
                     activity.type === 'shift' ? <Clock className="h-4 w-4 text-primary" /> :
                     activity.type === 'attendance' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
                     <ShieldAlert className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="font-mono">{new Date(activity.timestamp).toLocaleString()}</span>
                      {activity.actorName && (
                        <>
                          <span>•</span>
                          <span>{activity.actorName}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {activity.entityType && (
                    <div className="text-xs font-mono uppercase bg-muted px-2 py-1 rounded text-muted-foreground">
                      {activity.entityType} #{activity.entityId}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">No recent activity</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
