import { ScrollText } from 'lucide-react';

const sections = [
  { title: '1. Aceitação dos Termos', content: 'Ao acessar e utilizar a plataforma MIDIAS, você concorda com estes Termos de Uso. Caso não concorde, recomendamos que não utilize nossos serviços.' },
  { title: '2. Descrição do Serviço', content: 'A MIDIAS é uma plataforma de comércio eletrônico especializada na venda de jogos digitais (chaves de ativação). Os produtos são entregues digitalmente via e-mail após a confirmação do pagamento.' },
  { title: '3. Cadastro e Conta', content: 'Para realizar compras, é necessário criar uma conta com informações verídicas. O usuário é responsável pela segurança de suas credenciais de acesso e por todas as atividades realizadas em sua conta.' },
  { title: '4. Compras e Pagamentos', content: 'Os preços são exibidos em Reais (BRL) e podem sofrer alterações sem aviso prévio. Aceitamos cartão de crédito, Pix e boleto bancário. O pedido será processado após a confirmação do pagamento.' },
  { title: '5. Entrega Digital', content: 'As chaves de ativação são enviadas automaticamente para o e-mail cadastrado após a confirmação do pagamento. O prazo de entrega é imediato para pagamentos via cartão e Pix, e de até 3 dias úteis para boleto.' },
  { title: '6. Política de Reembolso', content: 'Chaves não ativadas podem ser reembolsadas em até 7 dias após a compra. Chaves já ativadas não são elegíveis para reembolso, exceto em caso de defeito comprovado.' },
  { title: '7. Avaliações', content: 'Usuários logados podem avaliar produtos com notas de 0,5 a 5 estrelas. A MIDIAS se reserva o direito de remover avaliações que violem nossas políticas.' },
  { title: '8. Propriedade Intelectual', content: 'Todo o conteúdo da plataforma (design, logotipos, textos) é de propriedade da MIDIAS ou de seus parceiros. É proibida a reprodução sem autorização.' },
  { title: '9. Limitação de Responsabilidade', content: 'A MIDIAS não se responsabiliza por problemas de ativação causados pelas plataformas de destino (Steam, PlayStation, Xbox, etc.) ou por uso indevido das chaves.' },
  { title: '10. Alterações nos Termos', content: 'Estes termos podem ser atualizados a qualquer momento. Recomendamos verificar periodicamente. O uso continuado da plataforma constitui aceitação das alterações.' },
];

export default function TermosDeUso() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-10">
        <ScrollText className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-foreground">Termos de Uso</h1>
        <p className="text-muted-foreground mt-2">Última atualização: Março de 2026</p>
      </div>
      <div className="space-y-6">
        {sections.map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">{s.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{s.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
