import { useState } from 'react';
import { useGetExpenses, useUpdateExpense } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetExpensesQueryKey } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Check, X, FileText, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Expenses() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: expenses, isLoading } = useGetExpenses();
  const updateExpense = useUpdateExpense();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAction = (id: number, status: 'approved' | 'rejected') => {
    updateExpense.mutate({ id, data: { status } }, {
      onSuccess: () => {
        queryClient.setQueryData(getGetExpensesQueryKey(), (old: any) => {
          if (!old) return old;
          return old.map((r: any) => r.id === id ? { ...r, status } : r);
        });
        toast({ title: `Expense ${status}` });
      },
      onError: () => {
        toast({ title: 'Failed to update expense', variant: 'destructive' });
      }
    });
  };

  const filteredExpenses = expenses?.filter(e => 
    e.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.submittedByName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expense Claims</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and process operational expenses.</p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search claims..." className="pl-9 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Category & Details</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading expenses...</TableCell></TableRow>
              ) : filteredExpenses?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No expense claims found.</TableCell></TableRow>
              ) : (
                filteredExpenses?.map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(expense.date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">{expense.submittedByName || `User #${expense.submittedBy}`}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="capitalize">{expense.category.replace('_', ' ')}</span>
                      </div>
                      <p className="text-xs text-muted-foreground max-w-[200px] truncate mt-0.5">{expense.description || 'No description provided'}</p>
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-foreground">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${
                        expense.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        expense.status === 'rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                        expense.status === 'paid' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                        'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                      }`}>
                        {expense.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {expense.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleAction(expense.id, 'rejected')}>
                            <X className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-600" onClick={() => handleAction(expense.id, 'approved')}>
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
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
