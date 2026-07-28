import { useState } from 'react';
import { useGetAttendance, useCreateAttendance, useGetGuards } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, CheckCircle2, XCircle, Clock, Plus, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function Attendance() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGuard, setSelectedGuard] = useState<string>('');
  const [status, setStatus] = useState<string>('present');
  
  const { toast } = useToast();
  const { data: attendance, isLoading, refetch } = useGetAttendance();
  const { data: guards } = useGetGuards();
  const createMutation = useCreateAttendance();

  const filteredData = attendance?.filter(a => 
    a.guardName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLogAttendance = async () => {
    if (!selectedGuard) return;
    
    try {
      await createMutation.mutateAsync({
        data: {
          guardId: parseInt(selectedGuard),
          date: format(new Date(), 'yyyy-MM-dd'),
          checkIn: new Date().toISOString(),
          status: status as any
        }
      });
      toast({ title: 'Attendance Logged', description: 'Record has been successfully saved.' });
      setIsDialogOpen(false);
      refetch();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to log attendance.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance Log</h1>
          <p className="text-muted-foreground text-sm mt-1">Review clock-in and clock-out records.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Log Attendance
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search records..." className="pl-9 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Officer</TableHead>
                <TableHead>Clock In</TableHead>
                <TableHead>Clock Out</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading records...</TableCell></TableRow>
              ) : filteredData?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No records found.</TableCell></TableRow>
              ) : (
                filteredData?.map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      {format(new Date(record.date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">{record.guardName || `Guard #${record.guardId}`}</span>
                    </TableCell>
                    <TableCell>
                      {record.checkIn ? (
                        <div className="flex items-center text-sm font-mono text-muted-foreground">
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-emerald-500" />
                          {format(new Date(record.checkIn), 'HH:mm')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.checkOut ? (
                        <div className="flex items-center text-sm font-mono text-muted-foreground">
                          <Clock className="mr-1.5 h-3.5 w-3.5" />
                          {format(new Date(record.checkOut), 'HH:mm')}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${
                        record.status === 'present' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        record.status === 'late' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : 
                        'bg-destructive/10 text-destructive border-destructive/20'
                      }`}>
                        {record.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Log Attendance</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Select Guard</Label>
              <Select value={selectedGuard} onValueChange={setSelectedGuard}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a guard" />
                </SelectTrigger>
                <SelectContent>
                  {guards?.map((guard) => (
                    <SelectItem key={guard.id} value={guard.id.toString()}>
                      {guard.name || `Guard ${guard.employeeId}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="half_day">Half Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleLogAttendance} disabled={!selectedGuard || createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
