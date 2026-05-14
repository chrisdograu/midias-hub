import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface Props {
  productId: string;
  mainImage: string;
  title: string;
}

export default function ProductGallery({ productId, mainImage, title }: Props) {
  const [images, setImages] = useState<string[]>([mainImage]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
    setImages([mainImage]);
    (async () => {
      const { data } = await supabase
        .from('produto_imagens' as any)
        .select('image_url, position')
        .eq('product_id', productId)
        .order('position', { ascending: true });
      const extra = ((data as any) || []).map((r: any) => r.image_url as string);
      const all = [mainImage, ...extra.filter((u: string) => u && u !== mainImage)];
      setImages(all);
    })();
  }, [productId, mainImage]);

  return (
    <div className="space-y-3">
      <motion.div key={active} initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} className="relative rounded-xl overflow-hidden aspect-video bg-secondary/30">
        <img src={images[active]} alt={title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent pointer-events-none" />
      </motion.div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
          {images.slice(0, 12).map((src, i) => (
            <button
              key={src + i}
              onClick={() => setActive(i)}
              className={`relative aspect-video rounded-md overflow-hidden border-2 transition-all ${i === active ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}
              aria-label={`Imagem ${i + 1}`}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
