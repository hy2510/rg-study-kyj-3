import vocabularyCSS from '@stylesheets/vocabulary-test.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-test.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { IVocabulary2Example } from '@interfaces/IVocabulary'

type ExampleProps = {
  exampleData: IVocabulary2Example
  index: number
  checkAnswer: (
    target: EventTarget & HTMLDivElement,
    selectedText: string,
  ) => Promise<void>
  onAnimationEndHandler: (e: React.AnimationEvent<HTMLDivElement>) => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

export default function Example({
  exampleData,
  index,
  checkAnswer,
  onAnimationEndHandler,
}: ExampleProps) {
  return (
    <div
      className={`${style.textCard}`}
      onClick={(e) => checkAnswer(e.currentTarget, exampleData.Text)}
      onAnimationEnd={(e) => onAnimationEndHandler(e)}
    >
      <div className={style.cardNumber}>{Number(index + 1)}</div>
      <div className={style.awnserText}>{exampleData.Text}</div>
    </div>
  )
}
