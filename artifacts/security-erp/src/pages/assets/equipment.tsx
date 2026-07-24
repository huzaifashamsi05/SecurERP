import { useState } from 'react';
import { useGetEquipment, useCreateEquipment } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetEquipmentQueryKey } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Package, Shield, Radio, MoreHorizontal } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const createEquipmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  serialNumber: z.string().optional(),
  condition: z.string().optional(),
});

type CreateEquipmentValues = z.infer<typeof createEquipmentSchema>;

export default function Equipment() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: equipment, isLoading } = useGetEquipment();
  const createEquipment = useCreateEquipment();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<CreateEquipmentValues>({
    resolver: zodResolver(createEquipmentSchema),
    defaultValues: { name: '', type: '', serialNumber: '', condition: 'new' }
  });

  const onSubmit = (data: CreateEquipmentValues) => {
    createEquipment.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetEquipmentQueryKey() });
        toast({ title: 'Equipment registered successfully' });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: () => {
        toast({ title: 'Failed to register equipment', variant: 'destructive' });
      }
    });
  };

  const filteredEquipment = equipment?.filter(e => 
    e.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('radio') || t.includes('comms')) return <Radio className="h-4 w-4" />;
    if (t.includes('uniform') || t.includes('vest')) return <Shield className="h-4 w-4" />;
    return <Package className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipment Inventory</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage operational gear and assignments.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold"><Plus className="mr-2 h-4 w-4" /> Add Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register Equipment</DialogTitle>
              <DialogDescription>Add a new item to the operational inventory.</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Item Name</Label>
                <Input id="name" placeholder="e.g. Motorola Two-Way Radio" {...form.register('name')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Category Type</Label>
                  <Input id="type" placeholder="communications, uniform, etc." {...form.register('type')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input id="serialNumber" className="font-mono uppercase" {...form.register('serialNumber')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Initial Condition</Label>
                <Input id="condition" placeholder="new, good, fair" {...form.register('condition')} />
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createEquipment.isPending}>Register Item</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search inventory..." className="pl-9 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Serial/ID</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading inventory...</TableCell></TableRow>
              ) : filteredEquipment?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No items found.</TableCell></TableRow>
              ) : (
                filteredEquipment?.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                          {getTypeIcon(item.type)}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center justify-center bg-muted text-foreground font-mono font-medium rounded px-2 py-1 text-xs tracking-wider">
                        {item.serialNumber || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{item.assignedToName || <span className="text-muted-foreground italic">In Storage</span>}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm capitalize">{item.condition || 'Unknown'}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${
                        item.status === 'assigned' ? 'bg-primary/10 text-primary border-primary/20' : 
                        item.status === 'unassigned' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        'bg-destructive/10 text-destructive border-destructive/20'
                      }`}>
                        {item.status}
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
