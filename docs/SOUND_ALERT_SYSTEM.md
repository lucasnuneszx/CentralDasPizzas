# Sistema de Alerta Sonoro para Pedidos 🔊

## 📋 Descrição
Este sistema foi desenvolvido para evitar que pedidos sejam perdidos por falta de atenção. Quando um novo pedido chega, um alarme sonoro toca repetidamente a cada **2.5 segundos** até que o pedido seja **ACEITO** ou **REJEITADO**.

## 🎯 Características

✅ **Som Contínuo** - O alerta toca repetidamente até ser aceito/rejeitado
✅ **Alerta Visual** - Notificação em vermelho piscante no canto superior direito
✅ **Controle Manual** - Botão para mutar/desmutar o som sem aceitar
✅ **Suporte Web Audio API** - Funciona mesmo sem arquivo de áudio externo
✅ **Fallback Automático** - Se o arquivo de áudio não carregar, usa síntese de som

## 🔧 Componentes Implementados

### 1. **Hook `useContinuousSound`** 
   **Arquivo**: `hooks/useContinuousSound.ts`
   - Reproduz som continuamente em um intervalo configurável
   - Suporta som via arquivo HTML5 Audio ou Web Audio API
   - Oferece controles para pausar/retomar/parar
   - Volume máximo (1.0) para garantir que o som seja ouvido

### 2. **Componente `OrderSoundAlert`**
   **Arquivo**: `components/order-sound-alert.tsx`
   - Exibe alerta visual do novo pedido
   - Mostra número do pedido e valor total
   - Botões para:
     - **ACEITAR** - Parar o som e aceitar o pedido
     - **Mutar/Desmutar** - Pausar apenas o som
     - **Fechar** - Descartar o alerta (som continuará até aceitar)

### 3. **Integração na Página de Pedidos**
   **Arquivo**: `app/admin/orders/page.tsx`
   - Detecta novos pedidos PENDING
   - Ativa automaticamente o alerta sonoro para o primeiro pedido pendente
   - Desativa o alerta quando o pedido é aceito ou rejeitado

## 🎵 Sons de Alerta

### Padrão
- **Web Audio API Síntese**: Dois osciladores em 800Hz e 1200Hz
- **Duração**: 0.4 segundos por toque
- **Intervalo**: 2.5 segundos entre toques
- **Volume**: 100% (máximo)

### Arquivo de Áudio Customizado
Se desejar usar um arquivo MP3 ou WAV próprio:

1. Coloque o arquivo em: `public/sounds/notification.mp3`
2. Configure a URL nas **Configurações do Sistema** (`/api/settings`)
3. A URL será usada automaticamente no componente

## 📱 Como Usar

### Para o Usuário Final

1. **Novo Pedido Chega**
   - Uma notificação vermelha piscante aparece no canto superior direito
   - Um som de alerta toca a cada 2.5 segundos
   - O número do pedido e valor total são exibidos

2. **Aceitar o Pedido**
   - Clique no botão **ACEITAR**
   - O pedido será processado
   - O som parará automaticamente

3. **Apenas Mutar (Sem Aceitar)**
   - Clique no ícone de **alto-falante** para silenciar
   - Clique novamente para restaurar o som
   - O pedido ainda estará pendente

4. **Fechar Alerta (Não Recomendado)**
   - Clique no **X** para fechar a notificação
   - ⚠️ O som continuará tocando até aceitar/rejeitar o pedido

### Para Administradores

1. **Configurar Som Customizado** (opcional)
   - Vá para `/admin/settings`
   - Configure a URL do arquivo de áudio em `notificationSound`
   - Se deixar em branco, usará Web Audio API

2. **Desativar Sistema** (se necessário)
   - Comentar/remover o componente `OrderSoundAlert` em `app/admin/orders/page.tsx`

## 🎛️ Configurações Disponíveis

No hook `useContinuousSound`, você pode ajustar:

```typescript
{
  soundUrl: '/sounds/notification.mp3',  // URL do arquivo ou vazio
  isActive: true,                        // Ativo/Inativo
  volume: 1.0,                           // 0 a 1 (padrão: máximo)
  interval: 2500                         // Milissegundos entre toques
}
```

## 🚀 Roadmap Futuro

- [ ] Diferentes sons para diferentes tipos de pedido (iFood vs Sistema)
- [ ] Histórico de notificações fechadas
- [ ] Configuração por usuário (volume, intervalo, arquivo de áudio)
- [ ] Integração com notificações do Windows/Mac
- [ ] Testes de volume máximo em diferentes navegadores

## 🐛 Troubleshooting

### Som não funciona
1. Verifique o volume do dispositivo
2. Teste com Web Audio API (síntese)
3. Verifique se não há uma extensão/plugin bloqueando áudio
4. Tente em outro navegador

### Som continua após fechar a aba
- Feche a aba completamente para parar

### Volume muito baixo
- Aumentar `volume` no hook para 1.0
- Aumentar volume do dispositivo
- Usar diferentes frequências no Web Audio

### Arquivo de áudio não carrega
- O sistema automaticamente faz fallback para Web Audio API
- Verifique o caminho do arquivo em `public/sounds/`

## 📝 Notas Técnicas

- Usa React Hooks e Next.js 
- Compatível com todos os navegadores modernos
- Suporta fallback automático para Web Audio API
- Volume sempre em máximo para não ser ignorado
- Intervalo otimizado de 2.5 segundos (agressivo o suficiente para chamar atenção)

## 🎓 Exemplo de Integração Personalizada

Se desejar adaptar para outro componente:

```tsx
import { useContinuousSound } from '@/hooks/useContinuousSound'

export function CustomAlert() {
  const { toggleSound, stopSound, soundEnabled } = useContinuousSound({
    soundUrl: '/sounds/alert.mp3',
    isActive: true,
    volume: 1.0,
    interval: 3000
  })

  return (
    <div>
      <button onClick={toggleSound}>
        {soundEnabled ? 'Mutar' : 'Som Ligado'}
      </button>
      <button onClick={stopSound}>Parar Completamente</button>
    </div>
  )
}
```

---

**Desenvolvido para**: Central das Pizzas
**Data**: 19 de Janeiro de 2026
**Objetivo**: Reduzir perdas de pedidos por falta de atenção
