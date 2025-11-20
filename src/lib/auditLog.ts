import { supabase } from "@/integrations/supabase/client";

export interface LogAuditOptions {
  action: string;
  targetUserId?: string;
  details?: Record<string, any>;
}

export const logAuditAction = async (options: LogAuditOptions) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ No authenticated user for audit log');
      return;
    }

    const { error } = await supabase
      .from('admin_audit_logs')
      .insert({
        admin_user_id: user.id,
        target_user_id: options.targetUserId || null,
        action: options.action,
        details: options.details || {},
        ip_address: null, // Could be populated from request headers if needed
        user_agent: navigator.userAgent,
      });

    if (error) {
      console.error('❌ Error logging audit action:', error);
    } else {
      console.log(`✅ Audit log created: ${options.action}`);
    }
  } catch (error) {
    console.error('❌ Failed to log audit action:', error);
  }
};
