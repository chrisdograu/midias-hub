import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

export function AdminPageHeader({
  icon: Icon, title, subtitle, actions,
}: { icon: LucideIcon; title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Icon className="h-6 w-6 text-primary" /> {title}
        </h1>
        {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
