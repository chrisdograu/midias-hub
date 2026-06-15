// Customização visual do perfil: banner, cor de destaque e vitrine de troféus.
// Os dados gravam em profiles.theme_color / profile_cover_url / trophy_showcase.
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Camera, Palette, Trophy, Save, X } from 'lucide-react';
import { toast } from 'sonner';

const PRESETS = ['#14B8A6', '#A855F7', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#EC4899'];

interface BadgeRow { badge_id: string; name?: string | null; icon?: string | null }
interface TitleRow { id: string; name: string }

export default function CustomizacaoTab() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [color, setColor] = useState('#14B8A6');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [showcase, setShowcase] = useState<string[]>([]);
  const [badges, setBadges] = useState<BadgeRow[]>([]);
  const [titles, setTitles] = useState<TitleRow[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: ub }, { data: ut }] = await Promise.all([
        supabase.from('profiles').select('theme_color, profile_cover_url, trophy_showcase').eq('id', user.id).maybeSingle(),
        supabase.from('user_badges').select('badge_id, badge_catalog(name, icon)').eq('user_id', user.id),
        supabase.from('user_titles').select('id, name').eq('user_id', user.id),
      ]);
      const prof = p as any;
      if (prof?.theme_color) setColor(prof.theme_color);
      if (prof?.profile_cover_url) setCoverUrl(prof.profile_cover_url);
      const sc = (prof?.trophy_showcase as any) || [];
      setShowcase(Array.isArray(sc) ? sc : []);
      setBadges(((ub as any) || []).map((b: any) => ({
        badge_id: b.badge_id, name: b.badge_catalog?.name, icon: b.badge_catalog?.icon,
      })));
      setTitles((ut as any) || []);
      setLoading(false);
    })();
  }, [user?.id]);

  const upload = async (f: File) => {
    if (!user) return;
    if (f.size > 5 * 1024 * 1024) { toast.error('Máx 5MB'); return; }
    setUploading(true);
    const ext = f.name.split('.').pop() || 'jpg';
    const path = `${user.id}/cover-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, f, { upsert: true });
    if (upErr) { toast.error('Erro ao enviar'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    setCoverUrl(publicUrl);
    setUploading(false);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      theme_color: color,
      profile_cover_url: coverUrl,
      trophy_showcase: showcase,
    } as any).eq('id', user.id);
    setSaving(false);
    if (error) { toast.error('Erro ao salvar'); return; }
    toast.success('Personalização salva ✨');
  };

  const toggle = (key: string) => {
    setShowcase(prev => prev.includes(key)
      ? prev.filter(x => x !== key)
      : prev.length >= 6 ? prev : [...prev, key]);
  };

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Preview */}
      <section className="rounded-xl overflow-hidden border border-border">
        <div className="relative h-32 bg-gradient-to-r from-primary/40 to-accent/40"
             style={coverUrl ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${color}30, transparent)` }} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur text-xs font-semibold flex items-center gap-1.5"
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
            {coverUrl ? 'Trocar banner' : 'Enviar banner'}
          </button>
          {coverUrl && (
            <button onClick={() => setCoverUrl(null)} className="absolute top-2 right-2 p-1 rounded-full bg-destructive/80 text-destructive-foreground"><X className="h-3 w-3" /></button>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
        </div>
        <div className="p-3 text-[10px] text-muted-foreground bg-card">Preview do banner — 1920×480 recomendado, máx 5MB.</div>
      </section>

      {/* Cor */}
      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Palette className="h-4 w-4" style={{ color }} /> Cor de destaque</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESETS.map(p => (
            <button key={p} onClick={() => setColor(p)}
              className={`w-9 h-9 rounded-full border-2 transition ${color === p ? 'border-foreground scale-110' : 'border-transparent'}`}
              style={{ background: p }} aria-label={p} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-10 rounded cursor-pointer bg-transparent border border-border" />
          <input type="text" value={color} onChange={e => setColor(e.target.value)} className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm font-mono" />
        </div>
      </section>

      {/* Vitrine de Troféus */}
      <section>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500" /> Vitrine de troféus ({showcase.length}/6)</h3>
        <p className="text-[11px] text-muted-foreground mb-3">Escolha até 6 conquistas para aparecerem no topo do seu perfil público.</p>
        {badges.length === 0 && titles.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">Você ainda não tem conquistas. Jogue, dê reviews e participe de torneios para desbloquear.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {badges.map(b => {
              const key = `badge:${b.badge_id}`;
              const active = showcase.includes(key);
              return (
                <button key={key} onClick={() => toggle(key)}
                  className={`p-3 rounded-xl border text-center transition ${active ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'}`}>
                  <div className="text-2xl">{b.icon || '🏆'}</div>
                  <p className="text-[10px] mt-1 line-clamp-2">{b.name || b.badge_id}</p>
                </button>
              );
            })}
            {titles.map(t => {
              const key = `title:${t.id}`;
              const active = showcase.includes(key);
              return (
                <button key={key} onClick={() => toggle(key)}
                  className={`p-3 rounded-xl border text-center transition ${active ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/40'}`}>
                  <div className="text-2xl">👑</div>
                  <p className="text-[10px] mt-1 line-clamp-2">{t.name}</p>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <button onClick={save} disabled={saving}
        className="w-full py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Salvar personalização
      </button>
    </div>
  );
}
