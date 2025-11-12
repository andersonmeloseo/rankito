import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useEndClientManagement } from "@/hooks/useEndClientManagement";
import { toast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z.string().email("Email inválido"),
  full_name: z.string().min(3, "Nome deve ter ao menos 3 caracteres"),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
});

interface CreateEndClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const CreateEndClientDialog = ({
  open,
  onOpenChange,
  clientId,
  clientName,
}: CreateEndClientDialogProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const { createEndClient } = useEndClientManagement(clientId);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      full_name: "",
      password: generatePassword(),
    },
  });

  const handleGeneratePassword = () => {
    form.setValue("password", generatePassword());
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await createEndClient.mutateAsync({
        email: values.email,
        password: values.password,
        full_name: values.full_name,
        client_id: clientId,
      });

      setCreatedCredentials({
        email: values.email,
        password: values.password,
      });

      form.reset();
    } catch (error) {
      console.error("Error creating end-client:", error);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;

    const text = `Credenciais de Acesso - ${clientName}\n\nEmail: ${createdCredentials.email}\nSenha: ${createdCredentials.password}\n\nAcesse: ${import.meta.env.VITE_APP_URL}/end-client-portal`;

    navigator.clipboard.writeText(text);
    toast({
      title: "Credenciais copiadas!",
      description: "Cole no email ou mensagem para seu cliente",
    });
  };

  const handleClose = () => {
    setCreatedCredentials(null);
    form.reset({
      email: "",
      full_name: "",
      password: generatePassword(),
    });
    onOpenChange(false);
  };

  if (createdCredentials) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>✅ Acesso Criado com Sucesso!</DialogTitle>
            <DialogDescription>
              Compartilhe estas credenciais com {clientName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                <p className="font-mono text-sm">{createdCredentials.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Senha Temporária</p>
                <p className="font-mono text-sm">{createdCredentials.password}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Portal de Acesso</p>
                <p className="font-mono text-sm break-all">{import.meta.env.VITE_APP_URL}/end-client-portal</p>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ <strong>Importante:</strong> O cliente deverá alterar a senha no primeiro acesso.
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCopyCredentials} className="flex-1">
                <Copy className="w-4 h-4 mr-2" />
                Copiar Credenciais
              </Button>
              <Button variant="outline" onClick={handleClose}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Criar Acesso para {clientName}</DialogTitle>
          <DialogDescription>
            Preencha os dados para gerar as credenciais de acesso
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="João Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="cliente@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha Temporária</FormLabel>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          {...field}
                          className="pr-10"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleGeneratePassword}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createEndClient.isPending}
                className="flex-1"
              >
                {createEndClient.isPending ? "Criando..." : "Criar Acesso"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
