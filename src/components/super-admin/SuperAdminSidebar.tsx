import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Users,
  Globe,
  DollarSign,
  Shield,
  Package,
  Activity,
  TrendingUp,
  Bot,
  MessageSquare,
  GraduationCap,
  Megaphone,
  BookOpen,
  Kanban,
  ChevronDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface SuperAdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuGroups = [
  {
    label: "Principal",
    items: [
      { id: "overview", label: "Visão Geral", icon: BarChart3 },
    ],
  },
  {
    label: "Gestão",
    items: [
      { id: "users", label: "Usuários", icon: Users },
      { id: "plans", label: "Planos", icon: Package },
      { id: "financial", label: "Financeiro", icon: DollarSign },
    ],
  },
  {
    label: "Sistema",
    items: [
      { id: "geolocation-apis", label: "APIs Geolocalização", icon: Globe },
      { id: "audit-logs", label: "Log Audit", icon: Shield },
      { id: "monitoring", label: "Monitoramento", icon: Activity },
    ],
  },
  {
    label: "Engajamento",
    items: [
      { id: "retention", label: "Retenção", icon: TrendingUp },
      { id: "automations", label: "Automações", icon: Bot },
      { id: "communication", label: "Suporte", icon: MessageSquare },
      { id: "marketing", label: "Marketing", icon: Megaphone },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { id: "videoaulas", label: "Videoaulas", icon: GraduationCap },
      { id: "backlog", label: "Backlog", icon: Kanban },
      { id: "documentation", label: "Documentação", icon: BookOpen },
    ],
  },
];

export function SuperAdminSidebar({ activeTab, onTabChange }: SuperAdminSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="p-4">
        <div className={cn(
          "flex items-center gap-3 transition-all",
          isCollapsed && "justify-center"
        )}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
            <Shield className="h-4 w-4" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">Super Admin</span>
              <span className="text-xs text-muted-foreground">Painel de Controle</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2">
        {menuGroups.map((group, groupIndex) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => onTabChange(item.id)}
                        isActive={isActive}
                        tooltip={item.label}
                        className={cn(
                          "transition-all duration-200",
                          isActive && "bg-primary/10 text-primary border-l-2 border-primary"
                        )}
                      >
                        <Icon className={cn(
                          "h-4 w-4 shrink-0",
                          isActive ? "text-primary" : "text-sidebar-foreground/70"
                        )} />
                        <span className={cn(
                          "truncate",
                          isActive && "font-medium"
                        )}>
                          {item.label}
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
