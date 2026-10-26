# Customização do Sistema de Alerta Sonoro

## Ajustes Rápidos

### 1. **Mudar o Intervalo de Som**

**Local**: `hooks/useContinuousSound.ts`

```typescript
// Atual: 2500ms (2.5 segundos)
// Para mudar, edite este valor:

intervalRef.current = setInterval(playSound, interval)
// 'interval' vem como prop: 2500
```

**Alternativas Comuns**:
- `1000` = A cada 1 segundo (muito agressivo)
- `2000` = A cada 2 segundos (agressivo)
- `2500` = A cada 2.5 segundos (padrão - recomendado)
- `3000` = A cada 3 segundos (moderado)
- `5000` = A cada 5 segundos (leve)

**Como mudar no componente**:

```tsx
// Em: app/admin/orders/page.tsx
<OrderSoundAlert
  // ... outras props
  soundUrl={settings?.notificationSound}
  interval={2000}  // ← Mude aqui (em ms)
/>
```

### 2. **Mudar Volume do Som**

**Local**: `components/order-sound-alert.tsx`

Encontre a linha com `useContinuousSound`:

```tsx
const { toggleSound, soundEnabled } = useContinuousSound({
  soundUrl: soundUrl || '/sounds/notification.mp3',
  isActive: showAlert,
  volume: 1.0,  // ← Mude para: 0.5 a 0.7
  interval: 2500
})
```

**Valores Recomendados**:
- `1.0` = 100% (padrão - máximo)
- `0.8` = 80% (ainda alto)
- `0.6` = 60% (moderado)
- `0.5` = 50% (leve)

### 3. **Mudar Frequências do Som (Web Audio API)**

**Local**: `hooks/useContinuousSound.ts`

Na função `playWebAudioSound()`:

```typescript
// Frequências atuais
osc1.frequency.value = 800    // ← Mude para outra frequência
osc2.frequency.value = 1200   // ← Mude para outra frequência
```

**Frequências Recomendadas** (em Hz):
- `600 + 900` = Tom mais grave (menos irritante)
- `800 + 1200` = Padrão (equilibrado)
- `1000 + 1500` = Tom mais agudo (mais penetrante)
- `1200 + 1800` = Tom muito agudo (irritante)

### 4. **Mudar Duração do Som**

**Local**: `hooks/useContinuousSound.ts`

Na função `playWebAudioSound()`:

```typescript
// Atual: 0.4 segundos
const duration = 0.4

// Mudar aqui
gain.gain.exponentialRampToValueAtTime(0.01, now + duration)  // ← duration
osc1.frequency.exponentialRampToValueAtTime(700, now + duration) // ← duration
osc1.stop(now + duration)
osc2.stop(now + duration)
```

**Valores Recomendados**:
- `0.2` = 200ms (beep curto)
- `0.4` = 400ms (padrão - recomendado)
- `0.6` = 600ms (beep mais longo)
- `1.0` = 1000ms (muito longo)

## Customizações Visuais

### 1. **Mudar Cores do Alerta**

**Local**: `components/order-sound-alert.tsx`

```tsx
<div className={`
  animate-pulse rounded-lg shadow-2xl p-4 max-w-md
  ${soundEnabled 
    ? 'bg-red-500 border-2 border-red-700'      // ← Som ativo
    : 'bg-yellow-500 border-2 border-yellow-700' // ← Som mudo
  }
`}>
```

**Opções de Cores Tailwind**:
- `bg-red-500` / `bg-red-700` (alerta severo)
- `bg-orange-500` / `bg-orange-700` (alerta moderado)
- `bg-yellow-500` / `bg-yellow-700` (alerta leve)
- `bg-pink-500` / `bg-pink-700` (alerta customizado)

### 2. **Mudar Posição do Alerta**

**Local**: `components/order-sound-alert.tsx`

```tsx
<div className="fixed top-4 right-4 z-50">
  {/* Opções:
    - top-4 right-4 = Superior direito (padrão)
    - top-4 left-4 = Superior esquerdo
    - bottom-4 right-4 = Inferior direito
    - bottom-4 left-4 = Inferior esquerdo
    - top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 = Centralizado
  */}
</div>
```

### 3. **Mudar Tamanho do Alerta**

**Local**: `components/order-sound-alert.tsx`

```tsx
<div className="... max-w-md">
  {/* Opções para max-w-{size}:
    - max-w-sm = Pequeno (336px)
    - max-w-md = Médio (448px) - padrão
    - max-w-lg = Grande (512px)
    - max-w-xl = Muito grande (576px)
  */}
</div>
```

### 4. **Customizar Textos**

**Local**: `components/order-sound-alert.tsx`

```tsx
<h3 className="text-white font-bold text-lg">
  ⏰ NOVO PEDIDO!  {/* ← Mude o texto */}
</h3>

<p className="text-white text-sm opacity-90">
  {pendingCount > 1 && `${pendingCount} pedidos pendentes`}
  {/* Mude a mensagem aqui */}
</p>
```

## Integração com Arquivo de Áudio Customizado

### 1. **Adicionar Arquivo MP3**

```bash
# Coloque na pasta:
# /public/sounds/notification.mp3
# ou
# /public/sounds/alarm.wav
```

### 2. **Configurar via Settings API**

```javascript
// POST /api/settings
{
  "notificationSound": "/sounds/notification.mp3"
}
```

### 3. **URLs Remotas (CDN)**

```javascript
{
  "notificationSound": "https://seu-cdn.com/sons/alarm.mp3"
}
```

## Recursos Recomendados

### Geradores de Som Online
- [Freesound.org](https://freesound.org) - Sons gratuitos
- [Zapsplat.com](https://www.zapsplat.com) - SFX grátis
- [Bfxr.net](https://www.bfxr.net) - Gerador de 8-bit
- [Jsfxr](https://sfxr.me) - JavaScript Sound Effects

### SFX Recomendados para Pizzaria
- Sino/Bell suave
- Buzzer eletrônico
- Alarme tipo "ding"
- Som de caixa registradora
- Notificação mobile

## Comportamentos Customizáveis

### 1. **Aceitar Apenas com Som Ativo**

**Onde**: `components/order-sound-alert.tsx`

```tsx
const handleAccept = async () => {
  // Adicionar validação
  if (!soundEnabled) {
    toast.error('Ative o som antes de aceitar')
    return
  }
  setShowAlert(false)
  await onAccept()
}
```

### 2. **Sem Botão de Fechar**

**Onde**: `components/order-sound-alert.tsx`

```tsx
{/* Remova este botão: */}
{/* <Button onClick={() => setShowAlert(false)}>✕</Button> */}

// Isso força o usuário a aceitar/rejeitar
```

### 3. **Auto-fechar Após X Segundos**

**Onde**: `components/order-sound-alert.tsx`

```tsx
useEffect(() => {
  if (!showAlert) return
  
  const timer = setTimeout(() => {
    setShowAlert(false) // Fecha após 30s
  }, 30000) // 30 segundos
  
  return () => clearTimeout(timer)
}, [showAlert])
```

## Exemplos de Configuração

### Configuração "Agressiva" (Máxima Atenção)
```typescript
// Em: components/order-sound-alert.tsx
useContinuousSound({
  soundUrl: soundUrl,
  isActive: showAlert,
  volume: 1.0,      // Máximo
  interval: 1500    // A cada 1.5s
})

// Em: hooks/useContinuousSound.ts
osc1.frequency.value = 1200  // Tom agudo
osc2.frequency.value = 1800  // Tom muito agudo
gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2) // Curto

// Em: components/order-sound-alert.tsx
bg-red-600 border-red-900  // Vermelho escuro intenso
```

### Configuração "Leve" (Menos Irritante)
```typescript
// Em: components/order-sound-alert.tsx
useContinuousSound({
  soundUrl: soundUrl,
  isActive: showAlert,
  volume: 0.6,      // Moderado
  interval: 4000    // A cada 4s
})

// Em: hooks/useContinuousSound.ts
osc1.frequency.value = 600  // Tom grave
osc2.frequency.value = 900  // Tom médio
gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6) // Mais longo

// Em: components/order-sound-alert.tsx
bg-orange-500 border-orange-700  // Laranja moderado
```

### Configuração "Profissional" (Balanceada)
```typescript
// Em: components/order-sound-alert.tsx
useContinuousSound({
  soundUrl: soundUrl || '/sounds/professional-alert.mp3',
  isActive: showAlert,
  volume: 0.8,      // Alto
  interval: 2500    // A cada 2.5s (padrão)
})

// Usar arquivo de áudio customizado professional
```

## Debugging

### 1. **Verificar se Som está Tocando**

Abra o console (F12) e adicione:

```javascript
// Em: hooks/useContinuousSound.ts (já adicionado)
console.log('🔊 Som toque a cada 2.5 segundos')
```

### 2. **Verificar AudioContext**

```javascript
// No console:
const ctx = new AudioContext()
console.log('Volume máximo suportado:', ctx.destination.maxChannelCount)
```

### 3. **Testar Web Audio API**

```javascript
// No console:
const osc = new AudioContext().createOscillator()
osc.frequency.value = 800
console.log('Frequência:', osc.frequency.value)
```

## Checklist de Customização

- [ ] Intervalo de som ajustado
- [ ] Volume testado
- [ ] Cores visuais escolhidas
- [ ] Posição do alerta definida
- [ ] Textos traduzidos/customizados
- [ ] Arquivo de áudio (opcional) adicionado
- [ ] Comportamentos testados
- [ ] Diferentes navegadores testados
- [ ] Documentação atualizada

---

**Exemplo Completo de Customização**:
[Veja SOUND_ALERT_SYSTEM.md](./SOUND_ALERT_SYSTEM.md)

**Data**: 19 de Janeiro de 2026
