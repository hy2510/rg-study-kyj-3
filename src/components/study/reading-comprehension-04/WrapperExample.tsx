import { IReadingComprehension4Example } from '@interfaces/IReadingComprehension'

import Example from './Example'

type WrapperExampleProps = {
  exampleData: IReadingComprehension4Example[]
  checkAnswer: (
    selectedAnswer: string,
    target?: EventTarget & HTMLDivElement,
  ) => Promise<void>
}

export default function WrapperExample({
  exampleData,
  checkAnswer,
}: WrapperExampleProps) {
  return (
    <>
      {exampleData.map((example, i) => {
        return (
          <Example
            key={`e-0${i}`}
            exampleData={example}
            index={i}
            checkAnswer={checkAnswer}
          />
        )
      })}
    </>
  )
}
