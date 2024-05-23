import readingComprehensionCSS from '@stylesheets/reading-comprehension.module.scss'
import readingComprehensionCSSMobile from '@stylesheets/mobile/reading-comprehension.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { IReadingComprehension2Example } from '@interfaces/IReadingComprehension'
import { MultiPlayStateProps } from '@pages/study/ReadingComprehension2'

type WrapperExampleProps = {
  multiPlayState: MultiPlayStateProps
  exampleData: IReadingComprehension2Example[]
  playSentence: (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number,
  ) => void
  checkAnswer: (
    target: React.RefObject<HTMLDivElement>,
    index: number,
  ) => Promise<void>
  onAnimationEndHandler: (e: React.AnimationEvent<HTMLDivElement>) => void
}

import Example from './Example'

const isMobile = useDeviceDetection()

const style = isMobile ? readingComprehensionCSSMobile : readingComprehensionCSS

export default function WrapperExample({
  multiPlayState,
  exampleData,
  playSentence,
  checkAnswer,
  onAnimationEndHandler,
}: WrapperExampleProps) {
  return (
    <div className={style.answers}>
      {exampleData.map((example, i) => {
        return (
          <Example
            multiPlayState={multiPlayState}
            sentence={example.Text}
            index={i}
            playSentence={playSentence}
            checkAnswer={checkAnswer}
            onAnimationEndHandler={onAnimationEndHandler}
          />
        )
      })}
    </div>
  )
}
