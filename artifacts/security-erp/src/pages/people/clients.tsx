import { useState } from 'react';
import { useGetClients, useCreateClient } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetClientsQueryKey } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Briefcase, Mail, Phone, MoreHorizontal } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  contactPerson: z.string().optional(),
  industry: z.string().optional(),
});

type CreateClientValues = z.infer<typeof createClientSchema>;

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: clients, isLoading } = useGetClients();
  const createClient = useCreateClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<CreateClientValues>({
    resolver: zodResolver(createClientSchema),
    defaultValues: { name: '', email: '', phone: '', contactPerson: '', industry: '' }
  });

  const onSubmit = (data: CreateClientValues) => {
    createClient.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetClientsQueryKey() });
        toast({ title: 'Client created successfully' });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: () => {
        toast({ title: 'Failed to create client', variant: 'destructive' });
      }
    });
  };

  const filteredClients = clients?.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Client Portfolio</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage accounts and contracts.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold"><Plus className="mr-2 h-4 w-4" /> Add Client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>Register a new corporate account.</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <Input id="name" {...form.register('name')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Primary Contact</Label>
                <Input id="contactPerson" {...form.register('contactPerson')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...form.register('email')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" {...form.register('phone')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" {...form.register('industry')} />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createClient.isPending}>Save Client</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search clients..." className="pl-9 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Sites</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center">Loading clients...</TableCell></TableRow>
              ) : filteredClients?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No clients found.</TableCell></TableRow>
              ) : (
                filteredClients?.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary"><Briefcase className="h-5 w-5" /></div>
                        <div>
                          <p className="font-semibold text-foreground">{client.name}</p>
                          <p className="text-xs text-muted-foreground">{client.industry || 'Unknown Industry'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium text-foreground">{client.contactPerson || 'No contact assigned'}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          {client.email && <span className="flex items-center"><Mail className="h-3 w-3 mr-1" />{client.email}</span>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center justify-center bg-muted text-muted-foreground font-mono font-medium rounded px-2 py-1 text-xs">
                        {client.siteCount || 0} Sites
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${client.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted text-muted-foreground'}`}>
                        {client.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/clients/${client.id}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-accent hover:text-accent-foreground h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
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
