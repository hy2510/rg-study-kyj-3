import { IReadingComprehension3Example } from '@interfaces/IReadingComprehension'
import { MultiPlayStateProps } from '@pages/study/ReadingComprehension3'

type WrapperExampleProps = {
  multiPlayState: MultiPlayStateProps
  exampleData: IReadingComprehension3Example[]
  playSentence: (index: number) => void
  checkAnswer: (
    target: React.RefObject<HTMLDivElement>,
    index: number,
  ) => Promise<void>
  onAnimationEndHandler: (e: React.AnimationEvent<HTMLDivElement>) => void
}

import Example from './Example'

export default function WrapperExample({
  multiPlayState,
  exampleData,
  playSentence,
  checkAnswer,
  onAnimationEndHandler,
}: WrapperExampleProps) {
  return (
    <>
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
    </>
  )
}
