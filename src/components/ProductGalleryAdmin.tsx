import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, Trash2, Loader2, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';

interface Img { id: string; image_url: string; position: number; }

export default function ProductGalleryAdmin({ productId }: { productId: string }) {
  const [imgs, setImgs] = useState<Img[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('produto_imagens' as any).select('*').eq('product_id', productId).order('position');
    setImgs((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [productId]);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { toast.error(`${file.name}: máx 5MB`); continue; }
      const ext = file.name.split('.').pop();
      const path = `gallery/${productId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file);
      if (error) { toast.error(error.message); continue; }
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
      await supabase.from('produto_imagens' as any).insert({ product_id: productId, image_url: publicUrl, position: imgs.length });
    }
    setUploading(false);
    if (ref.current) ref.current.value = '';
    toast.success('Imagens adicionadas!');
    load();
  };

  const del = async (id: string) => {
    await supabase.from('produto_imagens' as any).delete().eq('id', id);
    load();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium flex items-center gap-2"><ImagePlus className="h-4 w-4" /> Galeria adicional</div>
        <Button type="button" size="sm" variant="outline" onClick={() => ref.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />} Adicionar
        </Button>
        <input ref={ref} type="file" accept="image/*" multiple onChange={upload} className="hidden" />
      </div>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
        <div className="grid grid-cols-4 gap-2">
          {imgs.map(im => (
            <div key={im.id} className="relative group aspect-video rounded border border-border overflow-hidden">
              <img src={im.image_url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => del(im.id)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded opacity-0 group-hover:opacity-100 transition">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          {imgs.length === 0 && <p className="text-xs text-muted-foreground col-span-4 py-4 text-center">Sem imagens extras. A imagem principal já é exibida automaticamente.</p>}
        </div>
      )}
    </div>
  );
}
