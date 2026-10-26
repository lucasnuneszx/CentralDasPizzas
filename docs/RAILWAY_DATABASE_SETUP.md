# 🗄️ Configurar DATABASE_URL no Railway

## ❌ Erro

```
Error: Environment variable not found: DATABASE_URL
```

## ✅ Solução

### Opção 1: Usar PostgreSQL do Railway (Recomendado)

1. **Criar banco de dados PostgreSQL:**
   - No Railway, clique em **"New"** → **"Database"** → **"Add PostgreSQL"**
   - Aguarde a criação (alguns segundos)

2. **Obter DATABASE_URL:**
   - Clique no banco de dados criado
   - Vá na aba **"Variables"**
   - Copie o valor de `DATABASE_URL`
   - Formato: `postgresql://user:password@host:port/database?sslmode=require`

3. **Adicionar no serviço web:**
   - Volte para o serviço **"web"**
   - Vá em **"Variables"**
   - Clique em **"New Variable"**
   - Nome: `DATABASE_URL`
   - Valor: Cole o `DATABASE_URL` copiado do banco
   - Clique em **"Add"**

4. **Fazer redeploy:**
   - Vá em **"Deployments"**
   - Clique nos **3 pontos** (⋯) do último deploy
   - Selecione **"Redeploy"**

### Opção 2: Usar banco externo (Supabase, Neon, etc.)

Se você já tem um banco PostgreSQL externo:

1. **No serviço web do Railway:**
   - Vá em **"Variables"**
   - Clique em **"New Variable"**
   - Nome: `DATABASE_URL`
   - Valor: `postgresql://user:password@host:port/database?sslmode=require`
   - Clique em **"Add"**

2. **Fazer redeploy**

### Opção 3: Usar SQLite (Apenas desenvolvimento - NÃO recomendado para produção)

⚠️ **Atenção:** SQLite não é recomendado para produção no Railway.

Se quiser usar temporariamente:

1. **No serviço web:**
   - Vá em **"Variables"**
   - Adicione: `DATABASE_URL=file:./prisma/prod.db`
   
2. **Atualizar schema.prisma:**
   - Mude `provider = "postgresql"` para `provider = "sqlite"`

## 🔧 Após Configurar

### 1. Fazer Migração do Banco

Após adicionar `DATABASE_URL`, você precisa criar as tabelas:

**Opção A: Via Railway (Recomendado)**
- O Railway executará `prisma generate` automaticamente
- Mas você precisa rodar `prisma db push` ou `prisma migrate deploy`

**Opção B: Via Script**

Crie um script de setup no `package.json`:

```json
{
  "scripts": {
    "railway:setup": "prisma generate && prisma db push && node scripts/create-default-users.js"
  }
}
```

E configure no Railway:
- Settings → Build Command: `npm run railway:setup`
- Ou adicione como script de start

### 2. Criar Usuários Iniciais

Após o banco estar configurado, acesse:

```
https://www.centraldaspizzas.com/api/setup/create-users
```

Ou execute localmente conectado ao banco do Railway:

```bash
DATABASE_URL="postgresql://..." node scripts/create-default-users.js
```

## 📋 Checklist

- [ ] Banco PostgreSQL criado no Railway
- [ ] `DATABASE_URL` copiado do banco
- [ ] `DATABASE_URL` adicionado nas variáveis do serviço web
- [ ] Redeploy feito
- [ ] Tabelas criadas (via `prisma db push`)
- [ ] Usuários criados (via `/api/setup/create-users`)

## 🚨 Troubleshooting

### Erro: "relation does not exist"
- Execute: `prisma db push` ou `prisma migrate deploy`
- Ou acesse: `/api/setup/create-users` (criará as tabelas automaticamente)

### Erro: "connection refused"
- Verifique se o `DATABASE_URL` está correto
- Verifique se o banco está rodando no Railway
- Verifique se há firewall bloqueando

### Erro: "SSL required"
- Adicione `?sslmode=require` no final do `DATABASE_URL`
- Ou use: `?sslmode=no-verify` (menos seguro)

---

**Após configurar DATABASE_URL, faça redeploy!** ✅

