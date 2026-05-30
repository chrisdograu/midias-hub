import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';

interface Props { value: number; max?: number; label?: string }

export default function HypeMeter({ value, max = 1000, label = 'HYPE' }: Props) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const tier = pct > 80 ? 'LENDÁRIO' : pct > 60 ? 'INSANO' : pct > 40 ? 'QUENTE' : pct > 20 ? 'MORNO' : 'AQUECENDO';
  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold tracking-[0.2em] uppercase text-amber-400">
          <Flame className="h-3.5 w-3.5" /> {label}
        </div>
        <span className="text-[10px] tracking-widest text-amber-400/80 font-bold">{tier}</span>
      </div>
      <div className="relative h-2.5 bg-secondary/60 rounded-full overflow-hidden border border-amber-500/20">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 relative"
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </motion.div>
      </div>
    </div>
  );
}
