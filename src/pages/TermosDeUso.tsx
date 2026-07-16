import { ScrollText } from 'lucide-react';

const LAST_UPDATE = '16 de julho de 2026';

const sections = [
  {
    title: '1. O que é a MIDIAS',
    content:
      'A MIDIAS é uma plataforma acadêmica (TCC) que combina três coisas: (a) uma loja online de chaves de ativação de jogos digitais operada pela própria plataforma, (b) um marketplace entre usuários (C2C) para anúncios e trocas, e (c) uma comunidade com fórum, avaliações, torneios e biblioteca social. Ao usar qualquer parte do serviço, você concorda com estes Termos.',
  },
  {
    title: '2. Contexto acadêmico e pagamentos simulados',
    content:
      'Este é um projeto acadêmico. Os checkouts (Pix, cartão, boleto) são simulados — nenhum valor é efetivamente cobrado, e nenhuma chave real é entregue quando o preço é fictício. Descontos, parcelamento e status de pedido existem apenas para demonstração das regras de negócio.',
  },
  {
    title: '3. Cadastro, conta e responsabilidade',
    content:
      'Para comprar, anunciar, avaliar ou participar da comunidade é necessário criar uma conta com dados verídicos. Você é responsável por manter suas credenciais em segurança e por tudo o que acontece na sua conta. A verificação de identidade adicional pode ser exigida para se tornar vendedor no marketplace C2C.',
  },
  {
    title: '4. Loja da plataforma (chaves digitais)',
    content:
      'As chaves de ativação vendidas diretamente pela MIDIAS são entregues por e-mail e/ou disponibilizadas na sua biblioteca após confirmação simulada do pagamento. Preços estão em Reais (BRL) e podem mudar sem aviso. A ativação depende da plataforma de destino (Steam, PSN, Xbox, etc.), e a MIDIAS não se responsabiliza por indisponibilidades ou mudanças de política dessas plataformas.',
  },
  {
    title: '5. Marketplace entre usuários (C2C)',
    content:
      'Anúncios criados por usuários são de responsabilidade exclusiva de quem os publica. A MIDIAS oferece ferramentas de mediação (chat, denúncias, certificados de proteção, avaliação de vendedor), mas não é parte da negociação e não garante a autenticidade das chaves revendidas. Trocas e vendas C2C ocorrem por conta e risco dos envolvidos, salvo quando cobertas explicitamente por um Certificado de Proteção ativo.',
  },
  {
    title: '6. Reembolso e cancelamento',
    content:
      'Chaves compradas diretamente da loja podem ser reembolsadas em até 7 dias corridos SE não tiverem sido ativadas — a ativação é verificada com a plataforma de destino quando possível. Chaves já ativadas não são reembolsáveis, exceto por defeito comprovado. Vendas C2C seguem o combinado entre as partes, com o Certificado de Proteção da MIDIAS servindo como árbitro quando aplicável. Pedidos podem ser cancelados por você enquanto estiverem no status "pendente".',
  },
  {
    title: '7. Conteúdo gerado por usuário',
    content:
      'Reviews, opiniões, comentários de fórum, mensagens em torneios e anúncios são conteúdo do usuário. Ao publicar, você declara ter direito sobre esse conteúdo e concede à MIDIAS licença não-exclusiva para exibi-lo dentro da plataforma. Reviews de jogo só podem ser feitas por quem tem o jogo na biblioteca com posse comprovada (não vale "quero jogar"). Denúncias podem ser abertas por qualquer usuário e são revisadas por moderação humana.',
  },
  {
    title: '8. Comportamento proibido e banimento',
    content:
      'É proibido: fraude, revenda de chaves obtidas ilicitamente, discurso de ódio, assédio, spam, evasão de banimento com contas alternativas, tentar acessar dados de outros usuários, e uso automatizado sem autorização. A MIDIAS pode suspender temporariamente ou banir contas que violem estas regras — banimentos ativos bloqueiam login, compras, avaliações e mensagens. Você é notificado do motivo e do prazo quando aplicável.',
  },
  {
    title: '9. Privacidade da biblioteca e do perfil',
    content:
      'Sua biblioteca de jogos pode ser configurada como Pública, Amigos ou Privada. Exceções granulares (dar acesso a alguém específico a uma parte do conteúdo social) são geridas em "Central de Privacidade". Perfis públicos exibem apenas o que você escolheu expor. Administradores só acessam sua biblioteca em contexto de denúncia ativa e com justificativa registrada em log auditável.',
  },
  {
    title: '10. Torneios e comunidade',
    content:
      'Torneios podem ter transmissão ao vivo (Modo Live) acompanhada por moderadores. Resultados reportados em partidas com moderador ativo na transmissão podem ser marcados como "verificados ao vivo". Fora desse cenário, o resultado depende do reporte dos participantes — trapaça pode levar a desqualificação e banimento.',
  },
  {
    title: '11. Cancelar ou excluir sua conta',
    content:
      'Você pode encerrar sua conta a qualquer momento em Configurações → Conta. Excluir a conta remove seus dados pessoais e desassocia (anonimiza) conteúdo que precisa ser preservado por integridade histórica (pedidos, avaliações, denúncias respondidas). Chaves não utilizadas na sua biblioteca são perdidas ao excluir a conta — faça o download antes.',
  },
  {
    title: '12. Propriedade intelectual da plataforma',
    content:
      'O código, o design, os textos institucionais, a marca "MIDIAS" e a paleta visual (Teal/Purple, tipografia Orbitron/Inter) pertencem aos autores do projeto. Reprodução fora do escopo acadêmico requer autorização.',
  },
  {
    title: '13. Alterações destes Termos',
    content:
      'Podemos atualizar estes Termos. Mudanças relevantes são sinalizadas no topo da plataforma e a data de "última atualização" abaixo reflete a versão vigente. O uso continuado após a atualização significa aceitação.',
  },
  {
    title: '14. Contato',
    content:
      'Dúvidas, pedidos de correção de dados ou reclamações: use a página de Contato ou abra um ticket em Configurações → Suporte. Retornamos por e-mail no endereço cadastrado.',
  },
];

export default function TermosDeUso() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-10">
        <ScrollText className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-foreground">Termos de Uso</h1>
        <p className="text-muted-foreground mt-2">Última atualização: {LAST_UPDATE}</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xl mx-auto">
          Texto em linguagem simples — reflete o funcionamento real da plataforma acadêmica. Não substitui parecer jurídico
          formal para operação comercial fora do escopo do TCC.
        </p>
      </div>
      <div className="space-y-6">
        {sections.map((s, i) => (
          <section key={i} className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">{s.title}</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{s.content}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
