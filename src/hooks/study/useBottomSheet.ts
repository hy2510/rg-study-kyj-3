import { useEffect, useState } from 'react'
import { playAudio } from '@utils/common'

// 음원
import audCorrect from '@assets/sounds/correct_sound.mp3'
import audIncorrect from '@assets/sounds/incorrect_sound.mp3'

export default function useBottomSheet() {
  const [bottomSheetState, setBottomSheetState] = useState({
    isActive: false,
    isTrue: false,
  })

  useEffect(() => {
    if (bottomSheetState.isActive)
      playAudio(bottomSheetState.isTrue ? audCorrect : audIncorrect)
  }, [bottomSheetState])

  const changeBottomSheetState = (state: {
    isActive: boolean
    isTrue: boolean
  }) => {
    setBottomSheetState(state)
  }

  return { bottomSheetState, changeBottomSheetState }
}
