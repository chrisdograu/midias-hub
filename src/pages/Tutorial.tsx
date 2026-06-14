import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Sparkles, X } from 'lucide-react';
import { TUTORIALS, TutorialKey, useTutorial } from '@/components/tutorial/TutorialContext';
import { Button } from '@/components/ui/button';

interface Step { title: string; text: string; visual: React.ReactNode; }

const STEPS: Record<TutorialKey, Step[]> = {
  web_perfil: [
    { title: 'Banner & Tema', text: 'Suba um banner e escolha a cor do tema do seu perfil.', visual: <div className="h-40 bg-gradient-to-r from-primary to-accent rounded-xl flex items-end p-4"><div className="w-20 h-20 rounded-full bg-card border-4 border-background -mb-12 ml-2" /></div> },
    { title: 'Bio & Personalidade', text: 'Conte ao mundo que tipo de gamer você é.', visual: <div className="glass rounded-xl p-4 mt-14"><p className="font-bold">@seu_user</p><p className="text-sm text-muted-foreground mt-1">Caçador de platinas • RPGs</p></div> },
    { title: 'Troféus em Destaque', text: 'Escolha quais troféus aparecem em primeiro lugar.', visual: <div className="flex gap-2 flex-wrap">{['🥇','🥈','🥉','🎮','🏆','⭐'].map(e => <div key={e} className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center text-2xl">{e}</div>)}</div> },
  ],
  web_biblioteca: [
    { title: 'Status de Jogo', text: 'Marque cada jogo: quero jogar, jogando, zerado, platinado ou abandonado.', visual: <div className="grid grid-cols-2 gap-2">{['Jogando','Zerado','Platinado','Abandonado'].map(s => <div key={s} className="glass rounded-lg p-3 text-sm">{s}</div>)}</div> },
    { title: 'Horas & Notas', text: 'Registre horas jogadas e dê sua nota pessoal.', visual: <div className="glass rounded-xl p-4"><p className="text-3xl font-bold gradient-text">42h</p><p className="text-sm text-muted-foreground">Nota pessoal: ⭐ 4.5</p></div> },
    { title: 'Capas Customizadas', text: 'Substitua a capa padrão por uma sua para personalizar.', visual: <div className="aspect-video bg-gradient-to-br from-primary/30 to-accent/30 rounded-xl flex items-center justify-center text-sm">📸 sua capa</div> },
  ],
  web_review_completa: [
    { title: 'Título & Nota', text: 'Comece com um título cativante e uma nota de 0.5 a 5 estrelas.', visual: <div className="glass rounded-xl p-4"><p className="font-bold">"Uma obra-prima dos RPGs"</p><p className="text-warning">⭐⭐⭐⭐⭐ 5.0</p></div> },
    { title: 'Texto Longo', text: 'Escreva sua análise completa. Sem limite de caracteres.', visual: <div className="glass rounded-xl p-4 space-y-2"><div className="h-2 bg-muted rounded w-full" /><div className="h-2 bg-muted rounded w-5/6" /><div className="h-2 bg-muted rounded w-4/6" /></div> },
    { title: 'Screenshots & Publicar', text: 'Anexe screenshots e publique para o mundo.', visual: <Button className="bg-gradient-to-r from-primary to-accent">Publicar Review</Button> },
  ],
  web_torneios: [
    { title: 'Inscrição', text: 'Encontre um torneio e clique em "Inscrever-se".', visual: <Button className="bg-success">✓ Inscrito</Button> },
    { title: 'Chat do Torneio', text: 'Converse com outros participantes em tempo real.', visual: <div className="glass rounded-xl p-3 text-sm space-y-1"><p><b>Duda:</b> Bora ganhar!</p><p><b>Você:</b> Tô treinando 🔥</p></div> },
    { title: 'Brackets & Partidas', text: 'Acompanhe seu progresso no bracket e dispute partidas.', visual: <div className="glass rounded-xl p-4 text-center">🏆 Final: <b>Você</b> vs Léo</div> },
  ],
  web_busca_global: [
    { title: 'Busca Unificada', text: 'Digite qualquer coisa: jogo, usuário (@), vendedor ($).', visual: <input readOnly value="@leo" className="w-full p-3 bg-card border border-border rounded-xl" /> },
    { title: 'Tags de Plataforma', text: 'Resultados mostram se estão no Mobile 📱 ou Web 🖥.', visual: <div className="flex gap-2"><span className="px-2 py-1 rounded bg-primary/20 text-xs">📱 Mobile</span><span className="px-2 py-1 rounded bg-accent/20 text-xs">🖥 Web</span></div> },
    { title: 'Abrir versão alternativa', text: 'Se um resultado só existe em outra plataforma, oferecemos o link direto.', visual: <Button variant="outline">Abrir versão Mobile →</Button> },
  ],
  web_conversas_opinioes: [
    { title: 'Opinião pública', text: 'Alguém posta opinião sobre um jogo.', visual: <div className="glass rounded-xl p-3 text-sm">"Esse jogo é incrível!"</div> },
    { title: 'Você responde', text: 'Sua resposta vira uma conversa privada permanente.', visual: <div className="glass rounded-xl p-3 text-sm border-l-4 border-primary">→ "Concordo! Que parte mais gostou?"</div> },
    { title: 'Acessar depois', text: 'Tudo fica em "Conversas de Opiniões" no seu perfil.', visual: <Button variant="outline">Ver minhas conversas</Button> },
  ],
  web_destaques: [
    { title: '6 slots fixos', text: 'Escolha até 6 itens para destacar no topo do perfil.', visual: <div className="grid grid-cols-3 gap-2">{[1,2,3,4,5,6].map(n => <div key={n} className="aspect-square rounded-lg bg-muted/30 border border-dashed border-border" />)}</div> },
    { title: 'Tipos variados', text: 'Pode ser jogo, review, opinião ou screenshot.', visual: <div className="flex gap-2 flex-wrap">{['🎮 Jogo','⭐ Review','💬 Opinião','📸 Screenshot'].map(t => <span key={t} className="px-2 py-1 rounded bg-card border border-border text-xs">{t}</span>)}</div> },
  ],
  mobile_feed: [
    { title: 'Atividade dos amigos', text: 'Veja o que seus amigos estão jogando.', visual: <div className="glass rounded-xl p-3 text-sm">🎮 Léo platinou Elden Ring</div> },
  ],
  mobile_marketplace: [
    { title: 'Listagem', text: 'Anúncios de venda, troca e bundles.', visual: <div className="grid grid-cols-2 gap-2"><div className="aspect-square bg-muted/30 rounded-lg" /><div className="aspect-square bg-muted/30 rounded-lg" /></div> },
    { title: 'Certificado 🛡️', text: 'Itens com selo são garantidos pela loja.', visual: <span className="px-3 py-1 rounded-full bg-success/20 text-success text-xs">🛡️ Protegido</span> },
  ],
  mobile_forum: [
    { title: 'Tópicos por jogo', text: 'Cada jogo tem seu próprio fórum.', visual: <div className="glass rounded-xl p-3 text-sm">"Alguém zerou no hardcore?"</div> },
  ],
  mobile_chat: [
    { title: 'Conversas', text: 'DMs com amigos, grupos e vendedores.', visual: <div className="glass rounded-xl p-3 text-sm">💬 3 conversas ativas</div> },
  ],
  mobile_anunciar: [
    { title: 'Foto + descrição', text: 'Sua primeira foto vira capa do anúncio.', visual: <div className="aspect-video bg-muted/30 rounded-xl" /> },
    { title: 'Tipo & preço', text: 'Venda, troca ou bundle. Defina o preço.', visual: <div className="glass rounded-xl p-3 text-sm">R$ <b>250,00</b></div> },
  ],
  mobile_perfil: [
    { title: 'Bio & foto', text: 'Conte quem você é e suba uma foto.', visual: <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent mx-auto" /> },
  ],
};

export default function Tutorial() {
  const { key } = useParams<{ key: TutorialKey }>();
  const meta = TUTORIALS.find(t => t.key === key);
  const steps = key ? STEPS[key] : null;
  const { markSeen, seen } = useTutorial();
  const [idx, setIdx] = useState(0);

  if (!meta || !steps) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold">Tutorial não encontrado</h1>
        <Link to="/tutoriais" className="text-primary mt-4 inline-block">← Ver todos</Link>
      </div>
    );
  }

  const step = steps[idx];
  const isLast = idx === steps.length - 1;
  const alreadySeen = seen.has(meta.key);

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/tutoriais" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <X className="h-4 w-4" /> Sair do tutorial
          </Link>
          <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
            {meta.area === 'web' ? '🖥 Web' : '📱 Mobile'} • {idx + 1}/{steps.length}
          </span>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs mb-3">
            <Sparkles className="h-3 w-3" /> Tutorial prático
          </div>
          <h1 className="font-display text-3xl font-bold gradient-text">{meta.title}</h1>
          <p className="text-muted-foreground mt-2">{meta.description}</p>
        </div>

        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 mb-6"
        >
          <h2 className="text-xl font-bold mb-2">{step.title}</h2>
          <p className="text-muted-foreground mb-6">{step.text}</p>
          <div className="bg-background/50 rounded-xl p-6 min-h-[180px] flex items-center justify-center">
            {step.visual}
          </div>
        </motion.div>

        <div className="flex justify-between items-center">
          <Button variant="outline" disabled={idx === 0} onClick={() => setIdx(i => i - 1)}>
            ← Anterior
          </Button>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-8 bg-primary' : 'w-1.5 bg-muted'}`} />
            ))}
          </div>
          {isLast ? (
            <Button
              className="bg-gradient-to-r from-primary to-accent"
              onClick={async () => { await markSeen(meta.key); window.location.href = '/tutoriais'; }}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" /> Concluir
            </Button>
          ) : (
            <Button onClick={() => setIdx(i => i + 1)}>
              Próximo <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>

        {alreadySeen && idx === 0 && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            ✓ Você já completou este tutorial — sinta-se à vontade pra revisar.
          </p>
        )}
      </div>
    </div>
  );
}
