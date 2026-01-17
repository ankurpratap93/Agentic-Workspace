import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderKanban,
  FileCheck,
  Bug,
  Bot,
  Settings,
  Upload,
  Link2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Test Cases', href: '/test-cases', icon: FileCheck },
  { name: 'Bugs', href: '/bugs', icon: Bug },
  { name: 'AI Agents', href: '/agents', icon: Bot },
  { name: 'Excel Import', href: '/import', icon: Upload },
  { name: 'Integrations', href: '/integrations', icon: Link2 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        'gradient-dark flex flex-col border-r border-sidebar-border transition-all duration-300 relative z-10',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground">
              QA<span className="text-gradient">Forge</span>
            </span>
          </div>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary mx-auto">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors',
            collapsed && 'absolute -right-3 top-6 bg-sidebar border border-sidebar-border rounded-full'
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4 scrollbar-thin overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                  : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'drop-shadow-sm')} />
              {!collapsed && <span className="animate-fade-in">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success agent-pulse">
              <Bot className="h-4 w-4 text-success-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">9 Agents Online</p>
              <p className="text-xs text-sidebar-muted">All systems operational</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
