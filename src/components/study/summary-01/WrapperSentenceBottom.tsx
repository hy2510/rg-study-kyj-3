import summaryCSS from '@stylesheets/summary.module.scss'
import summaryCSSMobile from '@stylesheets/mobile/summary.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { ISummary1Quiz } from '@interfaces/ISummary'
import Example from './Example'

type WrapperSentenceBottomProps = {
  exampleData: ISummary1Quiz[]
  checkAnswer: (
    target: EventTarget & HTMLDivElement,
    selectedAnswer: string,
  ) => Promise<void>
  onAnimationEnd: (target: EventTarget & HTMLDivElement) => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? summaryCSSMobile : summaryCSS

export default function WrapperSentenceBottom({
  exampleData,
  checkAnswer,
  onAnimationEnd,
}: WrapperSentenceBottomProps) {
  return (
    <div className={style.answers}>
      {exampleData.map((example, i) => {
        return (
          <Example
            key={`e-0${i}`}
            index={i}
            exampleData={example}
            checkAnswer={checkAnswer}
            onAnimationEnd={onAnimationEnd}
          />
        )
      })}
    </div>
  )
}
