import { useState, useMemo } from 'react';
import { useGetDailyReports, useCreateDailyReport, getGetDailyReportsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, FileText, User, MapPin, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  guardId: z.coerce.number().min(1, "Guard ID is required"),
  siteId: z.coerce.number().min(1, "Site ID is required"),
  date: z.string().min(1, "Date is required"),
  summary: z.string().min(1, "Summary is required"),
  activities: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function DailyReportsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: reports, isLoading } = useGetDailyReports();
  const createDailyReport = useCreateDailyReport();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      guardId: 0,
      siteId: 0,
      date: format(new Date(), 'yyyy-MM-dd'),
      summary: '',
      activities: '',
    }
  });

  const onSubmit = (data: FormValues) => {
    createDailyReport.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDailyReportsQueryKey() });
        toast({ title: 'Report created successfully' });
        setIsDialogOpen(false);
        form.reset();
      },
      onError: () => {
        toast({ title: 'Failed to create report', variant: 'destructive' });
      }
    });
  };

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    const lowerSearch = searchTerm.toLowerCase();
    return reports.filter(report => 
      report.guardName?.toLowerCase().includes(lowerSearch) ||
      report.siteName?.toLowerCase().includes(lowerSearch) ||
      report.summary?.toLowerCase().includes(lowerSearch)
    );
  }, [reports, searchTerm]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'reviewed':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent">Reviewed</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-transparent">Submitted</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white border-transparent">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Daily Activity Reports</h1>
          <p className="text-muted-foreground mt-1">Review guard shift reports and summaries.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Report</DialogTitle>
              <DialogDescription>
                Submit a new daily activity report. Fill out all required fields.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="guardId">Guard ID</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="guardId" 
                    type="number" 
                    className="pl-9" 
                    {...form.register('guardId')} 
                  />
                </div>
                {form.formState.errors.guardId && (
                  <p className="text-sm text-destructive">{form.formState.errors.guardId.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="siteId">Site ID</Label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="siteId" 
                    type="number" 
                    className="pl-9" 
                    {...form.register('siteId')} 
                  />
                </div>
                {form.formState.errors.siteId && (
                  <p className="text-sm text-destructive">{form.formState.errors.siteId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="date" 
                    type="date" 
                    className="pl-9" 
                    {...form.register('date')} 
                  />
                </div>
                {form.formState.errors.date && (
                  <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Summary</Label>
                <div className="relative">
                  <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="summary" 
                    className="pl-9" 
                    placeholder="Brief summary of the shift"
                    {...form.register('summary')} 
                  />
                </div>
                {form.formState.errors.summary && (
                  <p className="text-sm text-destructive">{form.formState.errors.summary.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="activities">Activities (Optional)</Label>
                <Input 
                  id="activities" 
                  placeholder="Detailed activities..."
                  {...form.register('activities')} 
                />
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createDailyReport.isPending}>
                  {createDailyReport.isPending ? 'Saving...' : 'Save Report'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <div className="p-4 border-b bg-muted/20">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              className="pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Guard</TableHead>
              <TableHead>Site</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">Loading...</TableCell>
              </TableRow>
            ) : filteredReports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No reports found.
                </TableCell>
              </TableRow>
            ) : (
              filteredReports.map((report) => (
                <TableRow key={report.id} className="hover:bg-muted/30">
                  <TableCell className="whitespace-nowrap">
                    {report.date ? format(parseISO(report.date), 'MMM d, yyyy') : 'N/A'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {report.guardName || report.guardId}
                  </TableCell>
                  <TableCell>
                    {report.siteName || report.siteId}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {report.summary}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(report.status || 'draft')}
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
