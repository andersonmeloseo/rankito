import { useState, useEffect } from 'react';
import { X, Flame, Zap, Snowflake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface LeadNotificationBannerProps {
  leads: Array<{
    id: string;
    title: string;
    lead_score: number;
    stage: string;
    source: string;
    created_at: string;
  }>;
  onDismiss: () => void;
}

export const LeadNotificationBanner = ({ leads, onDismiss }: LeadNotificationBannerProps) => {
  const [visible, setVisible] = useState(true);
  const [countdown, setCountdown] = useState(10);
  const navigate = useNavigate();

  useEffect(() => {
    if (leads.length === 0) {
      setVisible(false);
      return;
    }

    setVisible(true);
    setCountdown(10);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setVisible(false);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [leads, onDismiss]);

  if (!visible || leads.length === 0) return null;

  const latestLead = leads[0];
  const isHot = latestLead.lead_score >= 80;
  const isWarm = latestLead.lead_score >= 60 && latestLead.lead_score < 80;

  const Icon = isHot ? Flame : isWarm ? Zap : Snowflake;
  const bgColor = isHot 
    ? 'bg-gradient-to-r from-red-500 to-orange-500' 
    : isWarm 
    ? 'bg-gradient-to-r from-yellow-500 to-amber-500'
    : 'bg-gradient-to-r from-blue-500 to-cyan-500';

  const handleViewLead = () => {
    navigate('/dashboard', { state: { openCRM: true, highlightDeal: latestLead.id } });
    setVisible(false);
    onDismiss();
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-500">
      <Card className={`${bgColor} text-white p-4 shadow-2xl border-none max-w-md`}>
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Icon className="h-6 w-6 animate-bounce" />
          </div>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Novo Lead Capturado!</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-white hover:bg-white/20"
                onClick={() => {
                  setVisible(false);
                  onDismiss();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-sm text-white/90 line-clamp-2">
              {latestLead.title}
            </p>
            
            <div className="flex items-center gap-2 text-xs text-white/80">
              <span>Score: {latestLead.lead_score}/100</span>
              <span>•</span>
              <span>Auto fechando em {countdown}s</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 bg-white text-gray-900 hover:bg-white/90"
            onClick={handleViewLead}
          >
            Ver Lead
          </Button>
          {leads.length > 1 && (
            <div className="px-3 py-2 bg-white/20 rounded-md backdrop-blur-sm text-sm font-medium">
              +{leads.length - 1} leads
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
