import { lazy, Suspense, useState } from "react";
import { useRole } from "@/contexts/RoleContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSystemHealthMetrics } from "@/hooks/useSystemHealthMetrics";
import { SuperAdminLayout } from "@/components/super-admin/SuperAdminLayout";
import { PageLoadingFallback } from "@/components/ui/PageLoadingFallback";

// Lazy loaded tab components - only downloaded when tab is activated
const OverviewDashboard = lazy(() => import("@/components/super-admin/OverviewDashboard").then(m => ({ default: m.OverviewDashboard })));
const UnifiedUsersTab = lazy(() => import("@/components/super-admin/UnifiedUsersTab").then(m => ({ default: m.UnifiedUsersTab })));
const SubscriptionMetricsCards = lazy(() => import("@/components/super-admin/SubscriptionMetricsCards").then(m => ({ default: m.SubscriptionMetricsCards })));
const PlansManagementTable = lazy(() => import("@/components/super-admin/PlansManagementTable").then(m => ({ default: m.PlansManagementTable })));
const SubscriptionsTable = lazy(() => import("@/components/super-admin/SubscriptionsTable").then(m => ({ default: m.SubscriptionsTable })));
const PaymentsHistoryTable = lazy(() => import("@/components/super-admin/PaymentsHistoryTable").then(m => ({ default: m.PaymentsHistoryTable })));
const GeolocationApisManager = lazy(() => import("@/components/super-admin/GeolocationApisManager").then(m => ({ default: m.GeolocationApisManager })));
const AuditLogsTab = lazy(() => import("@/components/super-admin/AuditLogsTab").then(m => ({ default: m.AuditLogsTab })));
const RetentionAnalytics = lazy(() => import("@/components/super-admin/RetentionAnalytics").then(m => ({ default: m.RetentionAnalytics })));
const AdminAutomationsTab = lazy(() => import("@/components/super-admin/automations/AdminAutomationsTab").then(m => ({ default: m.AdminAutomationsTab })));
const CommunicationTab = lazy(() => import("@/components/super-admin/CommunicationTab").then(m => ({ default: m.CommunicationTab })));
const VideoTrainingManagementTab = lazy(() => import("@/components/super-admin/VideoTrainingManagementTab").then(m => ({ default: m.VideoTrainingManagementTab })));
const MarketingTab = lazy(() => import("@/components/super-admin/marketing/MarketingTab").then(m => ({ default: m.MarketingTab })));
const TechnicalDocumentationTab = lazy(() => import("@/components/super-admin/documentation").then(m => ({ default: m.TechnicalDocumentationTab })));
const BacklogManagementTab = lazy(() => import("@/components/backlog/admin/BacklogManagementTab").then(m => ({ default: m.BacklogManagementTab })));
const SystemHealthOverview = lazy(() => import("@/components/super-admin/SystemHealthOverview").then(m => ({ default: m.SystemHealthOverview })));
const ProblematicIntegrationsTable = lazy(() => import("@/components/super-admin/ProblematicIntegrationsTable").then(m => ({ default: m.ProblematicIntegrationsTable })));
const RecentIssuesTimeline = lazy(() => import("@/components/super-admin/RecentIssuesTimeline").then(m => ({ default: m.RecentIssuesTimeline })));
const EdgeFunctionsHealthTable = lazy(() => import("@/components/super-admin/EdgeFunctionsHealthTable").then(m => ({ default: m.EdgeFunctionsHealthTable })));

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
      <Suspense fallback={<PageLoadingFallback variant="tab" />}>
        {renderContent()}
      </Suspense>
    </SuperAdminLayout>
  );
};

export default SuperAdminDashboard;
