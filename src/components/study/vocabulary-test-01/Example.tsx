import vocabularyCSS from '@stylesheets/vocabulary-test.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-test.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type ExampleProps = {
  index: number
  text: string
  checkAnswer: (
    target?: (EventTarget & HTMLDivElement) | undefined,
    selectedAnswer?: string,
  ) => Promise<void>
  onAnimationEndHandler: (e: React.AnimationEvent<HTMLDivElement>) => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

export default function Example({
  index,
  text,
  checkAnswer,
  onAnimationEndHandler,
}: ExampleProps) {
  return (
    <div
      className={`${style.textCard} animate__animated`}
      onClick={(e) => checkAnswer(e.currentTarget, text)}
      onAnimationEnd={(e) => onAnimationEndHandler(e)}
    >
      <div className={style.cardNumber}>{index}</div>
      <div className={style.awnserText}>{text}</div>
    </div>
  )
}
