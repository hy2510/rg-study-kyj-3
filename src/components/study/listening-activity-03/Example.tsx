import listeningCSS from '@stylesheets/listening-activity.module.scss'
import listeningCSSMobile from '@stylesheets/mobile/listening-activity.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { IListeningActivity3Example } from '@interfaces/IListeningActivity'

type ExampleProps = {
  example: IListeningActivity3Example
  index: number
  checkAnswer: (
    target: EventTarget & HTMLDivElement,
    selectedText: string,
  ) => Promise<void>
  onWrapperAnimationEndHandler: (
    e: React.AnimationEvent<HTMLDivElement>,
  ) => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? listeningCSSMobile : listeningCSS

export default function Example({
  example,
  index,
  checkAnswer,
  onWrapperAnimationEndHandler,
}: ExampleProps) {
  return (
    <div
      className={`${style.imageCard}`}
      onClick={(e) => checkAnswer(e.currentTarget, example.Text)}
      onAnimationEnd={(e) => {
        onWrapperAnimationEndHandler(e)
      }}
    >
      <img
        src={example.Image}
        width={isMobile ? 'auto' : '100%'}
        height={isMobile ? '100%' : 'auto'}
      />
      <div className={style.cardNumberPosition}>
        <div className={style.cardNumber}>{Number(index + 1)}</div>
      </div>
    </div>
  )
}
