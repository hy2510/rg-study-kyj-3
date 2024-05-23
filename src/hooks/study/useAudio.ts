import { useEffect, useRef, useState } from 'react'

type PlayState = '' | 'play' | 'playing' | 'stop'
type Audio = HTMLAudioElement

export default function useAudio(audio: Audio) {
  const audioRef = useRef(audio)
  const [playState, setPlayState] = useState<PlayState>('')
  const endFn = useRef<() => void>()

  // 콜백함수가 없는 경우
  useEffect(() => {
    // play audio 후 콜백 함수가 있는 경우
    const cbPlayAudio = () => {
      if (endFn && endFn.current) {
        endFn.current()
        endFn.current = undefined
      }
    }

    if (playState === 'play') {
      // play일 경우 재생
      const play = () => {
        if (endFn) {
          audioRef.current.addEventListener('ended', cbPlayAudio)
        }

        audioRef.current.addEventListener('canplaythrough', () => {
          audioRef.current.play()
        })
      }

      play()
    } else if (playState === 'stop') {
      // stop일 경우 정지
      const stop = () => {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        audioRef.current.src = ''
      }

      stop()
    }

    return () => {
      audioRef.current.removeEventListener('canplaythrough', cbPlayAudio)
      audioRef.current.removeEventListener('ended', () => {})
    }
  }, [playState])

  // 콜백 함수가 있는 경우
  useEffect(() => {
    if (endFn !== undefined) setPlayState('play')
  }, [endFn])

  /**
   * 오디오 source 초기화
   */
  const resetSrc = () => {
    audioRef.current.src = ''
  }

  /**
   * 오디오 재생
   * @param src 오디오 source
   * @param autoPlay 자동재생 여부
   * @param end 재생 후 콜백 함수
   */
  const playAudio = (src: string, autoPlay: boolean, end?: () => void) => {
    audioRef.current.src = src

    if (end) {
      endFn.current = end
    } else {
      setPlayState(autoPlay ? 'play' : '')
    }
  }

  /**
   * 오디오 중지
   */
  const stopAudio = () => {
    setPlayState('stop')
  }

  return { resetSrc, playAudio, stopAudio }
}

export { useAudio }
