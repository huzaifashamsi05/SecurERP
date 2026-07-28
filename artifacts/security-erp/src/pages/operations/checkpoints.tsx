import { useState } from 'react';
import { useGetCheckpoints, useCreateCheckpoint, getGetCheckpointsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, MapPin, QrCode, Crosshair } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const checkpointSchema = z.object({
  siteId: z.coerce.number().min(1, 'Site is required'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type CheckpointFormValues = z.infer<typeof checkpointSchema>;

export default function CheckpointsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: checkpoints, isLoading } = useGetCheckpoints();
  const createCheckpoint = useCreateCheckpoint();

  const form = useForm<CheckpointFormValues>({
    resolver: zodResolver(checkpointSchema),
    defaultValues: {
      siteId: 0,
      name: '',
      description: '',
      latitude: '',
      longitude: '',
    },
  });

  const onSubmit = (values: CheckpointFormValues) => {
    createCheckpoint.mutate(
      {
        data: {
          siteId: values.siteId,
          name: values.name,
          description: values.description,
          latitude: values.latitude ? parseFloat(values.latitude) : undefined,
          longitude: values.longitude ? parseFloat(values.longitude) : undefined,
          status: 'active',
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCheckpointsQueryKey() });
          toast({ title: 'Checkpoint created successfully' });
          setIsDialogOpen(false);
          form.reset();
        },
        onError: () => {
          toast({ title: 'Failed to create checkpoint', variant: 'destructive' });
        },
      }
    );
  };

  const filteredCheckpoints = checkpoints?.filter((cp) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      cp.name.toLowerCase().includes(searchLower) ||
      ((cp as any).siteName || '').toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Checkpoints</h1>
          <p className="text-muted-foreground">Manage patrol checkpoint locations.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Checkpoint
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Checkpoint</DialogTitle>
              <DialogDescription>
                Create a new checkpoint for a site. Fill out the details below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteId">Site ID</Label>
                <Input id="siteId" type="number" {...form.register('siteId')} />
                {form.formState.errors.siteId && (
                  <p className="text-sm text-destructive">{form.formState.errors.siteId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Checkpoint Name</Label>
                <Input id="name" {...form.register('name')} />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" {...form.register('description')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input id="latitude" placeholder="e.g. 40.7128" {...form.register('latitude')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input id="longitude" placeholder="e.g. -74.0060" {...form.register('longitude')} />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button type="submit" disabled={createCheckpoint.isPending}>
                  {createCheckpoint.isPending ? 'Creating...' : 'Create Checkpoint'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <div className="border-b bg-muted/20 p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search checkpoints..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Checkpoint Name</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Coordinates</TableHead>
              <TableHead>QR Code</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredCheckpoints?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No checkpoints found.
                </TableCell>
              </TableRow>
            ) : (
              filteredCheckpoints?.map((checkpoint) => (
                <TableRow key={checkpoint.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {checkpoint.name}
                    </div>
                  </TableCell>
                  <TableCell>{(checkpoint as any).siteName || 'N/A'}</TableCell>
                  <TableCell>
                    {checkpoint.latitude && checkpoint.longitude ? (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Crosshair className="h-3 w-3" />
                        {checkpoint.latitude}, {checkpoint.longitude}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic text-sm">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {checkpoint.qrCode ? (
                      <Badge variant="outline" className="gap-1">
                        <QrCode className="h-3 w-3" /> Assigned
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        checkpoint.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200'
                          : 'bg-muted text-muted-foreground'
                      }
                      variant="outline"
                    >
                      {checkpoint.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
