import { useState } from 'react';
import { useGetPayrolls } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, DollarSign, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function Payroll() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: payrolls, isLoading } = useGetPayrolls();

  const filteredPayrolls = payrolls?.filter(p => 
    p.guardName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.period?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage employee compensation and disbursements.</p>
        </div>
        <Button className="font-semibold bg-emerald-600 hover:bg-emerald-700 text-white">
          <DollarSign className="mr-2 h-4 w-4" /> Run Payroll
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b border-border/50 bg-muted/20 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search employee..." className="pl-9 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Base</TableHead>
                <TableHead className="text-right">Adj.</TableHead>
                <TableHead className="text-right">Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Payslip</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center">Loading payroll...</TableCell></TableRow>
              ) : filteredPayrolls?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No records found.</TableCell></TableRow>
              ) : (
                filteredPayrolls?.map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-muted-foreground">{record.period}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-foreground">{record.guardName || `Guard #${record.guardId}`}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{formatCurrency(record.basicSalary)}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatCurrency((record.allowances || 0) - (record.deductions || 0))}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-foreground">
                      {formatCurrency(record.netSalary)}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${
                        record.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                      }`}>
                        {record.status}
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
