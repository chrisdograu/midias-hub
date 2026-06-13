import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import GameTimeline from '@/components/social/GameTimeline';

export default function TimelineGamer() {
  const { user } = useAuth();
  if (!user) return <div className="container mx-auto p-8 text-center text-muted-foreground">Faça login para ver sua timeline.</div>;
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Link to="/perfil" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar ao perfil
      </Link>
      <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 mb-1">
        <Clock className="h-6 w-6 text-primary" /> Sua Linha do Tempo Gamer
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Cada marco da sua jornada — mudanças de status, reviews, opiniões, screenshots e platinas.
      </p>
      <GameTimeline userId={user.id} />
    </div>
  );
}
