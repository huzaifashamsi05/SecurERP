import { useState } from 'react';
import { useGetShifts, useCreateShift } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetShiftsQueryKey } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Calendar, Clock, MapPin, User } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const createShiftSchema = z.object({
  guardId: z.coerce.number().min(1, 'Guard ID is required'),
  siteId: z.coerce.number().min(1, 'Site ID is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  notes: z.string().optional()
});

type CreateShiftValues = z.infer<typeof createShiftSchema>;

export default function Shifts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: shifts, isLoading } = useGetShifts();
  const createShift = useCreateShift();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<CreateShiftValues>({
    resolver: zodResolver(createShiftSchema),
    defaultValues: { guardId: 0, siteId: 0, startTime: '', endTime: '', notes: '' }
  });

  const onSubmit = (data: CreateShiftValues) => {
    // Format to ISO string for backend
    const formattedData = {
      ...data,
      startTime: new Date(data.startTime).toISOString(),
      endTime: new Date(data.endTime).toISOString()
    };
    createShift.mutate({ data: formattedData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetShiftsQueryKey() });
        toast({ title: 'Shift assigned successfully' });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: () => {
        toast({ title: 'Failed to assign shift', variant: 'destructive' });
      }
    });
  };

  const filteredShifts = shifts?.filter(s => 
    s.guardName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.siteName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Shift Schedule</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage duty roster and assignments.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold"><Plus className="mr-2 h-4 w-4" /> Assign Shift</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Assignment</DialogTitle>
              <DialogDescription>Assign a guard to a site shift.</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guardId">Guard ID</Label>
                  <Input id="guardId" type="number" {...form.register('guardId')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteId">Site ID</Label>
                  <Input id="siteId" type="number" {...form.register('siteId')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input id="startTime" type="datetime-local" {...form.register('startTime')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input id="endTime" type="datetime-local" {...form.register('endTime')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" {...form.register('notes')} />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createShift.isPending}>Schedule</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search guards or sites..." className="pl-9 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Officer</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading schedule...</TableCell></TableRow>
              ) : filteredShifts?.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No shifts scheduled.</TableCell></TableRow>
              ) : (
                filteredShifts?.map((shift) => (
                  <TableRow key={shift.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{shift.guardName || `Guard #${shift.guardId}`}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{shift.siteName || `Site #${shift.siteId}`}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center text-foreground">
                          <Calendar className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                          {format(new Date(shift.startTime), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="mr-1.5 h-3.5 w-3.5" />
                          {format(new Date(shift.startTime), 'HH:mm')} - {format(new Date(shift.endTime), 'HH:mm')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${
                        shift.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        shift.status === 'in_progress' ? 'bg-primary/10 text-primary border-primary/20' : 
                        'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                      }`}>
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
    </div>
  );
}
