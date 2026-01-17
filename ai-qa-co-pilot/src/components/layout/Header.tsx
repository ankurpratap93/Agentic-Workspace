import { Bell, Search, User, Settings, LogOut, Mail, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Azure Sync Completed',
    message: '234 bugs successfully synced to Azure DevOps',
    time: '2 minutes ago',
    read: false,
  },
  {
    id: '2',
    type: 'info',
    title: 'New Test Cases Generated',
    message: '15 test cases generated from Figma design',
    time: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    type: 'warning',
    title: 'Agent Error',
    message: 'Test Case Generator Agent encountered an error',
    time: '3 hours ago',
    read: true,
  },
  {
    id: '4',
    type: 'success',
    title: 'Test Case Approved',
    message: 'Test case TC-001 has been approved by QA team',
    time: '5 hours ago',
    read: true,
  },
  {
    id: '5',
    type: 'info',
    title: 'Bug Resolved',
    message: 'Bug BUG-123 has been marked as resolved',
    time: '1 day ago',
    read: true,
  },
  {
    id: '6',
    type: 'error',
    title: 'Sync Failed',
    message: 'Failed to sync 3 bugs to Azure DevOps. Please retry.',
    time: '2 days ago',
    read: false,
  },
  {
    id: '7',
    type: 'info',
    title: 'Weekly Report',
    message: 'Weekly test execution report is ready for review',
    time: '3 days ago',
    read: true,
  },
];

export function Header({ title, subtitle }: HeaderProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const displayedNotifications = showAllNotifications 
    ? notifications 
    : notifications.slice(0, 5);
  
  const hasMoreNotifications = notifications.length > 5;

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'info':
        return <Info className="h-4 w-4 text-info" />;
    }
  };

  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const getUserEmail = () => {
    return user?.email || '';
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="w-64 pl-9 bg-secondary/50 border-transparent focus:border-primary"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 z-[100]">
            <div className="flex items-center justify-between px-2 py-1.5">
              <DropdownMenuLabel className="text-base font-semibold">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </DropdownMenuLabel>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAllAsRead();
                  }}
                >
                  Mark all as read
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-[400px] overflow-y-auto">
              {displayedNotifications.length === 0 ? (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                displayedNotifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 p-3 cursor-pointer focus:bg-accent",
                      !notification.read && "bg-accent/50"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-none">{notification.title}</p>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">{notification.time}</p>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            {hasMoreNotifications && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="justify-center text-sm cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAllNotifications(!showAllNotifications);
                  }}
                >
                  {showAllNotifications ? (
                    <>Show less</>
                  ) : (
                    <>View all notifications ({notifications.length})</>
                  )}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col space-y-1">
              <span className="text-sm font-medium">{getUserName()}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {getUserEmail()}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
