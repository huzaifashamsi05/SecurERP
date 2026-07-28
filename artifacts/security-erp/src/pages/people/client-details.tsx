import { useRoute } from 'wouter';
import { useGetClient, useGetSites, useGetIncidents } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from 'wouter';
import { ArrowLeft, Building2, Mail, Phone, MapPin, User, Shield, AlertTriangle, Globe } from 'lucide-react';
import { format } from 'date-fns';

export default function ClientDetails() {
  const [, params] = useRoute('/clients/:id');
  const clientId = Number(params?.id);

  const { data: client, isLoading } = useGetClient(clientId);
  const { data: sites } = useGetSites({ clientId });
  const { data: allIncidents } = useGetIncidents();

  // Filter incidents related to this client's sites
  const clientSiteIds = sites?.map(s => s.id) ?? [];
  const clientIncidents = allIncidents?.filter(i => clientSiteIds.includes(i.siteId)) ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading client data...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Client Not Found</h2>
          <p className="text-muted-foreground">The requested client record does not exist.</p>
          <Link href="/clients">
            <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'inactive': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/20 border';
      case 'low': return 'bg-blue-500/10 text-blue-600 border-blue-500/20 border';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Client Details</h1>
          <p className="text-muted-foreground text-sm mt-1">Client profile and associated operations.</p>
        </div>
      </div>

      {/* Client Profile Card */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Building2 className="h-10 w-10" />
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h2 className="text-xl font-bold text-foreground">{client.name}</h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${getStatusColor(client.status)}`}>
                  {client.status}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{client.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Contact:</span>
                  <span className="font-medium text-foreground">{client.contactPerson || 'N/A'}</span>
                </div>
                {client.industry && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Industry:</span>
                    <span className="font-medium text-foreground">{client.industry}</span>
                  </div>
                )}
                {client.address && (
                  <div className="flex items-center gap-2 text-sm col-span-2">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground">{client.address}</span>
                  </div>
                )}
              </div>

              {/* Summary Stats */}
              <div className="flex gap-6 pt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{sites?.length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Sites</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{sites?.reduce((sum, s) => sum + (s.guardCount ?? 0), 0) ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Guards Deployed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{clientIncidents.length}</p>
                  <p className="text-xs text-muted-foreground">Incidents</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sites */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-muted/20 border-b border-border/50 py-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Sites
            {sites && <span className="text-xs text-muted-foreground font-normal">({sites.length} locations)</span>}
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Site Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Guards</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!sites || sites.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground">No sites registered.</TableCell></TableRow>
              ) : (
                sites.map((site) => (
                  <TableRow key={site.id} className="hover:bg-muted/30">
                    <TableCell className="font-semibold text-foreground">{site.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{site.address}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{site.guardCount ?? 0} / {site.requiredGuards ?? '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider ${getStatusColor(site.status)}`}>
                        {site.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Recent Incidents */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="bg-muted/20 border-b border-border/50 py-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            Recent Incidents
            <span className="text-xs text-muted-foreground font-normal">({clientIncidents.length} total)</span>
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientIncidents.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-20 text-center text-muted-foreground">No incidents recorded.</TableCell></TableRow>
              ) : (
                clientIncidents.slice(0, 10).map((incident) => (
                  <TableRow key={incident.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-medium text-foreground">{incident.type}</div>
                      <div className="text-xs text-muted-foreground max-w-[200px] truncate">{incident.description}</div>
                    </TableCell>
                    <TableCell className="text-sm">{incident.siteName || `Site #${incident.siteId}`}</TableCell>
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
