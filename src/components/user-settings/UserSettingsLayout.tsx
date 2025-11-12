import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { UserSettingsNav } from './UserSettingsNav';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface UserSettingsLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  userRole?: 'client' | 'end_client' | 'super_admin';
}

export const UserSettingsLayout = ({ children, activeTab, onTabChange, userRole }: UserSettingsLayoutProps) => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    const dashboardPath = userRole === 'end_client' ? '/end-client-portal' : '/dashboard';
    navigate(dashboardPath);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      <Header showSubtitle={false} />
      
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <Button
            variant="ghost"
            onClick={handleBackToDashboard}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Painel
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1">
        {/* Sidebar de navegação */}
        <aside className="w-64 border-r bg-card/30 backdrop-blur-sm">
          <UserSettingsNav activeTab={activeTab} onTabChange={onTabChange} />
        </aside>

        {/* Conteúdo principal */}
        <main className="flex-1 overflow-auto">
          <div className="container max-w-5xl mx-auto py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
