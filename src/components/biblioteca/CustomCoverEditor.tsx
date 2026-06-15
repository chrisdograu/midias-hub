// Modal de capa customizada para um jogo da biblioteca.
// Grava em library_custom_covers; quando existe, sobrescreve a capa padrão do produto.
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Camera, Loader2, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  productId: string;
  productTitle: string;
  defaultImage: string | null;
  open: boolean;
  onClose: () => void;
  onSaved?: (newUrl: string | null) => void;
}

export default function CustomCoverEditor({ productId, productTitle, defaultImage, open, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [current, setCurrent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const { data } = await supabase
        .from('library_custom_covers' as any)
        .select('image_url')
        .eq('user_id', user.id).eq('product_id', productId).maybeSingle();
      setCurrent((data as any)?.image_url || null);
      setLoading(false);
    })();
  }, [open, user?.id, productId]);

  const handleFile = async (f: File) => {
    if (!user) return;
    if (f.size > 3 * 1024 * 1024) { toast.error('Máx 3MB'); return; }
    setUploading(true);
    const ext = f.name.split('.').pop() || 'jpg';
    const path = `custom-covers/${user.id}/${productId}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('product-images').upload(path, f, { upsert: true });
    if (upErr) { toast.error('Erro ao enviar'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
    const { error } = await supabase.from('library_custom_covers' as any).upsert({
      user_id: user.id, product_id: productId, image_url: publicUrl,
    }, { onConflict: 'user_id,product_id' });
    setUploading(false);
    if (error) { toast.error('Erro ao salvar'); return; }
    setCurrent(publicUrl);
    onSaved?.(publicUrl);
    toast.success('Capa custom salva!');
  };

  const remove = async () => {
    if (!user) return;
    await supabase.from('library_custom_covers' as any).delete().eq('user_id', user.id).eq('product_id', productId);
    setCurrent(null);
    onSaved?.(null);
    toast.success('Voltou à capa padrão');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm">Capa customizada · {productTitle}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary"><X className="h-4 w-4" /></button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
        ) : (
          <>
            <div className="aspect-[3/4] max-h-72 mx-auto rounded-xl overflow-hidden bg-secondary mb-3">
              <img src={current || defaultImage || '/placeholder.svg'} alt={productTitle} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {current ? 'Trocar capa custom' : 'Enviar capa custom'}
              </button>
              {current && (
                <button onClick={remove} className="w-full py-2 rounded-lg bg-destructive/10 text-destructive font-medium flex items-center justify-center gap-2 text-sm">
                  <Trash2 className="h-3.5 w-3.5" /> Voltar à capa padrão
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 text-center">Visível só para você na sua biblioteca.</p>
          </>
        )}
      </div>
    </div>
  );
}
