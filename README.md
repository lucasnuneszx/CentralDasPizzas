# Central Das Pizzas - PDV

Sistema de PDV e delivery para pizzaria: cardápio público com checkout, painel de pedidos, controle de caixa, impressão de comandas, integração com iFood e atendimento por WhatsApp com IA (atendente "Mila").

## Stack

- Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Radix UI
- Prisma + PostgreSQL
- Autenticação com JWT (`jsonwebtoken` + `bcryptjs`)
- OpenAI API (OCR de cardápio e processamento de pedidos via WhatsApp)
- Evolution API ou WhatsApp Business API
- Deploy no Railway (Nixpacks, ver `railway.json` e `nixpacks.toml`)

## Rodando localmente

Requer Node.js 18+ e um PostgreSQL acessível.

```bash
npm install
cp env.example .env.local   # preencha os valores
npx prisma db push
npm run dev
```

Usuários padrão podem ser criados com `node scripts/create-default-users.js` ou pela rota `/api/setup/create-users`.

Outros scripts:

| Comando | Descrição |
| --- | --- |
| `npm run build` | Gera o Prisma Client e faz o build do Next |
| `npm run lint` | ESLint |
| `npm run db:push` / `db:migrate` / `db:studio` | Comandos do Prisma |
| `npm run populate:pizza` | Popula tamanhos e sabores de pizza |
| `npm run whatsapp:setup` | Verifica as credenciais de OpenAI e WhatsApp |
| `npm run whatsapp:start` | Sobe o handler de mensagens do WhatsApp |

## Variáveis de ambiente

Obrigatórias:

- `DATABASE_URL`
- `JWT_SECRET`
- `NEXTAUTH_URL` (URL pública do app, usada nos scripts e checagens)
- `NEXTAUTH_SECRET`

WhatsApp / IA:

- `OPENAI_API_KEY`
- `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE_NAME`
- `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_WEBHOOK_TOKEN`

Opcionais:

- iFood: `IFOOD_API_URL`, `IFOOD_API_KEY`, `IFOOD_API_SECRET`
- Impressora: `PRINTER_IP`, `PRINTER_PORT`, `AUTO_PRINT`
- Loja: `RESTAURANT_NAME`, `RESTAURANT_PHONE`, `RESTAURANT_EMAIL`, `RESTAURANT_ADDRESS`, `OPENING_HOURS`, `IS_OPEN`, `DELIVERY_FEE`, `DELIVERY_ESTIMATE`, `MIN_ORDER_VALUE`, `TAX_RATE`
- `SETUP_TOKEN` (protege rotas de setup)

## Estrutura

```
app/
  admin/       painel administrativo (pedidos, combos, sabores, caixa, relatórios, configurações)
  api/         rotas de API (pedidos, caixa, catálogo, iFood, WhatsApp, impressão, setup)
  client/      cardápio, checkout e acompanhamento de pedidos
  auth/        login e cadastro
components/    componentes de UI e do painel
hooks/         hooks de notificação, som contínuo e impressão
lib/           prisma, JWT, autenticação das rotas, impressão
prisma/        schema do banco
scripts/       scripts de manutenção, seed e handler do WhatsApp
docs/          notas sobre impressão, alerta sonoro, WhatsApp e deploy
```
