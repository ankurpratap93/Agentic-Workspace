import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative z-0">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin relative z-0">
          {children}
        </main>
      </div>
    </div>
  );
}
