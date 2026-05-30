import { motion } from 'framer-motion';
import { Swords, Crown, Zap, TrendingUp, History } from 'lucide-react';

interface Storyline { id: string; kind: string; narrative: string; created_at: string }

const ICONS: Record<string, any> = {
  rivalry: Swords, revenge: History, underdog: TrendingUp, streak: Zap, record: Crown,
};
const COLORS: Record<string, string> = {
  rivalry: 'from-red-500/20 to-rose-500/10 border-red-500/30 text-red-300',
  revenge: 'from-purple-500/20 to-violet-500/10 border-purple-500/30 text-purple-300',
  underdog: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300',
  streak: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-300',
  record: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30 text-yellow-300',
};

export default function StorylinesPanel({ items }: { items: Storyline[] }) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-muted-foreground mb-3">📖 Narrativas do evento</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((s, i) => {
          const Icon = ICONS[s.kind] || Swords;
          const col = COLORS[s.kind] || COLORS.rivalry;
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`relative bg-gradient-to-br ${col} border rounded-xl p-4 backdrop-blur-sm overflow-hidden`}
            >
              <Icon className="absolute -right-4 -top-4 h-20 w-20 opacity-10" />
              <div className="flex items-start gap-3 relative">
                <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                <p className="text-sm leading-relaxed">{s.narrative}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
