import { useRoute } from 'wouter';
import { useGetGuard, useGetShifts, useGetAttendance } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'wouter';
import { ArrowLeft, Shield, MapPin, Phone, Mail, Calendar, Clock, BadgeCheck, User } from 'lucide-react';
import { format } from 'date-fns';

export default function GuardProfile() {
  const [, params] = useRoute('/guards/:id');
  const guardId = Number(params?.id);

  const { data: guard, isLoading } = useGetGuard(guardId);
  const { data: shifts } = useGetShifts({ guardId });
  const { data: attendance } = useGetAttendance({ guardId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading personnel data...</p>
        </div>
      </div>
    );
  }

  if (!guard) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Guard Not Found</h2>
          <p className="text-muted-foreground">The requested personnel record does not exist.</p>
          <Link href="/guards">
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Roster</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'on_leave': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'inactive': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getShiftStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'active': case 'in_progress': return 'bg-primary/10 text-primary border-primary/20';
      case 'scheduled': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getAttendanceColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'late': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'absent': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/guards">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Personnel Profile</h1>
          <p className="text-muted-foreground text-sm mt-1">Detailed officer information and history.</p>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
                {guard.name?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h2 className="text-xl font-bold text-foreground">{guard.name}</h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${getStatusColor(guard.status)}`}>
                  {guard.status.replace('_', ' ')}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono font-medium text-foreground">{guard.employeeId}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{guard.email || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{guard.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{guard.siteName || 'Unassigned'}</span>
                </div>
              </div>
              {(guard.licenseNumber || guard.joinDate) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {guard.licenseNumber && (
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">License:</span>
                      <span className="font-medium text-foreground">{guard.licenseNumber}</span>
                    </div>
                  )}
                  {guard.joinDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Joined:</span>
                      <span className="font-medium text-foreground">{format(new Date(guard.joinDate), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
              )}
              {guard.skills && guard.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {guard.skills.map((skill: string, i: number) => (
                    <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shifts History */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-muted/20 border-b border-border/50 py-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Shift History
            {shifts && <span className="text-xs text-muted-foreground font-normal">({shifts.length} records)</span>}
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!shifts || shifts.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground">No shifts recorded.</TableCell></TableRow>
              ) : (
                shifts.slice(0, 10).map((shift) => (
                  <TableRow key={shift.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-sm">{shift.siteName || `Site #${shift.siteId}`}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{format(new Date(shift.startTime), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(shift.startTime), 'HH:mm')} - {format(new Date(shift.endTime), 'HH:mm')}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${getShiftStatusColor(shift.status)}`}>
                        {shift.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Attendance History */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-muted/20 border-b border-border/50 py-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Attendance Record
            {attendance && <span className="text-xs text-muted-foreground font-normal">({attendance.length} records)</span>}
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!attendance || attendance.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-20 text-center text-muted-foreground">No attendance records.</TableCell></TableRow>
              ) : (
                attendance.slice(0, 15).map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm font-medium">{record.date}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {record.checkIn ? format(new Date(record.checkIn), 'HH:mm') : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {record.checkOut ? format(new Date(record.checkOut), 'HH:mm') : '—'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${getAttendanceColor(record.status)}`}>
                        {record.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{record.notes || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
