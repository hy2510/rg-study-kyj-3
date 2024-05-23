import readingComprehensionCSS from '@stylesheets/reading-comprehension.module.scss'
import readingComprehensionCSSMobile from '@stylesheets/mobile/reading-comprehension.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { IReadingComprehension4Example } from '@interfaces/IReadingComprehension'

type ExampleProps = {
  exampleData: IReadingComprehension4Example
  index: number
  checkAnswer: (
    selectedAnswer: string,
    target: EventTarget & HTMLDivElement,
  ) => Promise<void>
}

const isMobile = useDeviceDetection()

const style = isMobile ? readingComprehensionCSSMobile : readingComprehensionCSS

export default function Example({
  exampleData,
  index,
  checkAnswer,
}: ExampleProps) {
  return (
    <div
      className={`${style.textCard}`}
      onClick={(e) => checkAnswer(exampleData.Text, e.currentTarget)}
    >
      <div className={style.cardNumber}>{Number(index + 1)}</div>

      <div
        className={style.awnserText}
        dangerouslySetInnerHTML={{ __html: exampleData.Text }}
      ></div>
    </div>
  )
}
