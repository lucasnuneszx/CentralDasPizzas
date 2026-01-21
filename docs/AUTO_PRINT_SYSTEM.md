# Sistema de Impressão Automática de Pedidos

## Visão Geral

O sistema de impressão automática imprime automaticamente **2 notas** quando um novo pedido chega:

1. **🍳 Nota da Cozinha** - Para preparação do pedido
2. **📦 Nota de Entrega** - Para o cliente/entregador

## Como Funciona

### Fluxo Automático

1. Um novo pedido é criado (status: `PENDING`)
2. O sistema detecta o novo pedido no polling (a cada 3 segundos)
3. Se a **Impressão Automática** estiver ativada nas configurações:
   - Imprime a **Nota da Cozinha** primeiro
   - Aguarda 1.5 segundos
   - Imprime a **Nota de Entrega**
4. O diálogo de impressão do navegador abre para cada nota
5. Uma notificação confirma que o pedido foi impresso

### Como Ativar

1. Acesse o **Painel Admin** → **Configurações**
2. Role até **Configurações de Impressão**
3. Ative o toggle **"Impressão Automática"**
4. Salve as configurações

### Requisitos

- Navegador moderno (Chrome, Edge, Firefox)
- Pop-ups permitidos no navegador
- Impressora configurada no sistema operacional

## Arquivos Envolvidos

```
hooks/
  └── useAutoPrint.ts         # Hook de impressão automática

components/
  └── dashboard/
      └── active-orders.tsx    # Componente que detecta novos pedidos

lib/
  └── print-native.ts          # Funções de impressão nativa do navegador

app/
  └── api/
      └── print/
          └── route.ts         # API de busca de dados do pedido
```

## Estrutura das Notas

### Nota da Cozinha (`printType: 'kitchen'`)
- Nome do cliente
- Telefone
- Itens do pedido com quantidades
- Sabores das pizzas
- Observações especiais
- Total
- Tipo de entrega

### Nota de Entrega (`printType: 'receipt'`)
- Dados do cliente completos
- Itens com preços
- Subtotal
- Taxa de entrega (se aplicável)
- Total
- Endereço completo (se for entrega)
- Forma de pagamento

## Indicadores Visuais

Quando a impressão automática está ativada, um badge verde aparece no dashboard:

```
🖨️ Impressão Automática Ativada
```

## Logs no Console

O sistema registra logs detalhados:

```
🖨️ Impressão automática ATIVADA. Imprimindo novos pedidos...
🖨️ Iniciando impressão automática do pedido ABC12345
🍳 Imprimindo nota da COZINHA para pedido ABC12345...
📦 Imprimindo nota de ENTREGA para pedido ABC12345...
✅ Impressão automática concluída para pedido ABC12345
```

## Proteções contra Duplicatas

- Cada pedido é marcado como "impresso" após a primeira tentativa
- O sistema não imprime o mesmo pedido duas vezes
- Em caso de erro, o pedido pode ser impresso manualmente

## Impressão Manual

Mesmo com a impressão automática ativada, você pode imprimir manualmente:

1. Clique no botão **"Imprimir"** no card do pedido
2. Escolha entre:
   - **Para Cozinha** - Imprime apenas nota da cozinha
   - **Cupom Fiscal** - Imprime nota de entrega

## Troubleshooting

### Pop-ups Bloqueados
Se as impressões não abrirem, verifique se o navegador está bloqueando pop-ups para o site.

### Impressão não funciona
1. Verifique se a impressora está configurada no sistema operacional
2. Teste imprimir manualmente primeiro
3. Verifique os logs do console do navegador

### Pedido impresso várias vezes
Isso não deve acontecer com o sistema atual. Se ocorrer, limpe o cache do navegador e recarregue a página.
