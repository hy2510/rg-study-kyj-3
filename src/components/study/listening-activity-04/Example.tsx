import { useRef } from 'react'

import listeningCSS from '@stylesheets/listening-activity.module.scss'
import listeningCSSMobile from '@stylesheets/mobile/listening-activity.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { MultiPlayStateProps } from '@pages/study/ListeningActivity4'
import { IListeningActivity4Example } from '@interfaces/IListeningActivity'

type ExampleProps = {
  multiPlayState: MultiPlayStateProps
  exampleData: IListeningActivity4Example
  index: number
  playWord: (index: number) => void
  checkAnswer: (
    target: React.RefObject<HTMLDivElement>,
    selectedText: string,
  ) => Promise<void>
  onAnimationEndHandler: (e: React.AnimationEvent<HTMLDivElement>) => void
}

import { IcoReturn } from '@components/common/Icons'
import BtnPlayWord from './BtnPlayWord'

const isMobile = useDeviceDetection()

const style = isMobile ? listeningCSSMobile : listeningCSS

export default function Example({
  multiPlayState,
  exampleData,
  index,
  playWord,
  checkAnswer,
  onAnimationEndHandler,
}: ExampleProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  const clickAnswer = () => {
    checkAnswer(cardRef, exampleData.Text)
  }

  return (
    <div
      ref={cardRef}
      className={`${style.soundCard}`}
      onAnimationEnd={(e) => onAnimationEndHandler(e)}
    >
      <div className={style.cardNumberPosition}>
        <div className={style.cardNumber}>{Number(index + 1)}</div>
      </div>
      <div className={style.playSoundPosition}>
        <BtnPlayWord
          multiPlayState={multiPlayState}
          index={index}
          playWord={playWord}
        />
      </div>
      <span className={style.enterButton} onClick={() => clickAnswer()}>
        <span>
          <IcoReturn width={15} height={15} />
        </span>
      </span>
    </div>
  )
}
