import { useState } from 'react';
import { useGetTrainingSessions, useCreateTrainingSession, getGetTrainingSessionsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, GraduationCap, User, Calendar, MapPin, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

const trainingSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.string().min(1, 'Type is required'),
  instructor: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  location: z.string().optional(),
  maxCapacity: z.coerce.number().optional(),
  description: z.string().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional().default('scheduled'),
});

type TrainingFormValues = z.infer<typeof trainingSchema>;

export default function TrainingSessionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: sessions, isLoading } = useGetTrainingSessions();
  const createSession = useCreateTrainingSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<TrainingFormValues>({
    resolver: zodResolver(trainingSchema),
    defaultValues: {
      title: '',
      type: '',
      instructor: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
      location: '',
      maxCapacity: undefined,
      description: '',
      status: 'scheduled',
    }
  });

  const onSubmit = (data: TrainingFormValues) => {
    createSession.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTrainingSessionsQueryKey() });
        toast({ title: 'Training session scheduled successfully' });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: () => {
        toast({ title: 'Failed to schedule training session', variant: 'destructive' });
      }
    });
  };

  const filteredSessions = sessions?.filter(session => {
    const term = searchTerm.toLowerCase();
    return session.title.toLowerCase().includes(term) ||
           session.type.toLowerCase().includes(term) ||
           (session.instructor && session.instructor.toLowerCase().includes(term));
  }) || [];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed': return <Badge className="bg-emerald-500">Completed</Badge>;
      case 'in_progress': return <Badge className="bg-primary">In Progress</Badge>;
      case 'scheduled': return <Badge className="bg-yellow-500">Scheduled</Badge>;
      case 'cancelled': return <Badge variant="secondary" className="text-muted-foreground">Cancelled</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('firearm')) return <Badge variant="outline" className="text-red-500 border-red-500">Firearms</Badge>;
    if (t.includes('first_aid') || t.includes('first aid')) return <Badge variant="outline" className="text-emerald-500 border-emerald-500">First Aid</Badge>;
    if (t.includes('patrol')) return <Badge variant="outline" className="text-blue-500 border-blue-500">Patrol Techniques</Badge>;
    return <Badge variant="outline">{type}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Programs</h1>
          <p className="text-muted-foreground">Schedule and manage officer training sessions.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Schedule Training
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule Training</DialogTitle>
              <DialogDescription>Create a new training session for officers.</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Program Title</Label>
                  <Input id="title" {...form.register('title')} placeholder="e.g. Basic Firearms Recertification" />
                  {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Training Type</Label>
                  <Input id="type" {...form.register('type')} placeholder="e.g. firearms, first_aid" />
                  {form.formState.errors.type && <p className="text-sm text-destructive">{form.formState.errors.type.message}</p>}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="instructor">Instructor (Optional)</Label>
                <Input id="instructor" {...form.register('instructor')} placeholder="e.g. Sgt. John Smith" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" {...form.register('startDate')} />
                  {form.formState.errors.startDate && <p className="text-sm text-destructive">{form.formState.errors.startDate.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input id="endDate" type="date" {...form.register('endDate')} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input id="location" {...form.register('location')} placeholder="e.g. Main Training Center" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxCapacity">Max Capacity (Optional)</Label>
                  <Input id="maxCapacity" type="number" {...form.register('maxCapacity')} placeholder="e.g. 20" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" {...form.register('description')} placeholder="Details about the training session..." />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createSession.isPending}>
                  {createSession.isPending ? 'Scheduling...' : 'Schedule Training'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <div className="p-4 border-b bg-muted/20">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, type, or instructor..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Program</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Schedule & Location</TableHead>
              <TableHead>Enrollment</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Loading training sessions...
                </TableCell>
              </TableRow>
            ) : filteredSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No training sessions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredSessions.map((session) => (
                <TableRow key={session.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{session.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(session.type)}</TableCell>
                  <TableCell>
                    {session.instructor ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{session.instructor}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {format(new Date(session.startDate), 'MMM d, yyyy')}
                          {session.endDate && ` - ${format(new Date(session.endDate), 'MMM d, yyyy')}`}
                        </span>
                      </div>
                      {session.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{session.location}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {session.enrolledCount}
                        {session.maxCapacity ? ` / ${session.maxCapacity}` : ''}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(session.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
