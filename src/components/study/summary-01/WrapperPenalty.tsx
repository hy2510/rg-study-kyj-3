import { useEffect, useRef, useState } from 'react'

import summaryCSS from '@stylesheets/summary.module.scss'
import summaryCSSMobile from '@stylesheets/mobile/summary.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { PenaltyState } from '@pages/study/Summary1'

import Gap from '../common-study/Gap'
import TextPenalty from './TextPenalty'

type WrapperPenaltyProps = {
  isSideOpen: boolean
  correctSentence: string
  changePenaltyState: (state: PenaltyState) => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? summaryCSSMobile : summaryCSS

export default function WrapperPenalty({
  isSideOpen,
  correctSentence,
  changePenaltyState,
}: WrapperPenaltyProps) {
  const inputRefs = useRef<HTMLInputElement[]>([])
  const [currentInputIndex, setCurrentInputIndex] = useState<number>(0)
  const [isNext, setNext] = useState<boolean>(false)
  const replaceHTMLReg = /<[^>]*>/gi

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
    if (index >= inputRefs.current.length) {
      setCurrentInputIndex(index)
      changeNextButton()
    } else {
      setCurrentInputIndex(index)
    }
  }

  const changeNextButton = () => {
    setNext(true)
  }

  return (
    <div className={`${style.testReview}`}>
      <div className={style.title}>Test Review</div>
      <div className={style.container}>
        <div className={style.sentence}>
          {correctSentence
            .replace(replaceHTMLReg, '')
            .split(' ')
            .map((word, i) => {
              return (
                <TextPenalty
                  inputRefs={inputRefs}
                  inputIndex={i}
                  currentInputIndex={currentInputIndex}
                  word={word}
                  changeInputIndex={changeInputIndex}
                />
              )
            })}
        </div>
      </div>

      <Gap height={10} />

      <div
        className={`${isNext ? style.nextButton : style.deactNextButton} ${
          isNext && 'animate__animated animate__bounce'
        }`}
        onClick={() => {
          if (isNext) changePenaltyState('none')
        }}
      >
        Next
      </div>
    </div>
  )
}
