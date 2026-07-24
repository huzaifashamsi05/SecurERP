import { useState } from 'react';
import { useGetIncidents, useCreateIncident } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetIncidentsQueryKey } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const createIncidentSchema = z.object({
  siteId: z.coerce.number().min(1, 'Site ID is required'),
  guardId: z.coerce.number().min(1, 'Guard ID is required'),
  type: z.string().min(1, 'Type is required'),
  severity: z.string().min(1, 'Severity is required'),
  description: z.string().min(1, 'Description is required'),
});

type CreateIncidentValues = z.infer<typeof createIncidentSchema>;

export default function Incidents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: incidents, isLoading } = useGetIncidents();
  const createIncident = useCreateIncident();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<CreateIncidentValues>({
    resolver: zodResolver(createIncidentSchema),
    defaultValues: { siteId: 0, guardId: 0, type: '', severity: 'medium', description: '' }
  });

  const onSubmit = (data: CreateIncidentValues) => {
    createIncident.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetIncidentsQueryKey() });
        toast({ title: 'Incident logged successfully' });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: () => {
        toast({ title: 'Failed to log incident', variant: 'destructive' });
      }
    });
  };

  const filteredIncidents = incidents?.filter(i => 
    i.type?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.siteName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityBadge = (severity: string) => {
    switch(severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/20 border';
      case 'low': return 'bg-blue-500/10 text-blue-600 border-blue-500/20 border';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Incident Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage operational events.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold bg-destructive hover:bg-destructive/90 text-destructive-foreground"><ShieldAlert className="mr-2 h-4 w-4" /> Log Incident</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Incident</DialogTitle>
              <DialogDescription>Submit an official incident report.</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteId">Site ID</Label>
                  <Input id="siteId" type="number" {...form.register('siteId')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardId">Reporting Guard ID</Label>
                  <Input id="guardId" type="number" {...form.register('guardId')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Incident Type</Label>
                  <Input id="type" placeholder="e.g. Intrusion, Vandalism" {...form.register('type')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Input id="severity" placeholder="critical, high, medium, low" {...form.register('severity')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" {...form.register('description')} />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createIncident.isPending}>Submit Report</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search incidents..." className="pl-9 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading incidents...</TableCell></TableRow>
              ) : filteredIncidents?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No incidents reported.</TableCell></TableRow>
              ) : (
                filteredIncidents?.map((incident) => (
                  <TableRow key={incident.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-muted-foreground text-xs">#{incident.id}</TableCell>
                    <TableCell>
                      <div className="font-medium text-foreground">{incident.type}</div>
                      <div className="text-xs text-muted-foreground max-w-[200px] truncate">{incident.description}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{incident.siteName || `Site #${incident.siteId}`}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getSeverityBadge(incident.severity)}`}>
                        {incident.severity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${
                        incident.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                      }`}>
                        {incident.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(incident.reportedAt), 'MMM d, HH:mm')}
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
