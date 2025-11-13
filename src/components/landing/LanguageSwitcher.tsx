import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { LandingLocale } from "@/i18n/landingTranslations";

const languages = [
  { code: 'pt-BR' as LandingLocale, name: 'Português (BR)', flag: '🇧🇷' },
  { code: 'es-ES' as LandingLocale, name: 'Español', flag: '🇪🇸' },
  { code: 'en-US' as LandingLocale, name: 'English', flag: '🇺🇸' },
  { code: 'fr-FR' as LandingLocale, name: 'Français', flag: '🇫🇷' },
  { code: 'pt-PT' as LandingLocale, name: 'Português (PT)', flag: '🇵🇹' },
];

interface LanguageSwitcherProps {
  locale: LandingLocale;
  setLocale: (locale: LandingLocale) => void;
}

export function LanguageSwitcher({ locale, setLocale }: LanguageSwitcherProps) {
  const currentLanguage = languages.find(l => l.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 hover:bg-gray-100">
          <Globe className="h-4 w-4" />
          <span className="text-lg">{currentLanguage?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLocale(lang.code)}
            className="gap-3 cursor-pointer"
          >
            <span className="text-lg">{lang.flag}</span>
            <span>{lang.name}</span>
            {locale === lang.code && (
              <span className="ml-auto text-blue-600">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
