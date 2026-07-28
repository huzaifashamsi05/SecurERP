import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Search, Plus, Building2, Mail, Phone, MapPin, MoreHorizontal, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(5, "Phone is required"),
  address: z.string().min(5, "Address is required"),
});

type FormData = z.infer<typeof formSchema>;

export default function CompaniesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      // Mocked implementation for now since the real API might not exist yet
      // return fetch('/api/companies').then(res => res.json());
      
      // Returning mock data to ensure the UI looks good immediately
      return [
        { id: '1', name: 'Acme Security', email: 'admin@acmesecurity.com', phone: '+1 555-0123', address: '123 Main St, NY', status: 'active', createdAt: new Date(Date.now() - 10000000000).toISOString() },
        { id: '2', name: 'Global Guards', email: 'hello@globalguards.net', phone: '+1 555-0124', address: '456 Oak Ave, CA', status: 'active', createdAt: new Date(Date.now() - 20000000000).toISOString() },
        { id: '3', name: 'Safe Shield Inc', email: 'contact@safeshield.co', phone: '+1 555-0125', address: '789 Pine Rd, TX', status: 'suspended', createdAt: new Date(Date.now() - 50000000000).toISOString() },
      ];
    },
  });

  const createCompany = useMutation({
    mutationFn: async (data: FormData) => {
      // return fetch('/api/companies', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // }).then(res => res.json());
      
      return { ...data, id: Math.random().toString(), status: 'active', createdAt: new Date().toISOString() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({ title: 'Company created successfully' });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: 'Failed to create company', variant: 'destructive' });
    }
  });

  const onSubmit = (data: FormData) => {
    createCompany.mutate(data);
  };

  const filteredCompanies = companies?.filter(company => 
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            SaaS Tenants
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage security companies on the platform
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Company</DialogTitle>
              <DialogDescription>
                Create a new tenant workspace for a security company.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    placeholder="Acme Security Ltd" 
                    className="pl-9"
                    {...form.register('name')} 
                  />
                </div>
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="admin@company.com" 
                    className="pl-9"
                    {...form.register('email')} 
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="phone" 
                    placeholder="+1 (555) 000-0000" 
                    className="pl-9"
                    {...form.register('phone')} 
                  />
                </div>
                {form.formState.errors.phone && (
                  <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="address" 
                    placeholder="123 Business Rd, City, State" 
                    className="pl-9"
                    {...form.register('address')} 
                  />
                </div>
                {form.formState.errors.address && (
                  <p className="text-sm text-destructive">{form.formState.errors.address.message}</p>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCompany.isPending}>
                  {createCompany.isPending ? "Creating..." : "Create Tenant"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search companies..." 
              className="pl-9 w-full bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-semibold">Company Name</TableHead>
                <TableHead className="font-semibold">Admin Email</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Joined Date</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Loading companies...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCompanies?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No companies found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies?.map((company) => (
                  <TableRow key={company.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="font-medium text-foreground">{company.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {company.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm text-foreground">
                        <Mail className="h-3 w-3 mr-2 text-muted-foreground" />
                        {company.email}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center mt-1">
                        <Phone className="h-3 w-3 mr-2" />
                        {company.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.status === 'active' ? (
                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">
                          Suspended
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(company.createdAt), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Company</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className={company.status === 'active' ? 'text-destructive' : 'text-emerald-600'}>
                            {company.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
