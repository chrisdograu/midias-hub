import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface LightboxItem {
  url: string;
  caption?: string;
  author?: string;
}

interface Props {
  items: LightboxItem[];
  startIndex: number;
  onClose: () => void;
}

export default function MediaLightbox({ items, startIndex, onClose }: Props) {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, items.length - 1));
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items.length, onClose]);

  if (!items.length) return null;
  const current = items[idx];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
        onClick={onClose}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-card/40 hover:bg-card/80 text-foreground z-10">
          <X className="h-5 w-5" />
        </button>
        {idx > 0 && (
          <button onClick={(e) => { e.stopPropagation(); setIdx(idx - 1); }}
            className="absolute left-4 p-3 rounded-full bg-card/40 hover:bg-card/80 text-foreground z-10">
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {idx < items.length - 1 && (
          <button onClick={(e) => { e.stopPropagation(); setIdx(idx + 1); }}
            className="absolute right-4 p-3 rounded-full bg-card/40 hover:bg-card/80 text-foreground z-10">
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
        <motion.div
          key={idx}
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-[92vw] max-h-[92vh] flex flex-col items-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <img src={current.url} className="max-w-full max-h-[80vh] rounded-lg object-contain" alt="" />
          {(current.author || current.caption) && (
            <div className="text-center text-sm text-foreground/90">
              {current.author && <span className="font-semibold">{current.author}</span>}
              {current.caption && <span className="text-muted-foreground"> · {current.caption}</span>}
              <p className="text-xs text-muted-foreground mt-1">{idx + 1} / {items.length}</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
