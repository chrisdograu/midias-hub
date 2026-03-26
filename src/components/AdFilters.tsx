import { X } from 'lucide-react';

export interface AdFilterState {
  adType: string;
  category: string;
  platform: string;
  condition: string;
  certificate: string;
  minPrice: string;
  maxPrice: string;
}

export const defaultFilters: AdFilterState = {
  adType: '', category: '', platform: '', condition: '', certificate: '', minPrice: '', maxPrice: '',
};

interface AdFiltersProps {
  filters: AdFilterState;
  onChange: (f: AdFilterState) => void;
  onClose: () => void;
}

const selectClass = "w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50";
const inputClass = selectClass;

export default function AdFilters({ filters, onChange, onClose }: AdFiltersProps) {
  const set = (key: keyof AdFilterState, val: string) => onChange({ ...filters, [key]: val });

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Filtros</h3>
        <div className="flex gap-2">
          <button onClick={() => onChange(defaultFilters)} className="text-xs text-muted-foreground hover:text-primary">Limpar</button>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <select value={filters.adType} onChange={e => set('adType', e.target.value)} className={selectClass}>
          <option value="">Tipo</option>
          <option value="venda">Venda</option>
          <option value="troca">Troca</option>
        </select>
        <select value={filters.category} onChange={e => set('category', e.target.value)} className={selectClass}>
          <option value="">Categoria</option>
          <option value="jogo_fisico">Jogo Físico</option>
          <option value="jogo_digital">Jogo Digital</option>
          <option value="console">Console</option>
          <option value="acessorio">Acessório</option>
        </select>
        <select value={filters.platform} onChange={e => set('platform', e.target.value)} className={selectClass}>
          <option value="">Plataforma</option>
          {['PC', 'PS5', 'PS4', 'Xbox Series', 'Xbox One', 'Switch'].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={filters.condition} onChange={e => set('condition', e.target.value)} className={selectClass}>
          <option value="">Conservação</option>
          <option value="novo">Novo</option>
          <option value="seminovo">Seminovo</option>
          <option value="usado">Usado</option>
        </select>
        <select value={filters.certificate} onChange={e => set('certificate', e.target.value)} className={selectClass}>
          <option value="">Certificado</option>
          <option value="com_certificado">Com Certificado</option>
          <option value="sem_certificado">Sem Certificado</option>
        </select>
        <div className="flex gap-2">
          <input type="number" placeholder="Min R$" value={filters.minPrice} onChange={e => set('minPrice', e.target.value)} className={inputClass} />
          <input type="number" placeholder="Max R$" value={filters.maxPrice} onChange={e => set('maxPrice', e.target.value)} className={inputClass} />
        </div>
      </div>
    </div>
  );
}
