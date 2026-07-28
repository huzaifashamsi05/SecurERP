import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, User, Phone, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const staffSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.string().min(1, 'Role is required'),
  phone: z.string().min(5, 'Phone is required'),
});

type StaffFormValues = z.infer<typeof staffSchema>;

// Mock type for the staff user
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  phone: string;
  createdAt: string;
};

export default function StaffManagementPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: '',
      phone: '',
    },
  });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['users', 'staff'],
    queryFn: async () => {
      const res = await fetch('/api/users?type=staff');
      if (!res.ok) throw new Error('Failed to fetch staff');
      return res.json();
    },
  });

  const createStaff = useMutation({
    mutationFn: async (data: StaffFormValues) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, type: 'staff' }),
      });
      if (!res.ok) throw new Error('Failed to create staff');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'staff'] });
      toast({ title: 'Staff member created successfully.' });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: 'Failed to create staff member', variant: 'destructive' });
    },
  });

  const onSubmit = (data: StaffFormValues) => {
    createStaff.mutate(data);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase()) || 
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'company_admin': return <Badge className="bg-purple-500/10 text-purple-700 hover:bg-purple-500/20">Admin</Badge>;
      case 'operations_manager': return <Badge className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20">Ops Manager</Badge>;
      case 'hr_manager': return <Badge className="bg-pink-500/10 text-pink-700 hover:bg-pink-500/20">HR Manager</Badge>;
      case 'finance_manager': return <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20">Finance</Badge>;
      case 'field_supervisor': return <Badge className="bg-orange-500/10 text-orange-700 hover:bg-orange-500/20">Supervisor</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return <Badge className="bg-emerald-500">Active</Badge>;
      case 'pending': return <Badge className="bg-yellow-500">Pending</Badge>;
      case 'inactive': return <Badge variant="secondary">Inactive</Badge>;
      default: return <Badge>{status || 'Unknown'}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground mt-1 text-lg">Manage your internal team members.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Staff Member</DialogTitle>
              <DialogDescription>
                Create a new internal staff account. They will receive an email to set up their password.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...form.register('name')} placeholder="Jane Doe" />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" {...form.register('email')} placeholder="jane@company.com" />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password</Label>
                <Input id="password" type="password" {...form.register('password')} />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select onValueChange={(val) => form.setValue('role', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="company_admin">Company Admin</SelectItem>
                    <SelectItem value="operations_manager">Operations Manager</SelectItem>
                    <SelectItem value="hr_manager">HR Manager</SelectItem>
                    <SelectItem value="finance_manager">Finance Manager</SelectItem>
                    <SelectItem value="field_supervisor">Field Supervisor</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.role && (
                  <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" {...form.register('phone')} placeholder="+1 (555) 000-0000" />
                {form.formState.errors.phone && (
                  <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                )}
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createStaff.isPending}>
                  {createStaff.isPending ? 'Creating...' : 'Create Staff Member'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-muted/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[300px]">Staff Member</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading staff...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No staff members found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate">{user.name}</div>
                          <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{user.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm whitespace-nowrap">
                      {user.createdAt ? format(new Date(user.createdAt), 'MMM d, yyyy') : 'N/A'}
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
