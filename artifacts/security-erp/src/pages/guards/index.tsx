import { useState } from 'react';
import { useGetGuards, useCreateGuard, Guard } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetGuardsQueryKey } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Shield,
  MapPin,
  Clock,
  Filter
} from 'lucide-react';
import { Link } from 'wouter';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const createGuardSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  phone: z.string().optional(),
  licenseNumber: z.string().optional(),
});

type CreateGuardValues = z.infer<typeof createGuardSchema>;

export default function Guards() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: guards, isLoading } = useGetGuards();
  const createGuard = useCreateGuard();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<CreateGuardValues>({
    resolver: zodResolver(createGuardSchema),
    defaultValues: {
      name: '',
      email: '',
      employeeId: '',
      phone: '',
      licenseNumber: '',
    }
  });

  const onSubmit = (data: CreateGuardValues) => {
    createGuard.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetGuardsQueryKey() });
        toast({ title: 'Guard created successfully' });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: () => {
        toast({ title: 'Failed to create guard', variant: 'destructive' });
      }
    });
  };

  const filteredGuards = guards?.filter(g => 
    g.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'on_leave': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'inactive': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Personnel Roster</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage security officers and deployments.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold">
              <Plus className="mr-2 h-4 w-4" /> Add Personnel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Personnel</DialogTitle>
              <DialogDescription>
                Enter the details of the new security officer.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" {...form.register('name')} />
                    {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Badge/Emp ID</Label>
                    <Input id="employeeId" {...form.register('employeeId')} />
                    {form.formState.errors.employeeId && <p className="text-xs text-destructive">{form.formState.errors.employeeId.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" {...form.register('email')} />
                  {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...form.register('phone')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">SIA/License #</Label>
                    <Input id="licenseNumber" {...form.register('licenseNumber')} />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createGuard.isPending}>
                  {createGuard.isPending ? 'Saving...' : 'Save Personnel'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID..."
              className="pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" className="w-full sm:w-auto font-medium">
            <Filter className="mr-2 h-4 w-4" /> Filter
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[300px]">Officer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Assignment</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">Loading roster...</TableCell>
                </TableRow>
              ) : filteredGuards?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No personnel found.</TableCell>
                </TableRow>
              ) : (
                filteredGuards?.map((guard) => (
                  <TableRow key={guard.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">
                          {guard.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{guard.name}</p>
                          <p className="text-xs font-mono text-muted-foreground">ID: {guard.employeeId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(guard.status)} uppercase tracking-wider`}>
                        {guard.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      {guard.siteId ? (
                        <div className="flex items-center text-sm text-foreground">
                          <MapPin className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                          {guard.siteName || `Site #${guard.siteId}`}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="text-foreground">{guard.phone || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{guard.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/guards/${guard.id}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Link>
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
