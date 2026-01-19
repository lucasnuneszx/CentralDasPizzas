import { useEffect, useRef, useState } from 'react'

interface UseContinuousSoundProps {
  soundUrl: string
  isActive: boolean
  volume?: number
  interval?: number // Intervalo em ms entre cada reprodução (padrão: 3000ms)
}

export function useContinuousSound({ 
  soundUrl, 
  isActive, 
  volume = 1.0,
  interval = 3000 
}: UseContinuousSoundProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPlayingRef = useRef(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // Função para gerar som usando Web Audio API (fallback)
  const playWebAudioSound = () => {
    try {
      // Criar novo AudioContext a cada toque para garantir funcionamento em macOS/Safari
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const now = audioContext.currentTime

      // Criar dois osciladores para um som de alerta mais notável
      const osc1 = audioContext.createOscillator()
      const osc2 = audioContext.createOscillator()
      const gain = audioContext.createGain()

      osc1.frequency.value = 800
      osc2.frequency.value = 1200
      osc1.type = 'sine'
      osc2.type = 'sine'

      osc1.connect(gain)
      osc2.connect(gain)
      gain.connect(audioContext.destination)

      // Volume e envelope
      const maxVolume = Math.min(Math.max(volume, 0), 1) * 0.5 // Volume aumentado para 50%
      gain.gain.setValueAtTime(maxVolume, now)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4)

      // Leve pitch bend para mais interesse sonoro
      osc1.frequency.setValueAtTime(800, now)
      osc1.frequency.exponentialRampToValueAtTime(700, now + 0.4)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.4)
      osc2.stop(now + 0.4)

      console.log('🔊 Web Audio API som tocou com sucesso')
    } catch (error) {
      console.warn('Erro ao reproduzir som via Web Audio API:', error)
    }
  }

  useEffect(() => {
    if (!soundUrl || !isActive || !soundEnabled) {
      // Parar som quando desativar
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      isPlayingRef.current = false
      console.log('🔇 Som desativado', { soundUrl, isActive, soundEnabled })
      return
    }

    console.log('🔊 INICIANDO som contínuo', { soundUrl, isActive, soundEnabled, volume, interval })

    // Função para tocar o som
    const playSound = () => {
      try {
        // Tentar primeiro com arquivo de áudio HTML5
        if (soundUrl && soundUrl !== '') {
          // Se não há áudio ou está pausado/terminado, criar novo
          if (!audioRef.current || audioRef.current.paused || audioRef.current.ended) {
            const audio = new Audio(soundUrl)
            audio.volume = Math.min(Math.max(volume, 0), 1) // Garantir volume entre 0 e 1
            
            audio.play()
              .then(() => {
                console.log('✅ Som de arquivo reproduzido com sucesso')
                audioRef.current = audio
                isPlayingRef.current = true
              })
              .catch(error => {
                console.warn('⚠️ Erro ao reproduzir som de arquivo:', error)
                // Fallback para Web Audio API
                playWebAudioSound()
              })
          }
        } else {
          // Se não há URL, usar Web Audio API
          playWebAudioSound()
        }
      } catch (error) {
        console.error('Erro ao criar elemento de áudio:', error)
        // Fallback para Web Audio API
        playWebAudioSound()
      }
    }

    // Tocar imediatamente
    console.log('🔊 Tocando som imediatamente...')
    playSound()

    // Configurar intervalo para repetir
    intervalRef.current = setInterval(playSound, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [soundUrl, isActive, soundEnabled, volume, interval])

  // Função para pausar/retomar som manualmente
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled)
  }

  // Função para parar completamente
  const stopSound = () => {
    setSoundEnabled(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    isPlayingRef.current = false
  }

  return {
    toggleSound,
    stopSound,
    soundEnabled,
    isPlaying: isPlayingRef.current
  }
}
