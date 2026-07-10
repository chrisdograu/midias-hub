import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { platforms } from "@/lib/gameData";
import { useProdutos } from "@/hooks/useProdutos";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";
import GameCard from "@/components/GameCard";
import BundleStoreGrid from "@/components/BundleStoreGrid";
import { GameCardGridSkeleton } from "@/components/skeletons";
import { Search, Package, X } from "lucide-react";

const PRICE_MIN = 0;
const PRICE_MAX = 500;

export default function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(searchParams.get("cat") || "Todos");
  // Plataforma agora é multi-seleção (produtos.platform é array)
  const initialPlatforms = (searchParams.get("platforms") || "").split(",").filter(Boolean);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(initialPlatforms);
  // Faixa de preço
  const initialMin = Number(searchParams.get("pmin")) || PRICE_MIN;
  const initialMax = Number(searchParams.get("pmax")) || PRICE_MAX;
  const [priceMin, setPriceMin] = useState<number>(initialMin);
  const [priceMax, setPriceMax] = useState<number>(initialMax);
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "recent");
  const { data: games = [], isLoading } = useProdutos();
  const { data: dbCategories = [] } = useQuery({
    queryKey: ['categorias'],
    queryFn: async () => {
      const { data } = await supabase.from('categorias').select('name').order('name');
      return data ? ['Todos', ...data.map(c => c.name)] : ['Todos'];
    },
    staleTime: 10 * 60_000,
  });

  useEffect(() => {
    const p = new URLSearchParams();
    if (query.trim()) p.set('q', query.trim());
    if (category !== 'Todos') p.set('cat', category);
    if (selectedPlatforms.length) p.set('platforms', selectedPlatforms.join(','));
    if (priceMin !== PRICE_MIN) p.set('pmin', String(priceMin));
    if (priceMax !== PRICE_MAX) p.set('pmax', String(priceMax));
    if (sortBy !== 'recent') p.set('sort', sortBy);
    setSearchParams(p, { replace: true });
  }, [query, category, selectedPlatforms, priceMin, priceMax, sortBy, setSearchParams]);

  const categoryOptions = dbCategories.length > 1 ? dbCategories : ["Todos"];
  const platformOptions = platforms.filter(p => p !== 'Todos');

  const togglePlatform = (p: string) => {
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const activeFilters =
    (category !== 'Todos' ? 1 : 0) +
    selectedPlatforms.length +
    (priceMin !== PRICE_MIN || priceMax !== PRICE_MAX ? 1 : 0);

  const clearFilters = () => {
    setCategory('Todos');
    setSelectedPlatforms([]);
    setPriceMin(PRICE_MIN);
    setPriceMax(PRICE_MAX);
  };

  const debouncedQuery = useDebounce(query, 200);
  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    let result = games.filter((g) => {
      const matchQuery = !q || g.title.toLowerCase().includes(q) || g.tags.some((t) => t.toLowerCase().includes(q));
      const matchCat = category === "Todos" || g.category === category;
      const matchPlat = selectedPlatforms.length === 0 || selectedPlatforms.some(p => g.platform.includes(p));
      const matchPrice = g.price >= priceMin && g.price <= priceMax;
      return matchQuery && matchCat && matchPlat && matchPrice;
    });
    switch (sortBy) {
      case "recent":
        // Padrão honesto: mais recentes primeiro (não fingimos "relevância")
        result.sort((a: any, b: any) => new Date(b.releaseDate || 0).getTime() - new Date(a.releaseDate || 0).getTime());
        break;
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "discount":
        result.sort((a, b) => b.discount - a.discount);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
    }
    return result;
  }, [games, debouncedQuery, category, selectedPlatforms, priceMin, priceMax, sortBy]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Catálogo de Jogos</h1>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome ou tag..."
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {categoryOptions.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="recent">Mais recentes</option>
            <option value="price-asc">Menor Preço</option>
            <option value="price-desc">Maior Preço</option>
            <option value="discount">Maior Desconto</option>
            <option value="rating">Melhor Avaliação</option>
          </select>
        </div>

        {/* Plataformas — múltipla escolha (jogo multi-plataforma agora aparece em todas as que ele tem) */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Plataformas</p>
          <div className="flex flex-wrap gap-2">
            {platformOptions.map(p => {
              const active = selectedPlatforms.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${active ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-foreground hover:border-primary/50'}`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Faixa de preço */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-muted-foreground">Preço</p>
            <p className="text-xs text-muted-foreground">R$ {priceMin} — R$ {priceMax}{priceMax >= PRICE_MAX ? '+' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range" min={PRICE_MIN} max={PRICE_MAX} step={10} value={priceMin}
              onChange={e => setPriceMin(Math.min(Number(e.target.value), priceMax))}
              className="flex-1 accent-primary"
            />
            <input
              type="range" min={PRICE_MIN} max={PRICE_MAX} step={10} value={priceMax}
              onChange={e => setPriceMax(Math.max(Number(e.target.value), priceMin))}
              className="flex-1 accent-primary"
            />
          </div>
        </div>

        {activeFilters > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{activeFilters} filtro(s) ativo(s)</span>
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border bg-card text-xs font-semibold hover:border-primary/60"
            >
              <X className="h-3 w-3" /> Limpar filtros
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <GameCardGridSkeleton count={12} />
      ) : (
        <>
          {!debouncedQuery && activeFilters === 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> Bundles
              </h2>
              <div className="grid grid-cols-1 sm:grid-flow-col sm:auto-cols-fr gap-4 w-full">
                <BundleStoreGrid limit={4} />
              </div>
            </section>
          )}

          <p className="text-sm text-muted-foreground mb-4">{filtered.length} jogos encontrados</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map((game, i) => (
              <GameCard key={game.id} game={game} index={i} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">Nenhum jogo encontrado.</p>
              <p className="text-sm mt-1">Tente ajustar os filtros ou buscar por outro termo.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
