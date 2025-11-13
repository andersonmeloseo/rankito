import { Moon, Sun, Monitor } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

export const ThemeToggle = () => {
  const { mode, setMode } = useTheme();

  const Icon = mode === 'dark' ? Moon : mode === 'light' ? Sun : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Icon className="h-4 w-4 transition-transform duration-200" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onClick={() => setMode('light')} className="gap-2">
          <Sun className="h-4 w-4" />
          <span>Claro</span>
          {mode === 'light' && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode('dark')} className="gap-2">
          <Moon className="h-4 w-4" />
          <span>Escuro</span>
          {mode === 'dark' && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setMode('system')} className="gap-2">
          <Monitor className="h-4 w-4" />
          <span>Sistema</span>
          {mode === 'system' && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
