import vocabularyCSS from '@stylesheets/vocabulary-test.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-test.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { IVocabulary4Example } from '@interfaces/IVocabulary'
type WrapperExampleProps = {
  exampleData: IVocabulary4Example[]
  checkAnswer: (
    target: EventTarget & HTMLDivElement,
    selectedText: string,
  ) => Promise<void>
  onExampleAnimationEndHandler: (target: EventTarget & HTMLDivElement) => void
}

import Example from './Example'

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

export default function WrapperExample({
  exampleData,
  checkAnswer,
  onExampleAnimationEndHandler,
}: WrapperExampleProps) {
  return (
    <div className={style.answers}>
      {exampleData.map((example, i) => {
        return (
          <Example
            exampleData={example}
            index={i}
            checkAnswer={checkAnswer}
            onExampleAnimationEndHandler={onExampleAnimationEndHandler}
          />
        )
      })}
    </div>
  )
}
