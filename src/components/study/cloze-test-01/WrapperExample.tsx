import clozeTestCSS from '@stylesheets/cloze-test.module.scss'
import clozeTestCSSMobile from '@stylesheets/mobile/cloze-test.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { IClozeTest1Example } from '@interfaces/IClozeTest'

type WrapperExampleProps = {
  exampleData: IClozeTest1Example[]
  checkAnswer: (
    target: EventTarget & HTMLDivElement,
    selectedWord?: string,
  ) => Promise<void>
}

import Example from './Example'

const isMobile = useDeviceDetection()

const style = isMobile ? clozeTestCSSMobile : clozeTestCSS

export default function WrapperExample({
  exampleData,
  checkAnswer,
}: WrapperExampleProps) {
  return (
    <div className={style.answers}>
      <div className={style.container}>
        {exampleData.map((example, i) => {
          return (
            <Example index={i} example={example} checkAnswer={checkAnswer} />
          )
        })}
      </div>
    </div>
  )
}
