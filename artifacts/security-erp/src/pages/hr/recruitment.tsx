import { useState } from 'react';
import { useGetApplicants, useCreateApplicant, getGetApplicantsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, UserPlus, Briefcase, Calendar, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

const createApplicantSchema = z.object({
  applicantName: z.string().min(1, 'Applicant name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  position: z.string().min(1, 'Position is required'),
  notes: z.string().optional(),
});

type CreateApplicantValues = z.infer<typeof createApplicantSchema>;

export default function RecruitmentPipelinePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { data: applicants, isLoading } = useGetApplicants();
  const createApplicant = useCreateApplicant();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<CreateApplicantValues>({
    resolver: zodResolver(createApplicantSchema),
    defaultValues: {
      applicantName: '',
      email: '',
      phone: '',
      position: '',
      notes: '',
    },
  });

  const onSubmit = (data: CreateApplicantValues) => {
    createApplicant.mutate(
      {
        data: {
          ...data,
          status: 'applied',
          appliedDate: new Date().toISOString(),
        }
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetApplicantsQueryKey() });
          toast({ title: 'Applicant added successfully' });
          setIsDialogOpen(false);
          form.reset();
        },
        onError: () => {
          toast({ title: 'Failed to add applicant', variant: 'destructive' });
        }
      }
    );
  };

  const filteredApplicants = applicants?.filter((applicant) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      applicant.applicantName.toLowerCase().includes(searchLower) ||
      applicant.email.toLowerCase().includes(searchLower) ||
      applicant.position.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applied':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Applied</Badge>;
      case 'screening':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Screening</Badge>;
      case 'interview':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Interview</Badge>;
      case 'offered':
        return <Badge className="bg-purple-500 hover:bg-purple-600">Offered</Badge>;
      case 'hired':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Hired</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruitment Pipeline</h1>
          <p className="text-muted-foreground">Track and manage applicant hiring process.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Applicant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Applicant</DialogTitle>
              <DialogDescription>
                Enter the details of the new applicant. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="applicantName">Applicant Name</Label>
                <div className="relative">
                  <UserPlus className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="applicantName"
                    className="pl-8"
                    {...form.register('applicantName')}
                  />
                </div>
                {form.formState.errors.applicantName && (
                  <p className="text-sm text-destructive">{form.formState.errors.applicantName.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-8"
                    {...form.register('email')}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <div className="relative">
                  <Briefcase className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="position"
                    placeholder="e.g. Security Guard"
                    className="pl-8"
                    {...form.register('position')}
                  />
                </div>
                {form.formState.errors.position && (
                  <p className="text-sm text-destructive">{form.formState.errors.position.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  {...form.register('notes')}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createApplicant.isPending}>
                  {createApplicant.isPending ? 'Saving...' : 'Save Applicant'}
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
              placeholder="Search applicants..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Applied Date</TableHead>
              <TableHead>Interview Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredApplicants && filteredApplicants.length > 0 ? (
              filteredApplicants.map((applicant) => (
                <TableRow key={applicant.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="font-medium">{applicant.applicantName}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <Mail className="h-3 w-3" /> {applicant.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      {applicant.position}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {applicant.appliedDate ? format(new Date(applicant.appliedDate), 'PP') : 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {applicant.interviewDate ? format(new Date(applicant.interviewDate), 'PP') : 'Not Scheduled'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(applicant.status)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No applicants found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
