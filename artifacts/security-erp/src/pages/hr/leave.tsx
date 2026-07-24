import { useState } from 'react';
import { useGetLeaveRequests, useUpdateLeaveRequest } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetLeaveRequestsQueryKey } from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Check, X, CalendarOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function Leave() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: leaveRequests, isLoading } = useGetLeaveRequests();
  const updateLeave = useUpdateLeaveRequest();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAction = (id: number, status: 'approved' | 'rejected') => {
    updateLeave.mutate({ id, data: { status } }, {
      onSuccess: () => {
        queryClient.setQueryData(getGetLeaveRequestsQueryKey(), (old: any) => {
          if (!old) return old;
          return old.map((r: any) => r.id === id ? { ...r, status } : r);
        });
        toast({ title: `Leave request ${status}` });
      },
      onError: () => {
        toast({ title: 'Failed to update request', variant: 'destructive' });
      }
    });
  };

  const filteredRequests = leaveRequests?.filter(l => 
    l.guardName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leave Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Review and approve absence requests.</p>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search personnel..." className="pl-9 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Officer</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">Loading requests...</TableCell></TableRow>
              ) : filteredRequests?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No leave requests found.</TableCell></TableRow>
              ) : (
                filteredRequests?.map((request) => (
                  <TableRow key={request.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-semibold text-foreground">{request.guardName || `Guard #${request.guardId}`}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <CalendarOff className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="capitalize">{request.type.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {format(new Date(request.startDate), 'MMM d')} - {format(new Date(request.endDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-foreground max-w-[200px] truncate" title={request.reason || ''}>{request.reason || '-'}</p>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${
                        request.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                        request.status === 'rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                        'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                      }`}>
                        {request.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {request.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleAction(request.id, 'rejected')}>
                            <X className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-600" onClick={() => handleAction(request.id, 'approved')}>
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
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
