import { useState } from 'react';
import { useGetPatrols, useCreatePatrol, getGetPatrolsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Navigation, MapPin, User, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const patrolSchema = z.object({
  siteId: z.coerce.number().min(1, "Site ID is required"),
  guardId: z.coerce.number().min(1, "Guard ID is required"),
  startTime: z.string().optional(),
  notes: z.string().optional(),
});

type PatrolFormValues = z.infer<typeof patrolSchema>;

export default function PatrolsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patrols, isLoading } = useGetPatrols();
  const createPatrol = useCreatePatrol();

  const form = useForm<PatrolFormValues>({
    resolver: zodResolver(patrolSchema),
    defaultValues: {
      siteId: undefined as any,
      guardId: undefined as any,
      startTime: '',
      notes: '',
    },
  });

  const onSubmit = (data: PatrolFormValues) => {
    createPatrol.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPatrolsQueryKey() });
          toast({ title: 'Patrol scheduled successfully' });
          setIsDialogOpen(false);
          form.reset();
        },
        onError: () => {
          toast({ title: 'Failed to schedule patrol', variant: 'destructive' });
        },
      }
    );
  };

  const filteredPatrols = patrols?.filter((patrol) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patrol.guardName?.toLowerCase().includes(searchLower) ||
      patrol.siteName?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'in_progress': return 'bg-blue-100 text-blue-800 hover:bg-blue-100/80 dark:bg-blue-900/30 dark:text-blue-400';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-100 text-red-800 hover:bg-red-100/80 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100/80 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Patrol Tracking</h2>
          <p className="text-muted-foreground">Monitor and schedule patrol rounds.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Schedule Patrol
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Patrol</DialogTitle>
              <DialogDescription>
                Schedule a new patrol round for a guard.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteId">Site ID</Label>
                <Input
                  id="siteId"
                  type="number"
                  placeholder="Enter site ID"
                  {...form.register('siteId')}
                />
                {form.formState.errors.siteId && (
                  <p className="text-sm text-destructive">{form.formState.errors.siteId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardId">Guard ID</Label>
                <Input
                  id="guardId"
                  type="number"
                  placeholder="Enter guard ID"
                  {...form.register('guardId')}
                />
                {form.formState.errors.guardId && (
                  <p className="text-sm text-destructive">{form.formState.errors.guardId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  {...form.register('startTime')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Additional notes"
                  {...form.register('notes')}
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPatrol.isPending}>
                  {createPatrol.isPending ? 'Scheduling...' : 'Schedule Patrol'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <div className="p-4 border-b bg-muted/20">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by guard or site..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Guard</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredPatrols?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No patrols found.
                </TableCell>
              </TableRow>
            ) : (
              filteredPatrols?.map((patrol) => {
                const total = patrol.checkpointCount || 0;
                const completed = patrol.completedCheckpoints || 0;
                const progressPercentage = total > 0 ? (completed / total) * 100 : 0;
                
                return (
                  <TableRow key={patrol.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{patrol.guardName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{patrol.siteName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {patrol.startTime ? format(new Date(patrol.startTime), 'MMM d, h:mm a') : 'Unscheduled'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{completed} / {total} checkpoints</span>
                          <span>{Math.round(progressPercentage)}%</span>
                        </div>
                        <div className="h-2 w-full max-w-[150px] bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`border-transparent ${getStatusColor(patrol.status)}`}>
                        {getStatusLabel(patrol.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
