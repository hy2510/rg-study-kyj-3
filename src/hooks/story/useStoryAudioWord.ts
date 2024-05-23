import { useEffect, useRef } from 'react'
import { PlayState } from '@interfaces/IStory'

type useStoryAudioWordProps = {
  playState: PlayState
  pauseStoryAudio: () => void
  resumeStoryAudio: () => void
}

export default function useStoryAudioWord({
  playState,
  pauseStoryAudio,
  resumeStoryAudio,
}: useStoryAudioWordProps) {
  // 오디오
  const audioRef = useRef(new Audio())
  audioRef.current.autoplay = true
  const player = audioRef.current

  useEffect(() => {
    console.log('ue ps', player)
    // 오디오가 재생 가능할 때
    const handlerCanPlayThrough = () => {
      console.log('audio canplaythrough')

      pauseStoryAudio()
      player.play()
    }

    player.addEventListener('canplaythrough', handlerCanPlayThrough)
    // 오디오가 재생 가능할 때 end

    // 오디오가 재생 완료
    const handlerEnded = () => {
      console.log('audio ended')

      if (playState === 'play') {
        resumeStoryAudio()
      }
    }

    player.addEventListener('ended', handlerEnded)
    // 오디오가 재생 완료 end

    // 오디오 재생

    return () => {
      console.log('return handler')
      player.removeEventListener('canplaythrough', handlerCanPlayThrough)
      player.removeEventListener('ended', handlerEnded)

      stopAudio()
    }
  }, [])

  const playAudio = (src: string) => {
    player.src = src
  }

  /**
   * 오디오 중지
   */
  const stopAudio = () => {
    player.pause()
    player.src = ''
    player.currentTime = 0
  }

  return {
    playAudio,
    stopAudio,
  }
}

export { useStoryAudioWord }
