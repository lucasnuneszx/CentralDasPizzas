# Guia de Teste do Sistema de Alerta Sonoro

## Passo a Passo para Testar

### 1. **Verificar Permissões de Áudio**
   - Navegador deve permitir áudio automático
   - Teste em modo incógnito se bloqueado

### 2. **Acessar a Página de Pedidos**
   - URL: `http://localhost:3000/admin/orders`
   - Certifique-se de estar logado como ADMIN/MANAGER/CASHIER

### 3. **Criar um Novo Pedido de Teste**
   - Via dashboard de clientes: `http://localhost:3000/client`
   - Via API: POST `/api/orders`
   - Status deve ser: `PENDING`

### 4. **Observar o Alerta Sonoro**
   - Notificação vermelha deve aparecer no canto superior direito
   - Som de alerta deve tocar imediatamente
   - Som deve repetir a cada 2.5 segundos
   - Número do pedido e valor devem ser exibidos

### 5. **Testar Controles**
   
   **Botão ACEITAR**:
   - Clique para aceitar o pedido
   - Som deve parar
   - Pedido deve ser marcado como CONFIRMED
   - Alerta deve desaparecer

   **Botão Mutar/Desmutar**:
   - Clique para silenciar som temporariamente
   - Ícone deve mudar de alto-falante para mudo
   - Som deve parar (mas pedido permanece pendente)
   - Clique novamente para restaurar som
   - Som deve retomar

   **Botão Fechar (X)**:
   - Clique para fechar alerta (não recomendado)
   - Som continuará tocando
   - Deve aceitar/rejeitar para parar definitivamente

### 6. **Múltiplos Pedidos Simultâneos**
   - Crie 2 ou mais pedidos PENDING rapidamente
   - Alerta deve aparecer para o primeiro
   - Contador deve mostrar quantidade total de pendentes
   - Aceite o primeiro pedido
   - Alerta deve aparecer para o segundo

### 7. **Testar Web Audio API Fallback**
   - Remova/bloqueia arquivo de áudio em `/public/sounds/`
   - Crie novo pedido
   - Som de síntese deve ser ouvido mesmo assim

## Observações Importantes

### Som Padrão
- **Duração**: 0.4 segundos
- **Intervalo**: 2.5 segundos
- **Frequências**: 800Hz + 1200Hz (síntese)
- **Volume**: Máximo (100%)

### Navegadores Testados
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Possíveis Problemas e Soluções

| Problema | Solução |
|----------|---------|
| Som não funciona | Verificar volume dispositivo, testar em incógnito |
| Alerta não aparece | F5 atualizar página, verificar console |
| Som contínuo após fechar aba | Fechar aba completamente |
| Volume muito baixo | Está no máximo, aumentar volume do dispositivo |

## Checklist de Validação

- [ ] Novo pedido cria alerta visual
- [ ] Som toca automaticamente
- [ ] Som toca a cada 2.5 segundos
- [ ] Botão ACEITAR para o som imediatamente
- [ ] Múltiplos pedidos mostram contador correto
- [ ] Mutar/Desmutar funciona sem aceitar
- [ ] Página funciona com/sem arquivo de áudio customizado
- [ ] Web Audio API funciona como fallback
- [ ] Aceitar pedido remove o alerta
- [ ] Rejeitar pedido remove o alerta
- [ ] Página não trava com alerta ativo

## Cenários de Teste

### Cenário 1: Fluxo Normal
1. Crie 1 pedido PENDING
2. Observe alerta com som
3. Clique ACEITAR
4. Verifique som para
5. Esperado: Tudo funciona normalmente

### Cenário 2: Ignorar Alerta
1. Crie 1 pedido PENDING
2. Observe alerta com som
3. Clique X para fechar
4. Aguarde 5 segundos
5. Esperado: Som continua tocando

### Cenário 3: Múltiplos Pedidos
1. Crie 3 pedidos PENDING rapidamente
2. Observe alerta do primeiro
3. Aceite primeiro pedido
4. Observe alerta do segundo aparecer
5. Esperado: Alerta troca de pedido automaticamente

### Cenário 4: Mutar
1. Crie 1 pedido PENDING
2. Ouça som tocar
3. Clique botão mutar
4. Esperado: Som para mas alerta fica ativo
5. Clique novamente
6. Esperado: Som retoma

## Relatando Bugs

Se encontrar algum problema:

1. **Anote o Navegador e Versão**
2. **Abra Console** (F12)
3. **Procure Erros** em vermelho
4. **Capture os Erros** e descreva os passos
5. **Reporte** em um issue

### Exemplo de Report
```
Navegador: Chrome 120
SO: Windows 11
Problema: Som não toca após múltiplos pedidos
Passos: 
1. Crie 1º pedido
2. Som toca
3. Feche alerta com X
4. Crie 2º pedido
5. Nenhum som toca

Erro no console: [erro específico]
```

## Sugestões de Melhoria

Se tiver ideias para melhorar:

- [ ] Diferentes sons para iFood vs Sistema
- [ ] Seleção de som nas configurações
- [ ] Diferentes temas de alerta
- [ ] Histórico de notificações
- [ ] Integração com notificações do SO

---

**Última atualização**: 19 de Janeiro de 2026
**Status**: Sistema Funcional
