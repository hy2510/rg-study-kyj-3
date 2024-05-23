import vocabularyCSS from '@stylesheets/vocabulary-test.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-test.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { IVocabulary2Example } from '@interfaces/IVocabulary'
import Example from './Example'

type WrapperExampleProps = {
  exampleData: IVocabulary2Example[]
  checkAnswer: (
    target: EventTarget & HTMLDivElement,
    selectedText: string,
  ) => Promise<void>
  onAnimationEndHandler: (e: React.AnimationEvent<HTMLDivElement>) => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

export default function WrapperExample({
  exampleData,
  checkAnswer,
  onAnimationEndHandler,
}: WrapperExampleProps) {
  return (
    <div className={style.answers}>
      {exampleData.map((example, i) => {
        return (
          <Example
            key={`e-0${i}`}
            exampleData={example}
            index={i}
            checkAnswer={checkAnswer}
            onAnimationEndHandler={onAnimationEndHandler}
          />
        )
      })}
    </div>
  )
}
