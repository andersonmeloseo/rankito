import { useState } from "react";
import { useRole } from "@/contexts/RoleContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OverviewDashboard } from "@/components/super-admin/OverviewDashboard";
import { UnifiedUsersTab } from "@/components/super-admin/UnifiedUsersTab";
import { SubscriptionMetricsCards } from "@/components/super-admin/SubscriptionMetricsCards";
import { PlansManagementTable } from "@/components/super-admin/PlansManagementTable";
import { SubscriptionsTable } from "@/components/super-admin/SubscriptionsTable";
import { PaymentsHistoryTable } from "@/components/super-admin/PaymentsHistoryTable";
import { GeolocationApisManager } from "@/components/super-admin/GeolocationApisManager";
import { AuditLogsTab } from "@/components/super-admin/AuditLogsTab";
import { useSystemHealthMetrics } from "@/hooks/useSystemHealthMetrics";
import { SystemHealthOverview } from "@/components/super-admin/SystemHealthOverview";
import { ProblematicIntegrationsTable } from "@/components/super-admin/ProblematicIntegrationsTable";
import { RecentIssuesTimeline } from "@/components/super-admin/RecentIssuesTimeline";
import { EdgeFunctionsHealthTable } from "@/components/super-admin/EdgeFunctionsHealthTable";
import { RetentionAnalytics } from "@/components/super-admin/RetentionAnalytics";
import { AdminAutomationsTab } from "@/components/super-admin/automations/AdminAutomationsTab";
import { CommunicationTab } from "@/components/super-admin/CommunicationTab";
import { VideoTrainingManagementTab } from "@/components/super-admin/VideoTrainingManagementTab";
import { MarketingTab } from "@/components/super-admin/marketing/MarketingTab";
import { TechnicalDocumentationTab } from "@/components/super-admin/documentation";
import { BacklogManagementTab } from "@/components/backlog/admin/BacklogManagementTab";
import { SuperAdminLayout } from "@/components/super-admin/SuperAdminLayout";

const SuperAdminDashboard = () => {
  const { isLoading } = useRole();
  const [activeTab, setActiveTab] = useState("overview");
  const { data: healthMetrics, isLoading: isLoadingHealth } = useSystemHealthMetrics();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-primary/10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewDashboard />;
      
      case "users":
        return <UnifiedUsersTab />;
      
      case "geolocation-apis":
        return (
          <Card className="card-modern">
            <CardHeader>
              <CardTitle>APIs de Geolocalização</CardTitle>
              <CardDescription>
                Gerencie as APIs de geolocalização para rastreamento de conversões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GeolocationApisManager />
            </CardContent>
          </Card>
        );
      
      case "plans":
        return <PlansManagementTable />;
      
      case "financial":
        return (
          <>
            <SubscriptionMetricsCards />
            <SubscriptionsTable />
            <PaymentsHistoryTable />
          </>
        );
      
      case "audit-logs":
        return <AuditLogsTab />;
      
      case "retention":
        return <RetentionAnalytics />;
      
      case "automations":
        return <AdminAutomationsTab />;
      
      case "monitoring":
        if (isLoadingHealth) {
          return (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          );
        }
        if (healthMetrics) {
          return (
            <>
              <SystemHealthOverview metrics={healthMetrics} />
              <div className="grid gap-6 lg:grid-cols-2">
                <ProblematicIntegrationsTable metrics={healthMetrics} />
                <RecentIssuesTimeline metrics={healthMetrics} />
              </div>
              <EdgeFunctionsHealthTable metrics={healthMetrics} />
            </>
          );
        }
        return (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Não foi possível carregar métricas de saúde</p>
            </CardContent>
          </Card>
        );
      
      case "communication":
        return <CommunicationTab />;
      
      case "marketing":
        return <MarketingTab />;
      
      case "videoaulas":
        return <VideoTrainingManagementTab />;
      
      case "backlog":
        return <BacklogManagementTab />;
      
      case "documentation":
        return <TechnicalDocumentationTab />;
      
      default:
        return <OverviewDashboard />;
    }
  };

  return (
    <SuperAdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
