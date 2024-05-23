import { useEffect, useState } from 'react'
import { playAudio } from '@utils/common'

// 음원
import audCorrect from '@assets/sounds/correct_sound.mp3'
import audIncorrect from '@assets/sounds/incorrect_sound.mp3'

type BottomPopupStateProps = {
  isActive: boolean
  isCorrect: boolean
}

export default function useBottomSheet() {
  const [bottomPopupState, setBottomPopupState] =
    useState<BottomPopupStateProps>({
      isActive: false,
      isCorrect: false,
    })

  useEffect(() => {
    if (bottomPopupState.isActive)
      playAudio(bottomPopupState.isCorrect ? audCorrect : audIncorrect)
  }, [bottomPopupState])

  const changeBottomPopupState = (state: {
    isActive: boolean
    isCorrect: boolean
  }) => {
    setBottomPopupState(state)
  }

  return { bottomPopupState, changeBottomPopupState }
}

export type { BottomPopupStateProps }
