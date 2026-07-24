import { useState } from 'react';
import { useGetSites, useCreateSite } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetSitesQueryKey } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, MapPin, Building, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const createSiteSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  clientId: z.coerce.number().min(1, 'Client is required'),
  address: z.string().min(1, 'Address is required'),
  requiredGuards: z.coerce.number().min(1, 'Required guards count is required'),
});

type CreateSiteValues = z.infer<typeof createSiteSchema>;

export default function Sites() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: sites, isLoading } = useGetSites();
  const createSite = useCreateSite();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<CreateSiteValues>({
    resolver: zodResolver(createSiteSchema),
    defaultValues: { name: '', clientId: 0, address: '', requiredGuards: 1 }
  });

  const onSubmit = (data: CreateSiteValues) => {
    createSite.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSitesQueryKey() });
        toast({ title: 'Site created successfully' });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: () => {
        toast({ title: 'Failed to create site', variant: 'destructive' });
      }
    });
  };

  const filteredSites = sites?.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Active Sites</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage client locations and deployments.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold"><Plus className="mr-2 h-4 w-4" /> Add Site</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Site</DialogTitle>
              <DialogDescription>Register a new operational location.</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Site Name</Label>
                <Input id="name" {...form.register('name')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID</Label>
                <Input id="clientId" type="number" {...form.register('clientId')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...form.register('address')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requiredGuards">Required Guards</Label>
                <Input id="requiredGuards" type="number" {...form.register('requiredGuards')} />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createSite.isPending}>Save Site</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search sites..." className="pl-9 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Deployment</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center">Loading sites...</TableCell></TableRow>
              ) : filteredSites?.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No sites found.</TableCell></TableRow>
              ) : (
                filteredSites?.map((site) => (
                  <TableRow key={site.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary"><MapPin className="h-5 w-5" /></div>
                        <div>
                          <p className="font-semibold text-foreground">{site.name}</p>
                          <p className="text-xs text-muted-foreground max-w-[250px] truncate">{site.address}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{site.clientName || `Client #${site.clientId}`}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{site.guardCount || 0}</span>
                        <span className="text-muted-foreground">/ {site.requiredGuards || 0} deployed</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${site.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-muted text-muted-foreground'}`}>
                        {site.status}
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
