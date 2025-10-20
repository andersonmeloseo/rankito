import { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';
import { UserSettingsNav } from './UserSettingsNav';

interface UserSettingsLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export const UserSettingsLayout = ({ children, activeTab, onTabChange }: UserSettingsLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <Header showSubtitle={false} />
      
      <div className="flex flex-1">
        {/* Sidebar de navegação */}
        <aside className="w-64 border-r bg-card/30 backdrop-blur-sm">
          <UserSettingsNav activeTab={activeTab} onTabChange={onTabChange} />
        </aside>

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-auto">
          <div className="container max-w-4xl mx-auto p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
