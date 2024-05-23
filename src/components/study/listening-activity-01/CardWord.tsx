import { useState } from 'react'

import listeningCSS from '@stylesheets/listening-activity.module.scss'
import listeningCSSMobile from '@stylesheets/mobile/listening-activity.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type CardWordProps = {
  imgSrc: string
  text: string
  isCorrected?: boolean
  onCardAnimationEndHandler: (
    e: React.AnimationEvent<HTMLDivElement>,
    appearWord: () => void,
  ) => void
  onWordAnimationEndHandler: (
    e: React.AnimationEvent<HTMLDivElement>,
    isCorrected: boolean | undefined,
  ) => void
  checkAnswer: (
    target: EventTarget & HTMLDivElement,
    selectedAnswer: string,
  ) => Promise<void>
}

const isMobile = useDeviceDetection()

const style = isMobile ? listeningCSSMobile : listeningCSS

export default function CardWord({
  imgSrc,
  text,
  isCorrected = false,
  onCardAnimationEndHandler,
  onWordAnimationEndHandler,
  checkAnswer,
}: CardWordProps) {
  const [isShowWord, setShowWord] = useState<boolean>(false)

  const appearWord = () => {
    setShowWord(true)
  }

  return (
    <div
      className={`animate__animated ${style.wordCard} ${
        isShowWord || isCorrected ? style.done : ''
      }`}
      onClick={(e) => {
        if (!isCorrected && !isShowWord) checkAnswer(e.currentTarget, text)
      }}
      onAnimationEnd={(e) => {
        onCardAnimationEndHandler(e, appearWord)
      }}
    >
      <img src={imgSrc} />
      {(isCorrected || isShowWord) && (
        <>
          <div className={`${style.word}`}>{text}</div>
          <div
            className={`${style.wordBlock} animate__animated animate__fadeIn`}
            onAnimationEnd={(e) => {
              onWordAnimationEndHandler(e, isCorrected)
            }}
          ></div>
        </>
      )}
    </div>
  )
}
