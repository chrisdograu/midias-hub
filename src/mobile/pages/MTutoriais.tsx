import { Link } from 'react-router-dom';
import { ChevronRight, GraduationCap, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { TUTORIALS, useTutorial } from '@/components/tutorial/TutorialContext';

export default function MTutoriais() {
  const { seen } = useTutorial();
  const mobileList = TUTORIALS.filter(t => t.area === 'mobile');
  return (
    <div className="px-4 py-5 space-y-4 pb-24">
      <Link to="/m/config" className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ArrowLeft className="h-3.5 w-3.5" /> Configurações</Link>
      <div className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-accent" />
        <h1 className="font-display text-xl font-bold gradient-text">Tutoriais mobile</h1>
      </div>
      <p className="text-xs text-muted-foreground">
        Cada tutorial é interativo: você passa por etapas, mexe em mini-componentes e termina com um link direto para a versão real.
      </p>
      <div className="space-y-2">
        {mobileList.map(t => (
          <Link key={t.key} to={`/m/tutorial/${t.key}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg">🎓</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold truncate">{t.title}</p>
                {seen.has(t.key) && <CheckCircle2 className="h-3 w-3 text-success shrink-0" />}
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-1">{t.description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
