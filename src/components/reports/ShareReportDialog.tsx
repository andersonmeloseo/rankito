import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Share2, Copy, Check } from 'lucide-react';

interface ShareReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  reportData: any;
}

export const ShareReportDialog = ({
  open,
  onOpenChange,
  siteId,
  reportData
}: ShareReportDialogProps) => {
  const [shareLink, setShareLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerateLink = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('report_shares')
        .insert({
          user_id: user.id,
          site_id: siteId,
          report_data: reportData
        })
        .select()
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/report/${data.share_token}`;
      setShareLink(link);

      toast({
        title: "Link gerado!",
        description: "Link expira em 7 dias.",
      });
    } catch (error: any) {
      console.error('Error generating share link:', error);
      toast({
        title: "Erro ao gerar link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Compartilhar Relatório
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!shareLink ? (
            <>
              <p className="text-sm text-muted-foreground">
                Gere um link público para compartilhar este relatório. O link expirará automaticamente em 7 dias.
              </p>
              <Button onClick={handleGenerateLink} disabled={loading} className="w-full">
                {loading ? 'Gerando...' : 'Gerar Link de Compartilhamento'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Link de Compartilhamento</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareLink}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                <p className="font-medium">⏰ Link expira em 7 dias</p>
                <p className="text-xs mt-1">
                  Qualquer pessoa com este link poderá visualizar o relatório até a data de expiração.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => {
            onOpenChange(false);
            setShareLink('');
          }}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
