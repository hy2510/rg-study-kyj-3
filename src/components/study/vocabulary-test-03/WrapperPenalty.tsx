import { useEffect, useRef, useState } from 'react'

import vocabularyCSS from '@stylesheets/vocabulary-test.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-test.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import TextPenalty from './TextPenalty'
import Gap from '../common-study/Gap'

type WrapperPenaltyProps = {
  isSideOpen: boolean
  correctAnswer: string
  playPenalty: (cb: any) => void
  changePenaltyState: (state: boolean) => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

export default function WrapperPenalty({
  isSideOpen,
  correctAnswer,
  playPenalty,
  changePenaltyState,
}: WrapperPenaltyProps) {
  const inputRefs = useRef<HTMLInputElement[]>([])
  const [currentInputIndex, setCurrentInputIndex] = useState<number>(0)
  const [isNext, setNext] = useState<boolean>(false)

  useEffect(() => {
    const onClickHandler = () => {
      if (inputRefs.current[currentInputIndex]) {
        inputRefs.current[currentInputIndex].focus()

        if (isSideOpen) {
          inputRefs.current[currentInputIndex].blur()
        }
      }
    }

    onClickHandler()

    window.addEventListener('click', onClickHandler)

    return () => {
      window.removeEventListener('click', onClickHandler)
    }
  }, [currentInputIndex, isSideOpen])

  const changeInputIndex = (index: number) => {
    setCurrentInputIndex(index)
  }

  const changeNextButton = () => {
    setNext(true)
  }

  return (
    <div className={`${style.testReview}`}>
      <div className={style.title}>Test Review</div>
      <div className={style.container}>
        <div className={style.sentence}>
          <TextPenalty
            inputRefs={inputRefs}
            inputIndex={0}
            currentInputIndex={currentInputIndex}
            correctAnswer={correctAnswer}
            changeInputIndex={changeInputIndex}
            playPenalty={playPenalty}
            changeNextButton={changeNextButton}
          />

          <TextPenalty
            inputRefs={inputRefs}
            inputIndex={1}
            currentInputIndex={currentInputIndex}
            correctAnswer={correctAnswer}
            changeInputIndex={changeInputIndex}
            playPenalty={playPenalty}
            changeNextButton={changeNextButton}
          />

          <TextPenalty
            inputRefs={inputRefs}
            inputIndex={2}
            currentInputIndex={currentInputIndex}
            correctAnswer={correctAnswer}
            changeInputIndex={changeInputIndex}
            playPenalty={playPenalty}
            changeNextButton={changeNextButton}
          />
        </div>
      </div>

      <Gap height={10} />

      <div
        className={`${isNext ? style.nextButton : style.deactNextButton} ${
          isNext && 'animate__animated animate__bounce'
        }`}
        onClick={() => isNext && changePenaltyState(false)}
      >
        Next
      </div>
    </div>
  )
}
