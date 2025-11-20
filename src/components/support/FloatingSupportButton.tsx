import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserTickets } from "@/hooks/useSupportTickets";
import { SupportTicketDialog } from "./SupportTicketDialog";
import { supabase } from "@/integrations/supabase/client";

export function FloatingSupportButton() {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user
  supabase.auth.getUser().then(({ data }) => {
    if (data.user) setUserId(data.user.id);
  });

  const { data: tickets } = useUserTickets(userId || undefined);
  
  const unreadCount = tickets?.reduce((sum, ticket) => sum + ticket.unread_user_count, 0) || 0;

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 bg-primary hover:bg-primary/90"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 animate-pulse"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      <SupportTicketDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
