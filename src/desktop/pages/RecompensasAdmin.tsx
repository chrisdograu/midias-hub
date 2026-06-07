import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

/**
 * Hub das recompensas — atalhos para Badges, Títulos, Cupons e XP.
 */
export default function RecompensasAdmin() {
  const navigate = useNavigate();
  const sections = [
    { label: 'Badges', desc: 'Conquistas visuais', to: '/desktop/badges' },
    { label: 'Títulos', desc: 'Títulos exclusivos', to: '/desktop/titulos' },
    { label: 'Cupons', desc: 'Códigos promocionais', to: '/desktop/cupons' },
    { label: 'XP Mobile', desc: 'Pontuação social', to: '/desktop/xp/mobile' },
    { label: 'XP Web', desc: 'Pontuação loja/reviews', to: '/desktop/xp/web' },
  ];
  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader icon={Sparkles} title="Recompensas" subtitle="Central de bonificações para usuários" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map(s => (
          <Card key={s.to} className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => navigate(s.to)}>
            <CardContent className="p-5 space-y-2">
              <h3 className="font-bold text-lg">{s.label}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
              <Button variant="outline" size="sm">Abrir</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
