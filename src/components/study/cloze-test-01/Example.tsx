import clozeTestCSS from '@stylesheets/cloze-test.module.scss'
import clozeTestCSSMobile from '@stylesheets/mobile/cloze-test.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { IClozeTest1Example } from '@interfaces/IClozeTest'

type ExampleProps = {
  index: number
  example: IClozeTest1Example
  checkAnswer: (
    target: EventTarget & HTMLDivElement,
    selectedWord?: string,
  ) => Promise<void>
}

const isMobile = useDeviceDetection()

const style = isMobile ? clozeTestCSSMobile : clozeTestCSS

export default function Example({ index, example, checkAnswer }: ExampleProps) {
  return (
    <div
      className={`${style.textCard}`}
      onClick={(e) => checkAnswer(e.currentTarget, example.Text)}
    >
      <div className={style.cardNumber}>{Number(index + 1)}</div>
      <div className={style.awnserText}>{example.Text}</div>
    </div>
  )
}
