import { useState } from 'react';
import { useGetVehicles, useCreateVehicle } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetVehiclesQueryKey } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Truck, Wrench, MoreHorizontal } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const createVehicleSchema = z.object({
  registration: z.string().min(1, 'Registration is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce.number().optional(),
  mileage: z.coerce.number().optional(),
});

type CreateVehicleValues = z.infer<typeof createVehicleSchema>;

export default function Vehicles() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: vehicles, isLoading } = useGetVehicles();
  const createVehicle = useCreateVehicle();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<CreateVehicleValues>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: { registration: '', make: '', model: '', year: new Date().getFullYear(), mileage: 0 }
  });

  const onSubmit = (data: CreateVehicleValues) => {
    createVehicle.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetVehiclesQueryKey() });
        toast({ title: 'Vehicle registered successfully' });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: () => {
        toast({ title: 'Failed to register vehicle', variant: 'destructive' });
      }
    });
  };

  const filteredVehicles = vehicles?.filter(v => 
    v.registration?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fleet Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage operational vehicles and maintenance.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold"><Plus className="mr-2 h-4 w-4" /> Add Vehicle</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register Vehicle</DialogTitle>
              <DialogDescription>Add a new vehicle to the operational fleet.</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="registration">Registration / Plate Number</Label>
                <Input id="registration" className="font-mono uppercase" {...form.register('registration')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make</Label>
                  <Input id="make" {...form.register('make')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" {...form.register('model')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input id="year" type="number" {...form.register('year')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mileage">Current Mileage</Label>
                  <Input id="mileage" type="number" {...form.register('mileage')} />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createVehicle.isPending}>Register Vehicle</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search fleet..." className="pl-9 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead>Mileage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading fleet data...</TableCell></TableRow>
              ) : filteredVehicles?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No vehicles found.</TableCell></TableRow>
              ) : (
                filteredVehicles?.map((vehicle) => (
                  <TableRow key={vehicle.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary"><Truck className="h-5 w-5" /></div>
                        <div>
                          <p className="font-semibold text-foreground">{vehicle.make} {vehicle.model}</p>
                          <p className="text-xs text-muted-foreground">{vehicle.year}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center justify-center bg-muted text-foreground font-mono font-bold rounded border px-2 py-1 text-sm tracking-wider">
                        {vehicle.registration}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{vehicle.assignedToName || 'Unassigned'}</span>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {vehicle.mileage?.toLocaleString() || 0} mi
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${
                        vehicle.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        vehicle.status === 'maintenance' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : 
                        'bg-destructive/10 text-destructive border-destructive/20'
                      }`}>
                        {vehicle.status === 'maintenance' && <Wrench className="w-3 h-3 mr-1" />}
                        {vehicle.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
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
