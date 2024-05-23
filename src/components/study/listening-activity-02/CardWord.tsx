import { useState } from 'react'

import listeningCSS from '@stylesheets/listening-activity.module.scss'
import listeningCSSMobile from '@stylesheets/mobile/listening-activity.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type CardWordProps = {
  text: string
  isCorrected?: boolean
  checkAnswer: (
    target: EventTarget & HTMLDivElement,
    selectedAnswer: string,
  ) => Promise<void>
  onCardAnimationEndHandler: (
    e: React.AnimationEvent<HTMLDivElement>,
    disabledCard: () => void,
  ) => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? listeningCSSMobile : listeningCSS

export default function CardWord({
  text,
  isCorrected = false,
  checkAnswer,
  onCardAnimationEndHandler,
}: CardWordProps) {
  const [isShowWord, setShowWord] = useState<boolean>(false)

  const disabledCard = () => {
    setShowWord(true)
  }

  return (
    <div
      className={`${style.wordCard} animate__animated ${
        isShowWord || isCorrected ? style.done : ''
      }`}
      onClick={(e) => {
        if (!isShowWord && !isCorrected) checkAnswer(e.currentTarget, text)
      }}
      onAnimationEnd={(e) => onCardAnimationEndHandler(e, disabledCard)}
    >
      <div className={style.txtL}>{text}</div>
    </div>
  )
}
