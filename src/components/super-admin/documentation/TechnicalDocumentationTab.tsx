import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Server, Database, Rocket, Package, Activity } from "lucide-react";
import { SystemArchitectureDoc } from "./SystemArchitectureDoc";
import { EdgeFunctionsDoc } from "./EdgeFunctionsDoc";
import { DatabaseSchemaDoc } from "./DatabaseSchemaDoc";
import { DeploymentGuideDoc } from "./DeploymentGuideDoc";
import { SystemModulesDoc } from "./SystemModulesDoc";

export const TechnicalDocumentationTab = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-3xl font-bold">Documentação Técnica</h2>
          <p className="text-muted-foreground">Referência completa da arquitetura e APIs do sistema</p>
        </div>
      </div>

      <Tabs defaultValue="architecture" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-muted/50">
          <TabsTrigger value="architecture" className="gap-2">
            <Server className="h-4 w-4" />
            Arquitetura
          </TabsTrigger>
          <TabsTrigger value="apis" className="gap-2">
            <Activity className="h-4 w-4" />
            APIs & Edge Functions
          </TabsTrigger>
          <TabsTrigger value="database" className="gap-2">
            <Database className="h-4 w-4" />
            Banco de Dados
          </TabsTrigger>
          <TabsTrigger value="deployment" className="gap-2">
            <Rocket className="h-4 w-4" />
            Deployment
          </TabsTrigger>
          <TabsTrigger value="modules" className="gap-2">
            <Package className="h-4 w-4" />
            Módulos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="architecture">
          <SystemArchitectureDoc />
        </TabsContent>

        <TabsContent value="apis">
          <EdgeFunctionsDoc />
        </TabsContent>

        <TabsContent value="database">
          <DatabaseSchemaDoc />
        </TabsContent>

        <TabsContent value="deployment">
          <DeploymentGuideDoc />
        </TabsContent>

        <TabsContent value="modules">
          <SystemModulesDoc />
        </TabsContent>
      </Tabs>
    </div>
  );
};