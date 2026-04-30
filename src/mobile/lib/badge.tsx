import { ReactNode, forwardRef } from 'react';

export function MobileBadge({ children, tone = 'primary' }: { children: ReactNode; tone?: 'primary' | 'accent' | 'success' | 'warning' | 'muted' | 'price' }) {
  const tones: Record<string, string> = {
    primary: 'bg-primary/15 text-primary border-primary/30',
    accent: 'bg-accent/15 text-accent border-accent/30',
    success: 'bg-success/15 text-success border-success/30',
    warning: 'bg-warning/15 text-warning border-warning/30',
    muted: 'bg-muted text-muted-foreground border-border',
    price: 'bg-price/15 text-price border-price/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function MobileChip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
        active
          ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground border-transparent shadow-md'
          : 'bg-card/60 text-muted-foreground border-border hover:text-foreground hover:border-primary/40'
      }`}
    >
      {children}
    </button>
  );
}

export const MForumTag = forwardRef<HTMLSpanElement, { name: string }>(({ name }, ref) => {
  return (
    <span ref={ref} className="inline-flex items-center font-display text-[11px] font-bold tracking-wide text-accent">
      M/{name}
    </span>
  );
});
MForumTag.displayName = 'MForumTag';
