# Configurar Domínio centraldaspizzas.com no Vercel

## Passo a Passo

### 1. Adicionar Domínio no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Domains**
4. Clique em **Add Domain**
5. Digite: `centraldaspizzas.com`
6. Clique em **Add**

### 2. Configurar DNS

O Vercel fornecerá instruções de DNS. Você precisará adicionar estes registros no seu provedor de domínio:

#### Opção A: Apex Domain (centraldaspizzas.com)
```
Tipo: A
Nome: @
Valor: 76.76.21.21
```

#### Opção B: CNAME (www.centraldaspizzas.com)
```
Tipo: CNAME
Nome: www
Valor: cname.vercel-dns.com
```

#### Opção C: Recomendado (Ambos)
- Apex: `A` record → `76.76.21.21`
- www: `CNAME` → `cname.vercel-dns.com`

### 3. Configurar Variável de Ambiente

No Vercel, adicione/atualize:

```
NEXTAUTH_URL=https://centraldaspizzas.com
```

**Onde:**
- Settings → Environment Variables
- Edite `NEXTAUTH_URL`
- Valor: `https://centraldaspizzas.com`
- Ambiente: Production, Preview, Development

### 4. Verificar SSL

O Vercel configura SSL automaticamente. Aguarde alguns minutos após adicionar o domínio.

### 5. Testar

Após configurar DNS (pode levar até 48h, geralmente menos):

```bash
# Testar domínio
curl https://centraldaspizzas.com/api/health

# Testar www
curl https://www.centraldaspizzas.com/api/health
```

## URLs de Webhook

Após configurar o domínio, atualize os webhooks:

### Evolution API
```
Webhook URL: https://centraldaspizzas.com/api/whatsapp/webhook
```

### WhatsApp Business API
```
Webhook URL: https://centraldaspizzas.com/api/whatsapp/webhook
Verify Token: [seu WHATSAPP_WEBHOOK_TOKEN]
```

## Checklist

- [ ] Domínio adicionado no Vercel
- [ ] DNS configurado no provedor
- [ ] `NEXTAUTH_URL` atualizado para `https://centraldaspizzas.com`
- [ ] SSL ativado (automático no Vercel)
- [ ] Webhooks atualizados com novo domínio
- [ ] Testado acesso ao site

## Problemas Comuns

### Domínio não resolve
- Aguarde propagação DNS (até 48h)
- Verifique registros DNS no provedor
- Use: https://dnschecker.org/

### SSL não funciona
- Aguarde alguns minutos
- Verifique se DNS está correto
- Vercel configura SSL automaticamente

### Erro 404
- Verifique se projeto está deployado
- Verifique variável `NEXTAUTH_URL`
- Faça redeploy após mudanças

## Suporte

- **Vercel Docs:** https://vercel.com/docs/concepts/projects/domains
- **Vercel Support:** https://vercel.com/support

---

**Domínio configurado:** centraldaspizzas.com

