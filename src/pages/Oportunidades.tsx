import OrbitRadar from '@/components/radar/OrbitRadar';
import OpportunityCenter from '@/components/opportunity/OpportunityCenter';

export default function Oportunidades() {
  return (
    <div className="min-h-screen bg-background py-8 space-y-10">
      <header className="container mx-auto px-4">
        <h1 className="font-display text-3xl font-bold gradient-text">Centro de Oportunidades</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sinais explicáveis — você sempre vê <em>por que</em> algo apareceu aqui.
        </p>
      </header>
      {/* Mesmo `limit` que o OpportunityCenter usa internamente, para compartilhar o cache React Query (`['radar-delta', 8]`) e evitar 2x fetches do radar na mesma rota. */}
      <OrbitRadar limit={8} />

      <OpportunityCenter />
    </div>
  );
}
