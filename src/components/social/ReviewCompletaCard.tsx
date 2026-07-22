import { Link } from 'react-router-dom';
import { BookOpen, Clock, Gamepad2, Heart, Lock, ShieldCheck, ThumbsDown, ThumbsUp, Users } from 'lucide-react';
import SpoilerGuard from '@/components/spoiler/SpoilerGuard';

export interface ReviewCompletaData {
  id: string;
  user_id: string;
  product_id: string;
  analise: string;
  horas_jogadas: number | null;
  plataforma: string | null;
  dificuldade: string | null;
  status: string | null;
  recomendacao: string | null;
  personagens_favoritos: string | null;
  trilha_sonora_favorita: string | null;
  momentos_favoritos: string | null;
  pros: string[] | null;
  contras: string[] | null;
  tags_emocionais: string[] | null;
  visibility: 'friends' | 'private';
  created_at: string;
  is_spoiler?: boolean | null;
  spoiler_achievement_name?: string | null;
  verified_purchase?: boolean | null;
  profile?: { display_name?: string | null; avatar_url?: string | null } | null;
}

export default function ReviewCompletaCard({ review }: { review: ReviewCompletaData }) {
  const pros = review.pros || [];
  const contras = review.contras || [];
  const tags = review.tags_emocionais || [];

  return (
    <article className="bg-card border border-border rounded-xl p-5 space-y-3">
      <header className="flex items-center gap-3">
        <Link to={`/amigo/${review.user_id}`} className="flex items-center gap-2 hover:opacity-80">
          {review.profile?.avatar_url
            ? <img src={review.profile.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
            : <div className="w-10 h-10 rounded-full bg-primary/20" />}
          <div>
            <p className="text-sm font-semibold text-foreground">{review.profile?.display_name || 'Amigo'}</p>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <BookOpen className="h-3 w-3" /> Review Completa · {new Date(review.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </Link>
        <span className="ml-auto text-[10px] flex items-center gap-1 px-2 py-0.5 rounded-full border border-border text-muted-foreground">
          {review.visibility === 'private' ? <><Lock className="h-3 w-3" /> Close</> : <><Users className="h-3 w-3" /> Amigos</>}
        </span>
      </header>

      <div className="flex flex-wrap gap-1.5 text-[10px]">
        {review.horas_jogadas != null && <Tag icon={Clock}>{review.horas_jogadas}h</Tag>}
        {review.plataforma && <Tag icon={Gamepad2}>{review.plataforma}</Tag>}
        {review.dificuldade && <Tag className="bg-warning/20 text-warning">{review.dificuldade}</Tag>}
        {review.status && <Tag className="bg-primary/20 text-primary">{review.status}</Tag>}
        {review.recomendacao && <Tag className="bg-accent/20 text-accent">{review.recomendacao}</Tag>}
        {tags.map(t => <Tag key={t} icon={Heart} className="bg-muted text-muted-foreground">{t}</Tag>)}
      </div>

      <SpoilerGuard
        isSpoiler={!!review.is_spoiler}
        achievementName={review.spoiler_achievement_name}
        productId={review.product_id}
      >
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{review.analise}</p>
      </SpoilerGuard>

      {(pros.length > 0 || contras.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {pros.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-success flex items-center gap-1 mb-1"><ThumbsUp className="h-3 w-3" /> Prós</p>
              <ul className="space-y-1 text-xs text-foreground">
                {pros.map((p, i) => <li key={i}>• {p}</li>)}
              </ul>
            </div>
          )}
          {contras.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold text-destructive flex items-center gap-1 mb-1"><ThumbsDown className="h-3 w-3" /> Contras</p>
              <ul className="space-y-1 text-xs text-foreground">
                {contras.map((p, i) => <li key={i}>• {p}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {(review.personagens_favoritos || review.trilha_sonora_favorita || review.momentos_favoritos) && (
        <div className="pt-2 space-y-1 border-t border-border">
          {review.personagens_favoritos && <Detail label="Personagens">{review.personagens_favoritos}</Detail>}
          {review.trilha_sonora_favorita && <Detail label="Trilha sonora">{review.trilha_sonora_favorita}</Detail>}
          {review.momentos_favoritos && <Detail label="Momentos">{review.momentos_favoritos}</Detail>}
        </div>
      )}
    </article>
  );
}

function Tag({ children, icon: Icon, className = '' }: { children: React.ReactNode; icon?: any; className?: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${className || 'bg-secondary text-secondary-foreground'}`}>
      {Icon && <Icon className="h-3 w-3" />}{children}
    </span>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <p className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">{label}:</span> {children}</p>
  );
}
