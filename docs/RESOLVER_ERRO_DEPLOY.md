# 🔧 Resolver Erro: "Falha na verificação de integridade"

## ❌ Problema

O deploy falhou na etapa **"Rede > Verificação de integridade"** (Network > Integrity check).

## 🔍 Causa

Este erro geralmente ocorre quando:
1. **DNS não configurado** - O registro CNAME não foi adicionado
2. **DNS não propagado** - O registro foi adicionado mas ainda não propagou
3. **DNS incorreto** - O registro está apontando para o lugar errado

## ✅ Solução

### Passo 1: Verificar se o DNS está configurado

1. Acesse seu provedor de domínio (Registro.br, GoDaddy, etc.)
2. Verifique se existe o registro CNAME:
   - **Tipo:** CNAME
   - **Nome:** `www`
   - **Valor:** `t6k1h7tm.up.railway.app`

### Passo 2: Verificar propagação DNS

Abra o terminal e execute:

```bash
# Verificar se o DNS está resolvendo
nslookup www.centraldaspizzas.com

# Ou
dig www.centraldaspizzas.com
```

**Resultado esperado:**
```
www.centraldaspizzas.com → t6k1h7tm.up.railway.app
```

### Passo 3: Verificar online

Acesse: https://dnschecker.org/

1. Digite: `www.centraldaspizzas.com`
2. Selecione: **CNAME**
3. Clique em **Search**
4. Verifique se está apontando para `t6k1h7tm.up.railway.app`

### Passo 4: Se o DNS não estiver configurado

#### No Registro.br:
1. Acesse: https://registro.br
2. Login → **Meus Domínios** → **centraldaspizzas.com**
3. **DNS** → **Adicionar Registro**
4. Preencha:
   - Tipo: **CNAME**
   - Nome: `www`
   - Valor: `t6k1h7tm.up.railway.app`
5. **Salvar**

#### Em outros provedores:
- Procure por **DNS** ou **Zona DNS**
- Adicione registro CNAME:
  - Nome: `www`
  - Valor: `t6k1h7tm.up.railway.app`

### Passo 5: Aguardar propagação

- **Mínimo:** 5-15 minutos
- **Médio:** 1-2 horas
- **Máximo:** 72 horas (raro)

### Passo 6: Fazer novo deploy

Após o DNS propagar:

1. No Railway, vá em **Deployments**
2. Clique nos **3 pontos** (⋯) do deploy que falhou
3. Selecione **Redeploy** ou **Redeploy Latest**

Ou faça um novo commit:

```bash
git commit --allow-empty -m "trigger redeploy"
git push
```

## 🔄 Solução Alternativa: Usar domínio do Railway temporariamente

Se precisar testar enquanto o DNS propaga:

1. No Railway, vá em **Settings** → **Networking**
2. Use o domínio padrão: `seu-projeto.up.railway.app`
3. Configure `NEXTAUTH_URL` para esse domínio temporariamente

## 📋 Checklist

- [ ] DNS configurado no provedor
- [ ] DNS propagado (verificado via dnschecker.org)
- [ ] Registro CNAME correto
- [ ] Aguardou tempo suficiente (mínimo 15 minutos)
- [ ] Tentou redeploy após propagação

## 🆘 Se ainda não funcionar

1. **Verifique os logs:**
   - Clique em **"Ver registos"** (View logs) no Railway
   - Procure por erros específicos

2. **Verifique configuração do Railway:**
   - Settings → Networking
   - Verifique se o domínio está configurado corretamente

3. **Contate suporte:**
   - Railway: https://railway.app/help
   - Ou verifique a documentação: https://docs.railway.app

---

**Após configurar o DNS e aguardar propagação, faça um novo deploy!** ✅

