import { useGetNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetNotificationsQueryKey } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Check, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Notifications() {
  const { data: notifications, isLoading } = useGetNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const queryClient = useQueryClient();

  const handleMarkRead = (id: number) => {
    markRead.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
      }
    });
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey() });
      }
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'incident': return <ShieldAlert className="h-5 w-5 text-destructive" />;
      case 'leave_request': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'system': return <Bell className="h-5 w-5 text-primary" />;
      default: return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Communications Center</h1>
          <p className="text-muted-foreground text-sm mt-1">Review system alerts and operational updates.</p>
        </div>
        <Button variant="outline" className="font-semibold" onClick={handleMarkAllRead} disabled={markAllRead.isPending}>
          <Check className="mr-2 h-4 w-4" /> Mark All as Read
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm overflow-hidden">
        <div className="divide-y divide-border/50">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Loading alerts...</div>
          ) : notifications?.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No notifications at this time.</div>
          ) : (
            notifications?.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 flex gap-4 transition-colors ${!notification.read ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/50'}`}
              >
                <div className="mt-1">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm ${!notification.read ? 'font-bold text-foreground' : 'font-medium text-foreground/80'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${!notification.read ? 'text-foreground/90' : 'text-muted-foreground'}`}>
                    {notification.message}
                  </p>
                </div>
                {!notification.read && (
                  <button 
                    onClick={() => handleMarkRead(notification.id)}
                    className="flex-shrink-0 self-center h-8 w-8 flex items-center justify-center rounded-full hover:bg-primary/20 text-primary"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
