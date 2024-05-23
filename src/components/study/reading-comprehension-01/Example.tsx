import readingComprehensionCSS from '@stylesheets/reading-comprehension.module.scss'
import readingComprehensionCSSMobile from '@stylesheets/mobile/reading-comprehension.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type ExampleProps = {
  index: number
  img: string
  text: string
  checkAnswer: (
    target: EventTarget & HTMLDivElement,
    selectedAnswer: string,
  ) => Promise<void>
  onAnimationEndHandler: (e: React.AnimationEvent<HTMLDivElement>) => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? readingComprehensionCSSMobile : readingComprehensionCSS

export default function Example({
  index,
  img,
  text,
  checkAnswer,
  onAnimationEndHandler,
}: ExampleProps) {
  return (
    <div
      className={`${style.imageCard} animate__animated`}
      onClick={(e) => checkAnswer(e.currentTarget, text)}
      onAnimationEnd={(e) => onAnimationEndHandler(e)}
    >
      <img
        src={img}
        width={isMobile ? 'auto' : '100%'}
        height={isMobile ? '100%' : 'auto'}
      />

      <div className={style.cardNumberPosition}>
        <div className={style.cardNumber}>{index}</div>
      </div>
    </div>
  )
}
