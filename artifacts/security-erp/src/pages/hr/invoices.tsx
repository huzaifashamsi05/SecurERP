import { useState } from 'react';
import { useGetInvoices, useCreateInvoice } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetInvoicesQueryKey } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, FileText, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const createInvoiceSchema = z.object({
  clientId: z.coerce.number().min(1, 'Client ID is required'),
  invoiceNumber: z.string().min(1, 'Invoice Number is required'),
  period: z.string().optional(),
  amount: z.coerce.number().min(0, 'Amount must be positive'),
  tax: z.coerce.number().min(0, 'Tax must be positive').optional(),
  dueDate: z.string().min(1, 'Due date is required'),
});

type CreateInvoiceValues = z.infer<typeof createInvoiceSchema>;

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: invoices, isLoading } = useGetInvoices();
  const createInvoice = useCreateInvoice();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<CreateInvoiceValues>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: { clientId: 0, invoiceNumber: '', period: '', amount: 0, tax: 0, dueDate: '' }
  });

  const onSubmit = (data: CreateInvoiceValues) => {
    const formattedData = {
      ...data,
      dueDate: new Date(data.dueDate).toISOString()
    };
    createInvoice.mutate({ data: formattedData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetInvoicesQueryKey() });
        toast({ title: 'Invoice generated successfully' });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: () => {
        toast({ title: 'Failed to generate invoice', variant: 'destructive' });
      }
    });
  };

  const filteredInvoices = invoices?.filter(i => 
    i.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts Receivable</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage client invoicing and collections.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold"><Plus className="mr-2 h-4 w-4" /> Generate Invoice</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate New Invoice</DialogTitle>
              <DialogDescription>Create a new invoice for client billing.</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Invoice Number</Label>
                  <Input id="invoiceNumber" {...form.register('invoiceNumber')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input id="clientId" type="number" {...form.register('clientId')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="period">Billing Period</Label>
                  <Input id="period" placeholder="e.g. Oct 2023" {...form.register('period')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" type="date" {...form.register('dueDate')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Subtotal</Label>
                  <Input id="amount" type="number" step="0.01" {...form.register('amount')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax">Tax Amount</Label>
                  <Input id="tax" type="number" step="0.01" {...form.register('tax')} />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={createInvoice.isPending}>Generate Invoice</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search invoices..." className="pl-9 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Invoice No.</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading invoices...</TableCell></TableRow>
              ) : filteredInvoices?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No invoices found.</TableCell></TableRow>
              ) : (
                filteredInvoices?.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono font-medium text-foreground">{invoice.invoiceNumber}</span>
                      </div>
                      {invoice.period && <p className="text-xs text-muted-foreground mt-0.5">Period: {invoice.period}</p>}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-foreground">{invoice.clientName || `Client #${invoice.clientId}`}</span>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-muted-foreground">
                      {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-foreground">
                      {formatCurrency(invoice.totalAmount || (invoice.amount + (invoice.tax || 0)))}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${
                        invoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        invoice.status === 'overdue' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                        'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                      }`}>
                        {invoice.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Download className="h-4 w-4 text-muted-foreground" />
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
