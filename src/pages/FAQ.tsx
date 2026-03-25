import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const faqs = [
  { q: 'Como funciona a compra de jogos digitais?', a: 'Após finalizar a compra, você receberá a chave de ativação do jogo por e-mail instantaneamente. Basta ativar na plataforma correspondente (Steam, PlayStation Store, Xbox Store, etc.).' },
  { q: 'Quais formas de pagamento são aceitas?', a: 'Aceitamos cartão de crédito (parcelado em até 12x sem juros), Pix (com desconto) e boleto bancário.' },
  { q: 'Os jogos têm garantia?', a: 'Sim! Todos os jogos possuem garantia de 30 dias. Se houver qualquer problema com a chave, faremos a substituição ou reembolso.' },
  { q: 'Em quanto tempo recebo meu jogo?', a: 'A entrega é instantânea! Após a confirmação do pagamento, a chave será enviada para o e-mail cadastrado em poucos minutos.' },
  { q: 'Posso devolver um jogo?', a: 'Caso a chave não tenha sido ativada, aceitamos devoluções em até 7 dias após a compra. Entre em contato pelo nosso canal de suporte.' },
  { q: 'Como funciona o sistema de avaliações?', a: 'Usuários logados podem avaliar jogos com notas de 0,5 a 5 estrelas. A nota média é exibida na página do produto e no catálogo.' },
  { q: 'O que é a Biblioteca do Usuário?', a: 'A Biblioteca é onde ficam todos os jogos que você comprou. Você pode organizar seus jogos por status: "Quero Jogar" ou "Já Joguei".' },
  { q: 'Como entro em contato com o suporte?', a: 'Você pode nos contatar pela página de Contato, por e-mail ou pelas redes sociais. Nosso suporte funciona 24/7.' },
];

export default function FAQ() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-10">
        <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-foreground">Perguntas Frequentes</h1>
        <p className="text-muted-foreground mt-2">Tire suas dúvidas sobre a MIDIAS</p>
      </div>
      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="bg-card border border-border rounded-xl px-4">
            <AccordionTrigger className="text-left text-foreground hover:text-primary">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
