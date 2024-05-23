import { useEffect, useRef, useState } from 'react'

export type PlayState = '' | 'playing' | 'endFn'

export default function useStudyAudio() {
  // 오디오 상태
  const [playState, setPlayState] = useState<PlayState>('')

  // 오디오
  const audioRef = useRef(new Audio())
  audioRef.current.autoplay = true
  const player = audioRef.current

  // 콜백함수
  const endFn = useRef<() => void>()

  useEffect(() => {
    if (playState === 'playing' || playState === 'endFn') {
      // 오디오가 재생 가능할 때
      const handlerCanPlayThrough = () => {
        console.log('audio canplaythrough')
        player.play()
      }

      player.addEventListener('canplaythrough', handlerCanPlayThrough)
      // 오디오가 재생 가능할 때 end

      const handlerEnded = () => {
        if (playState === 'endFn') {
          if (endFn.current) {
            endFn.current()
          }
        } else {
          setPlayState('')
        }
      }

      player.addEventListener('ended', handlerEnded)
      // 오디오가 재생 완료 end

      return () => {
        console.log('return handler')
        player.removeEventListener('canplaythrough', handlerCanPlayThrough)
        player.removeEventListener('ended', handlerEnded)

        setPlayState('')
        stopAudio()
      }
    }
  }, [playState])

  /**
   * 오디오 재생
   * @param src 오디오 소스
   * @param cb  콜백 함수
   */
  const playAudio = (src: string, cb?: () => void) => {
    player.src = src

    if (cb) {
      endFn.current = cb
      setPlayState('endFn')
    } else {
      setPlayState('playing')
    }
  }

  /**
   * 오디오 중지
   */
  const stopAudio = () => {
    player.pause()
    player.src = ''
    player.currentTime = 0

    setPlayState('')
  }

  const changePlayState = (state: PlayState) => {
    setPlayState(state)
  }

  return { playState, changePlayState, playAudio, stopAudio }
}
