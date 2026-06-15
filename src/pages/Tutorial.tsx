// Tutorial passo-a-passo com mini-playground interativo por tópico.
import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Sparkles, X, Star, Heart, Camera, ShoppingBag, Trophy, MessageCircle, Send, Search, User, Gamepad2, Palette } from 'lucide-react';
import { TUTORIALS, TutorialKey, useTutorial } from '@/components/tutorial/TutorialContext';
import { Button } from '@/components/ui/button';

interface Step { title: string; text: string; tip?: string; play: React.ReactNode }

// ============= Playgrounds interativos =============

function PlayProfile() {
  const [color, setColor] = useState('#14B8A6');
  const [bio, setBio] = useState('Caçador de platinas • RPGs');
  const presets = ['#14B8A6', '#A855F7', '#EF4444', '#F97316', '#22C55E', '#3B82F6'];
  return (
    <div className="space-y-3 w-full">
      <div className="h-24 rounded-xl relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${color}, ${color}80)` }}>
        <div className="absolute bottom-2 left-3 flex items-end gap-2">
          <div className="w-14 h-14 rounded-full bg-card border-4 border-background flex items-center justify-center"><User className="h-6 w-6" /></div>
          <div className="pb-1"><p className="text-white font-bold text-sm">@seu_user</p><p className="text-white/80 text-[11px]">{bio}</p></div>
        </div>
      </div>
      <div className="flex items-center gap-1.5"><Palette className="h-3.5 w-3.5" /><span className="text-[10px] uppercase tracking-wider text-muted-foreground">Cor de destaque</span></div>
      <div className="flex gap-1.5">{presets.map(p => <button key={p} onClick={() => setColor(p)} className={`w-7 h-7 rounded-full border-2 ${color===p?'border-foreground':'border-transparent'}`} style={{ background: p }} />)}</div>
      <input value={bio} onChange={e => setBio(e.target.value)} placeholder="Sua bio" className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-xs" />
    </div>
  );
}

function PlayLibrary() {
  const games = [
    { id: 1, title: 'Elden Ring', cover: 'https://picsum.photos/seed/er/200/300' },
    { id: 2, title: 'Hollow Knight', cover: 'https://picsum.photos/seed/hk/200/300' },
    { id: 3, title: 'Celeste', cover: 'https://picsum.photos/seed/ce/200/300' },
  ];
  const [statuses, setStatuses] = useState<Record<number, string>>({ 1: 'jogando', 2: 'platinado', 3: 'quero_jogar' });
  return (
    <div className="grid grid-cols-3 gap-2 w-full">
      {games.map(g => (
        <div key={g.id} className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="aspect-[3/4] bg-secondary"><img src={g.cover} alt="" className="w-full h-full object-cover" /></div>
          <div className="p-1.5">
            <p className="text-[10px] font-semibold line-clamp-1">{g.title}</p>
            <select value={statuses[g.id]} onChange={e => setStatuses(s => ({ ...s, [g.id]: e.target.value }))}
              className="w-full mt-1 px-1 py-0.5 bg-secondary text-[9px] rounded border border-border">
              <option value="quero_jogar">Quero jogar</option>
              <option value="jogando">Jogando</option>
              <option value="zerado">Zerado</option>
              <option value="platinado">Platinado 💎</option>
              <option value="abandonado">Abandonado</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

function PlayReview() {
  const [stars, setStars] = useState(4);
  const [text, setText] = useState('Uma obra-prima absoluta dos RPGs modernos.');
  return (
    <div className="space-y-2 w-full">
      <div className="flex gap-1">{[1,2,3,4,5].map(i => (
        <button key={i} onClick={() => setStars(i)}>
          <Star className={`h-6 w-6 transition ${i<=stars?'fill-yellow-400 text-yellow-400':'text-muted-foreground'}`} />
        </button>
      ))}</div>
      <input value={text} onChange={e => setText(e.target.value)} className="w-full px-3 py-2 bg-secondary rounded-lg text-xs border border-border" />
      <Button size="sm" className="bg-gradient-to-r from-primary to-accent">Publicar review ({stars}/5)</Button>
    </div>
  );
}

function PlayTournament() {
  const [joined, setJoined] = useState(false);
  return (
    <div className="space-y-2 w-full">
      <div className="bg-card border border-border rounded-xl p-3">
        <div className="flex items-center gap-2"><Trophy className="h-4 w-4 text-yellow-500" /><b className="text-sm">Copa MIDIAS</b></div>
        <p className="text-[10px] text-muted-foreground mt-1">8 jogadores · Inicia em 7 dias</p>
        <Button size="sm" onClick={() => setJoined(j => !j)} className={`mt-2 w-full ${joined ? 'bg-success' : ''}`}>
          {joined ? '✓ Inscrito' : 'Inscrever-se'}
        </Button>
      </div>
      {joined && <div className="bg-primary/10 border border-primary/30 rounded-lg p-2 text-[11px]">Você ganha grupo de chat com os outros participantes 🎮</div>}
    </div>
  );
}

function PlaySearch() {
  const [q, setQ] = useState('');
  const items = [
    { t: 'Léo Gamer', p: '@', tag: '📱+🖥' },
    { t: 'Bia Vendedora', p: '$', tag: '🖥 Web' },
    { t: 'Elden Ring', p: '', tag: '📱+🖥' },
  ];
  const f = q ? items.filter(i => i.t.toLowerCase().includes(q.toLowerCase().replace(/[@$]/g, '')) || (q.startsWith('@') && i.p === '@') || (q.startsWith('$') && i.p === '$')) : items;
  return (
    <div className="space-y-2 w-full">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder='Tente "@leo" ou "$bia"' className="w-full pl-8 pr-3 py-2 bg-secondary rounded-lg text-xs border border-border" />
      </div>
      <div className="space-y-1">
        {f.map(i => (
          <div key={i.t} className="flex items-center gap-2 p-2 bg-card border border-border rounded-lg">
            <span className="text-xs">{i.p}{i.t}</span>
            <span className="ml-auto text-[9px] px-1.5 py-0.5 bg-secondary rounded">{i.tag}</span>
          </div>
        ))}
        {f.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-2">Sem resultados</p>}
      </div>
    </div>
  );
}

function PlayConversaOpiniao() {
  const [msgs, setMsgs] = useState([{ who: 'amigo', t: '"Esse jogo é incrível!"', op: true }]);
  const [draft, setDraft] = useState('');
  return (
    <div className="space-y-2 w-full">
      {msgs.map((m, i) => (
        <div key={i} className={`p-2 rounded-lg text-xs ${m.op ? 'bg-accent/10 border-l-4 border-accent' : m.who==='eu' ? 'bg-primary/10 ml-8' : 'bg-card border border-border mr-8'}`}>
          <b className="text-[10px] uppercase">{m.op ? 'Opinião original' : m.who}</b>
          <p>{m.t}</p>
        </div>
      ))}
      <div className="flex gap-1.5">
        <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Responda..." className="flex-1 px-3 py-1.5 bg-secondary rounded-lg text-xs border border-border" />
        <Button size="sm" onClick={() => { if(draft){ setMsgs([...msgs, { who: 'eu', t: draft, op: false }]); setDraft(''); } }}><Send className="h-3 w-3" /></Button>
      </div>
    </div>
  );
}

function PlayDestaques() {
  const all = ['🎮 Elden Ring','⭐ Review HK','💬 Opinião','📸 Screenshot','🏆 Platinou','🥇 Campeão'];
  const [picked, setPicked] = useState<string[]>([]);
  return (
    <div className="space-y-2 w-full">
      <p className="text-[10px] text-muted-foreground">Selecionados: {picked.length}/6</p>
      <div className="flex flex-wrap gap-1.5">{all.map(a => (
        <button key={a} onClick={() => setPicked(p => p.includes(a) ? p.filter(x=>x!==a) : p.length<6 ? [...p, a] : p)}
          className={`px-2 py-1 rounded text-[10px] border ${picked.includes(a)?'bg-primary text-primary-foreground border-primary':'bg-card border-border'}`}>{a}</button>
      ))}</div>
    </div>
  );
}

function PlayFeedMobile() {
  return (
    <div className="space-y-1.5 w-full max-w-xs mx-auto">
      {['🎮 Léo platinou Elden Ring','⭐ Bia avaliou Hollow Knight 5★','📸 Fê postou clip de Celeste'].map((s,i)=>(
        <div key={i} className="bg-card border border-border rounded-lg p-2 text-xs">{s}</div>
      ))}
    </div>
  );
}

function PlayMarketplace() {
  const [fav, setFav] = useState(false);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden max-w-xs mx-auto">
      <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"><ShoppingBag className="h-8 w-8" /></div>
      <div className="p-2">
        <div className="flex items-center gap-1.5"><b className="text-xs">Elden Ring PS5</b><span className="text-[8px] px-1 py-0.5 bg-success/20 text-success rounded">🛡️ Protegido</span></div>
        <p className="text-sm font-bold text-primary mt-1">R$ 200,00</p>
        <div className="flex gap-1 mt-1.5">
          <Button size="sm" className="flex-1 h-7 text-[10px]">Comprar</Button>
          <button onClick={() => setFav(f=>!f)} className="px-2"><Heart className={`h-3.5 w-3.5 ${fav?'fill-red-500 text-red-500':''}`} /></button>
        </div>
      </div>
    </div>
  );
}

function PlayForum() {
  const [likes, setLikes] = useState(12);
  const [liked, setLiked] = useState(false);
  return (
    <div className="bg-card border border-border rounded-xl p-3 text-xs space-y-2 max-w-xs mx-auto">
      <p className="font-semibold">"Alguém zerou no hardcore?"</p>
      <p className="text-muted-foreground">Tô tentando há 3 semanas...</p>
      <div className="flex gap-3">
        <button onClick={() => { setLiked(l=>!l); setLikes(n=>liked?n-1:n+1); }} className="flex items-center gap-1">
          <Heart className={`h-3 w-3 ${liked?'fill-red-500 text-red-500':''}`} /> {likes}
        </button>
        <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> 5</span>
      </div>
    </div>
  );
}

function PlayChat() {
  const [m, setM] = useState(['Oi! Tudo bem?','Posso te perguntar sobre o Elden Ring?']);
  const [d, setD] = useState('');
  return (
    <div className="space-y-1.5 w-full max-w-xs mx-auto">
      {m.map((x,i) => <div key={i} className={`p-2 rounded-lg text-xs ${i%2===0?'bg-card mr-6 border border-border':'bg-primary/15 ml-6'}`}>{x}</div>)}
      <div className="flex gap-1"><input value={d} onChange={e=>setD(e.target.value)} className="flex-1 px-2 py-1.5 bg-secondary rounded text-xs" placeholder="Digite..." />
        <button onClick={()=>{if(d){setM([...m,d]);setD('');}}} className="px-2 bg-primary rounded text-primary-foreground"><Send className="h-3 w-3" /></button>
      </div>
    </div>
  );
}

function PlayAnunciar() {
  const [step, setStep] = useState(1);
  return (
    <div className="space-y-2 w-full max-w-xs mx-auto">
      <div className="flex gap-1">{[1,2,3].map(s => <div key={s} className={`flex-1 h-1 rounded-full ${s<=step?'bg-primary':'bg-muted'}`} />)}</div>
      {step===1 && <div className="aspect-video bg-secondary rounded-xl flex items-center justify-center"><Camera className="h-6 w-6 text-muted-foreground" /></div>}
      {step===2 && <input placeholder="Título" className="w-full p-2 bg-secondary rounded-lg text-xs" />}
      {step===3 && <input placeholder="R$ 0,00" className="w-full p-2 bg-secondary rounded-lg text-xs" />}
      <Button size="sm" className="w-full" onClick={() => setStep(s => s===3?1:s+1)}>{step===3?'Publicar':'Próximo'}</Button>
    </div>
  );
}

function PlayPerfilMobile() {
  const [bio, setBio] = useState('');
  return (
    <div className="space-y-2 w-full max-w-xs mx-auto">
      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"><User className="h-8 w-8 text-white" /></div>
      <input value={bio} onChange={e=>setBio(e.target.value)} placeholder="Sua bio" className="w-full p-2 bg-secondary rounded-lg text-xs" />
      <Button size="sm" className="w-full">Salvar perfil</Button>
    </div>
  );
}

// ============= Mapeamento =============
const STEPS: Record<TutorialKey, Step[]> = {
  web_perfil: [
    { title: 'Banner & Tema', text: 'Suba um banner e escolha sua cor de destaque.', tip: 'Vá em Perfil → aba Customização.', play: <PlayProfile /> },
    { title: 'Bio', text: 'Conte ao mundo que tipo de gamer você é.', play: <PlayProfile /> },
    { title: 'Vitrine de Troféus', text: 'Escolha até 6 conquistas que aparecem no topo.', play: <PlayDestaques /> },
  ],
  web_biblioteca: [
    { title: 'Status de cada jogo', text: 'Marque: quero jogar, jogando, zerado, platinado ou abandonado.', tip: 'Mude o select em qualquer card abaixo.', play: <PlayLibrary /> },
    { title: 'Capas customizadas', text: 'Clique no botão "Capa custom" em qualquer card real e suba sua arte.', play: <PlayLibrary /> },
  ],
  web_review_completa: [
    { title: 'Nota e título', text: 'Comece com nota 0.5 a 5.', play: <PlayReview /> },
    { title: 'Publicar', text: 'Sua review aparece para a comunidade depois de publicada.', play: <PlayReview /> },
  ],
  web_torneios: [
    { title: 'Inscrição', text: 'Clique e participe.', play: <PlayTournament /> },
    { title: 'Chat do torneio', text: 'Cada torneio gera um grupo automaticamente.', play: <PlayChat /> },
  ],
  web_busca_global: [
    { title: 'Busca unificada', text: 'Use @ para usuários, $ para vendedores, ou texto livre.', tip: 'Digite "@leo" ou "$bia" abaixo.', play: <PlaySearch /> },
  ],
  web_conversas_opinioes: [
    { title: 'Opinião → conversa', text: 'Toda resposta a uma opinião cria conversa privada permanente.', tip: 'Responda abaixo para ver como funciona.', play: <PlayConversaOpiniao /> },
  ],
  web_destaques: [
    { title: '6 slots fixos', text: 'Misture jogos, reviews, opiniões e screenshots.', play: <PlayDestaques /> },
  ],
  mobile_feed: [{ title: 'Atividade dos amigos', text: 'Acompanhe em tempo real o que eles estão jogando.', play: <PlayFeedMobile /> }],
  mobile_marketplace: [
    { title: 'Listagem & favoritos', text: 'Toque no coração para favoritar.', play: <PlayMarketplace /> },
    { title: 'Certificado 🛡️', text: 'Itens com selo são garantidos pela loja.', play: <PlayMarketplace /> },
  ],
  mobile_forum: [{ title: 'Curtir e responder', text: 'Toque no coração para curtir.', play: <PlayForum /> }],
  mobile_chat: [{ title: 'Conversas', text: 'Envie mensagens para amigos e vendedores.', play: <PlayChat /> }],
  mobile_anunciar: [{ title: 'Passo a passo', text: 'Foto → título → preço → publica.', play: <PlayAnunciar /> }],
  mobile_perfil: [{ title: 'Edite seu perfil', text: 'Foto, bio e configurações ficam aqui.', play: <PlayPerfilMobile /> }],
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
  const isMobile = meta.area === 'mobile';
  const realRoute = isMobile ? '/m' : '/';

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/tutoriais" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <X className="h-4 w-4" /> Sair
          </Link>
          <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
            {isMobile ? '📱 Mobile' : '🖥 Web'} • {idx + 1}/{steps.length}
          </span>
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs mb-3">
            <Sparkles className="h-3 w-3" /> Playground prático
          </div>
          <h1 className="font-display text-3xl font-bold gradient-text">{meta.title}</h1>
          <p className="text-muted-foreground mt-2 text-sm">{meta.description}</p>
        </div>

        <motion.div key={idx} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold mb-1">{step.title}</h2>
          <p className="text-muted-foreground mb-4 text-sm">{step.text}</p>
          {step.tip && <p className="text-[11px] text-primary bg-primary/10 rounded-lg px-3 py-2 mb-4">💡 {step.tip}</p>}
          <div className="bg-background/50 rounded-xl p-5 min-h-[200px] flex items-center justify-center border border-border">
            {step.play}
          </div>
        </motion.div>

        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" disabled={idx === 0} onClick={() => setIdx(i => i - 1)}>← Anterior</Button>
          <div className="flex gap-1">
            {steps.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-8 bg-primary' : 'w-1.5 bg-muted'}`} />)}
          </div>
          {isLast ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild><Link to={realRoute}>Ir pra real →</Link></Button>
              <Button size="sm" className="bg-gradient-to-r from-primary to-accent" onClick={async () => { await markSeen(meta.key); window.location.href = '/tutoriais'; }}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Concluir
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => setIdx(i => i + 1)}>Próximo <ArrowRight className="h-4 w-4 ml-1" /></Button>
          )}
        </div>
        {alreadySeen && idx === 0 && <p className="text-center text-xs text-muted-foreground mt-4">✓ Você já completou — sinta-se livre pra revisar.</p>}
      </div>
    </div>
  );
}
