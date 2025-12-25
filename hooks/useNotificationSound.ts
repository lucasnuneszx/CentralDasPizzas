import { useEffect, useRef } from 'react'

export function useNotificationSound(soundUrl: string | null | undefined, trigger: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastTriggerRef = useRef(false)

  useEffect(() => {
    if (!soundUrl || !trigger) {
      lastTriggerRef.current = trigger
      return
    }

    // Só reproduzir se mudou de false para true (novo pedido)
    if (trigger && !lastTriggerRef.current) {
      try {
        // Criar novo elemento de áudio para cada reprodução
        const audio = new Audio(soundUrl)
        audio.volume = 0.7 // Volume moderado
        audio.play().catch(error => {
          console.error('Erro ao reproduzir som:', error)
          // Alguns navegadores bloqueiam autoplay, isso é esperado
        })
        audioRef.current = audio
      } catch (error) {
        console.error('Erro ao criar elemento de áudio:', error)
      }
    }

    lastTriggerRef.current = trigger
  }, [soundUrl, trigger])

  return audioRef
}

