import { useState } from 'react';
import { Mail, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function Contato() {
  const [form, setForm] = useState({ nome: '', email: '', assunto: '', mensagem: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.email || !form.mensagem) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success('Mensagem enviada com sucesso! Responderemos em breve.');
      setForm({ nome: '', email: '', assunto: '', mensagem: '' });
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="text-center mb-10">
        <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-foreground">Contato</h1>
        <p className="text-muted-foreground mt-2">Fale conosco — estamos aqui para ajudar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold text-foreground">E-mail</h3>
          <p className="text-sm text-muted-foreground">suporte@midias.com.br</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 text-center">
          <MessageSquare className="h-8 w-8 text-primary mx-auto mb-2" />
          <h3 className="font-semibold text-foreground">Atendimento</h3>
          <p className="text-sm text-muted-foreground">24 horas, 7 dias por semana</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">Nome *</label>
            <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:ring-2 focus:ring-primary outline-none" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">E-mail *</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:ring-2 focus:ring-primary outline-none" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Assunto</label>
          <input value={form.assunto} onChange={e => setForm({ ...form, assunto: e.target.value })} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:ring-2 focus:ring-primary outline-none" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Mensagem *</label>
          <textarea rows={5} value={form.mensagem} onChange={e => setForm({ ...form, mensagem: e.target.value })} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:ring-2 focus:ring-primary outline-none resize-none" />
        </div>
        <button type="submit" disabled={sending} className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50">
          <Send className="h-4 w-4" /> {sending ? 'Enviando...' : 'Enviar Mensagem'}
        </button>
      </form>
    </div>
  );
}
