import summaryCSS from '@stylesheets/summary.module.scss'
import summaryCSSMobile from '@stylesheets/mobile/summary.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import Example from './Example'

import { ISummary2Example } from '@interfaces/ISummary'

type WrapperExampleProps = {
  exampleData: ISummary2Example[]
  checkAnswer: (
    target: EventTarget & HTMLDivElement,
    selectedText: string,
  ) => Promise<void>
  onAnimationEnd: (target: EventTarget & HTMLDivElement) => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? summaryCSSMobile : summaryCSS

export default function WrapperExample({
  exampleData,
  checkAnswer,
  onAnimationEnd,
}: WrapperExampleProps) {
  return (
    <div className={style.answers}>
      <div className={style.container}>
        {exampleData.map((example, index) => {
          return (
            <Example
              key={`example-${index}`}
              index={index}
              exampleData={example}
              checkAnswer={checkAnswer}
              onAnimationEnd={onAnimationEnd}
            />
          )
        })}
      </div>
    </div>
  )
}
