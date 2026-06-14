import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, GraduationCap } from 'lucide-react';
import { TUTORIALS, useTutorial } from '@/components/tutorial/TutorialContext';

export default function Tutoriais() {
  const { seen, isLoading } = useTutorial();
  const web = TUTORIALS.filter(t => t.area === 'web');
  const mobile = TUTORIALS.filter(t => t.area === 'mobile');
  const total = TUTORIALS.length;
  const done = seen.size;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs mb-3">
          <GraduationCap className="h-3 w-3" /> Aprenda na prática
        </div>
        <h1 className="font-display text-3xl font-bold gradient-text">Tutoriais MIDIAS</h1>
        <p className="text-muted-foreground mt-2">
          Cada tutorial abre uma página réplica com conteúdo de exemplo. Aprenda sem medo de quebrar nada.
        </p>
        {!isLoading && (
          <p className="text-sm text-muted-foreground mt-3">
            Progresso: <b className="text-primary">{done}/{total}</b> concluídos
          </p>
        )}
      </div>

      <Section title="🖥 Web" tutorials={web} seen={seen} />
      <Section title="📱 Mobile" tutorials={mobile} seen={seen} />
    </div>
  );
}

function Section({ title, tutorials, seen }: { title: string; tutorials: typeof TUTORIALS; seen: Set<string> }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-4">{title}</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {tutorials.map(t => {
          const isDone = seen.has(t.key);
          return (
            <Link
              key={t.key}
              to={t.replicaRoute}
              className={`glass rounded-xl p-4 flex items-start gap-3 hover:border-primary/40 transition-colors ${isDone ? 'opacity-70' : ''}`}
            >
              {isDone ? <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" /> : <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />}
              <div className="flex-1">
                <p className="font-semibold">{t.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
