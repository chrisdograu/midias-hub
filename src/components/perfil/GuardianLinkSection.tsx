// ECA Digital: menor solicita vínculo do responsável. Aparece só para contas de menor sem vínculo aprovado.
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ageBracket } from '@/lib/podeAcessarConteudo';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Loader2, BadgeCheck } from 'lucide-react';

export default function GuardianLinkSection() {
  const { user } = useAuth();
  const [birth, setBirth] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [pending, setPending] = useState(false);
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [full, setFull] = useState('');
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('birth_date, is_verified_account').eq('id', user.id).maybeSingle().then(({ data }) => {
      const d = data as any;
      if (d) { setBirth(d.birth_date || null); setVerified(!!d.is_verified_account); }
    });
    (supabase as any).from('guardian_link_requests').select('id')
      .eq('minor_id', user.id).eq('status', 'pending').maybeSingle()
      .then(({ data }: any) => setPending(!!data));
  }, [user?.id]);

  const bracket = ageBracket(birth);
  const isMinor = bracket === 'crianca' || bracket === 'adolescente';
  if (!isMinor && !verified) return null;

  const submit = async () => {
    if (cpf.replace(/\D/g, '').length < 11) return toast.error('CPF inválido');
    if (phone.replace(/\D/g, '').length < 8) return toast.error('Telefone inválido');
    if (full.trim().length < 3) return toast.error('Nome do responsável obrigatório');
    if (url.trim().length < 8) return toast.error('Link do atestado obrigatório');
    setSaving(true);
    const { error } = await (supabase as any).rpc('submit_guardian_link', {
      _cpf: cpf, _phone: phone, _full_name: full, _atestado_url: url,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    setPending(true); setCpf(''); setPhone(''); setFull(''); setUrl('');
    toast.success('Pedido enviado — nossa equipe vai validar em breve.');
  };

  return (
    <section className="bg-card border border-border rounded-xl p-5 mb-6 space-y-3">
      <div className="flex items-center gap-2">
        {verified ? <BadgeCheck className="h-5 w-5 text-primary" /> : <ShieldCheck className="h-5 w-5 text-primary" />}
        <p className="text-sm font-semibold">
          {verified ? 'Conta Verificada' : 'Vínculo do responsável (ECA Digital)'}
        </p>
      </div>
      {verified ? (
        <p className="text-xs text-muted-foreground">Seu responsável foi verificado. Você ganhou o badge "Conta Verificada".</p>
      ) : pending ? (
        <p className="text-xs text-muted-foreground">Pedido em análise. Você receberá uma notificação quando for revisado.</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Como você tem menos de 18 anos, precisamos verificar seu responsável. Envie os dados abaixo — a análise é feita por uma pessoa da nossa equipe.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="Nome completo do responsável" value={full} onChange={e => setFull(e.target.value)} />
            <Input placeholder="CPF do responsável" value={cpf} onChange={e => setCpf(e.target.value)} />
            <Input placeholder="Telefone do responsável" value={phone} onChange={e => setPhone(e.target.value)} />
            <Input placeholder="Link do atestado (upload em nuvem)" value={url} onChange={e => setUrl(e.target.value)} />
          </div>
          <Button size="sm" onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Enviar para verificação
          </Button>
        </>
      )}
    </section>
  );
}
