import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Globe, User, Briefcase, Plus, UserPlus, Search } from "lucide-react";
import { useGlobalSearch, SearchResult } from "@/hooks/useGlobalSearch";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const iconMap = {
  Globe,
  User,
  Briefcase,
  Plus,
  UserPlus,
};

export const CommandPalette = ({ open, onOpenChange }: CommandPaletteProps) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { results } = useGlobalSearch(search);

  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const handleSelect = (result: SearchResult) => {
    if (result.url) {
      navigate(result.url);
      onOpenChange(false);
    } else if (result.type === "action") {
      // Handle actions
      if (result.id === "action-add-site") {
        navigate("/dashboard");
        // Trigger add site dialog
      } else if (result.id === "action-add-client") {
        navigate("/dashboard");
        // Trigger add client dialog
      }
      onOpenChange(false);
    }
  };

  const groupedResults = {
    actions: results.filter((r) => r.type === "action"),
    sites: results.filter((r) => r.type === "site"),
    clients: results.filter((r) => r.type === "client"),
    deals: results.filter((r) => r.type === "deal"),
  };

  const renderIcon = (iconName?: string) => {
    if (!iconName) return <Search className="mr-2 h-4 w-4" />;
    const Icon = iconMap[iconName as keyof typeof iconMap] || Search;
    return <Icon className="mr-2 h-4 w-4" />;
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Buscar sites, clientes, deals ou ações..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>

        {groupedResults.actions.length > 0 && (
          <>
            <CommandGroup heading="Ações Rápidas">
              {groupedResults.actions.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSelect(result)}
                  className="cursor-pointer"
                >
                  {renderIcon(result.icon)}
                  <span>{result.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {groupedResults.sites.length > 0 && (
          <>
            <CommandGroup heading="Sites">
              {groupedResults.sites.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSelect(result)}
                  className="cursor-pointer"
                >
                  {renderIcon(result.icon)}
                  <div className="flex flex-col">
                    <span>{result.title}</span>
                    {result.subtitle && (
                      <span className="text-xs text-muted-foreground">
                        {result.subtitle}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {groupedResults.clients.length > 0 && (
          <>
            <CommandGroup heading="Clientes">
              {groupedResults.clients.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleSelect(result)}
                  className="cursor-pointer"
                >
                  {renderIcon(result.icon)}
                  <div className="flex flex-col">
                    <span>{result.title}</span>
                    {result.subtitle && (
                      <span className="text-xs text-muted-foreground">
                        {result.subtitle}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {groupedResults.deals.length > 0 && (
          <CommandGroup heading="Deals CRM">
            {groupedResults.deals.map((result) => (
              <CommandItem
                key={result.id}
                onSelect={() => handleSelect(result)}
                className="cursor-pointer"
              >
                {renderIcon(result.icon)}
                <div className="flex flex-col">
                  <span>{result.title}</span>
                  {result.subtitle && (
                    <span className="text-xs text-muted-foreground">
                      {result.subtitle}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
};
