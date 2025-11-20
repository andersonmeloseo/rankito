import { Bug, Sparkles, HelpCircle, Wrench, FileText } from "lucide-react";

interface CategoryIconProps {
  category: 'bug_report' | 'feature_request' | 'question' | 'technical_support' | 'other';
  className?: string;
}

const categoryConfig = {
  bug_report: { icon: Bug, label: 'Bug' },
  feature_request: { icon: Sparkles, label: 'Melhoria' },
  question: { icon: HelpCircle, label: 'Pergunta' },
  technical_support: { icon: Wrench, label: 'Suporte Técnico' },
  other: { icon: FileText, label: 'Outro' },
};

export function CategoryIcon({ category, className }: CategoryIconProps) {
  const config = categoryConfig[category];
  const Icon = config.icon;
  
  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <Icon className="h-4 w-4" />
      <span className="text-sm">{config.label}</span>
    </div>
  );
}
