# Como Configurar DNS para centraldaspizzas.com

## O que você precisa fazer

Adicionar um registro **CNAME** no seu provedor de domínio apontando para o Railway.

## Configuração DNS

### Registro necessário:

| Tipo | Nome | Valor |
|------|------|-------|
| **CNAME** | `www` | `t6k1h7tm.up.railway.app` |

## Passo a Passo por Provedor

### 1. Registro.br (Mais comum no Brasil)

1. Acesse: https://registro.br
2. Faça login na sua conta
3. Vá em **Meus Domínios** → **centraldaspizzas.com**
4. Clique em **DNS** ou **Zona DNS**
5. Clique em **Adicionar Registro** ou **Novo Registro**
6. Preencha:
   - **Tipo:** CNAME
   - **Nome/Host:** `www`
   - **Valor/Destino:** `t6k1h7tm.up.railway.app`
   - **TTL:** 3600 (ou padrão)
7. Clique em **Salvar** ou **Adicionar**
8. Aguarde a propagação (pode levar até 72h, geralmente 1-2h)

### 2. GoDaddy

1. Acesse: https://godaddy.com
2. Faça login
3. Vá em **Meus Produtos** → **DNS**
4. Role até **Registros**
5. Clique em **Adicionar**
6. Preencha:
   - **Tipo:** CNAME
   - **Nome:** `www`
   - **Valor:** `t6k1h7tm.up.railway.app`
   - **TTL:** 1 hora
7. Clique em **Salvar**

### 3. Namecheap

1. Acesse: https://namecheap.com
2. Faça login
3. Vá em **Domain List** → **Manage** → **Advanced DNS**
4. Clique em **Add New Record**
5. Selecione **CNAME Record**
6. Preencha:
   - **Host:** `www`
   - **Value:** `t6k1h7tm.up.railway.app`
   - **TTL:** Automatic
7. Clique em **Save**

### 4. Cloudflare

1. Acesse: https://cloudflare.com
2. Selecione seu domínio
3. Vá em **DNS** → **Records**
4. Clique em **Add record**
5. Preencha:
   - **Type:** CNAME
   - **Name:** `www`
   - **Target:** `t6k1h7tm.up.railway.app`
   - **Proxy status:** DNS only (desligue o proxy laranja)
6. Clique em **Save**

### 5. Hostinger / Outros

1. Acesse o painel do seu provedor
2. Procure por **DNS**, **Zona DNS** ou **Gerenciamento DNS**
3. Adicione registro CNAME:
   - Nome: `www`
   - Valor: `t6k1h7tm.up.railway.app`

## Importante

### Para o domínio raiz (centraldaspizzas.com sem www)

Alguns provedores não permitem CNAME no domínio raiz. Nesse caso:

**Opção 1: Usar apenas www**
- Configure apenas `www.centraldaspizzas.com`
- Configure redirecionamento no Railway

**Opção 2: Usar A Record (se Railway fornecer IP)**
- Se o Railway fornecer um IP, use registro A:
  - Tipo: A
  - Nome: @ (ou vazio)
  - Valor: IP fornecido pelo Railway

## Verificar se funcionou

Após adicionar o registro, aguarde alguns minutos e verifique:

### Via Terminal:
```bash
# Verificar se o DNS está resolvendo
nslookup www.centraldaspizzas.com

# Ou
dig www.centraldaspizzas.com
```

### Via Site:
- https://dnschecker.org/
- Digite: `www.centraldaspizzas.com`
- Verifique se está apontando para `t6k1h7tm.up.railway.app`

## ⏱Tempo de Propagação

- **Mínimo:** 5-15 minutos
- **Médio:** 1-2 horas
- **Máximo:** 72 horas (raro)

## Troubleshooting

### "Registro ainda não detectado"
- Aguarde mais alguns minutos
- Verifique se salvou corretamente no provedor
- Verifique se não há erros de digitação
- Limpe cache do DNS: `sudo dscacheutil -flushcache` (Mac)

### DNS não resolve
- Verifique se o registro está correto
- Aguarde mais tempo para propagação
- Verifique se o Railway está rodando

### Erro 404 após configurar
- Verifique se o serviço está rodando no Railway
- Verifique se o domínio está configurado no Railway
- Aguarde propagação completa

## Suporte

- **Registro.br:** https://registro.br/atendimento
- **Railway:** https://railway.app/help

---

**Após configurar, aguarde alguns minutos e o Railway detectará automaticamente!**

