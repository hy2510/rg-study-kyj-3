import testResultCSS from '@stylesheets/test-result.module.scss'
import testResultCSSMobile from '@stylesheets/mobile/test-result.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { IRecordAnswerType } from '@interfaces/Common'
import { IReadingComprehension4 } from '@interfaces/IReadingComprehension'

type WrapperWrongAnswerProps = {
  quizData: IReadingComprehension4
  failedExample: IRecordAnswerType[]
}

import CardWrongAnswer from './CardWrongAnswer'

const isMobile = useDeviceDetection()

const style = isMobile ? testResultCSSMobile : testResultCSS

export default function WrapperWrongAnswer({
  quizData,
  failedExample,
}: WrapperWrongAnswerProps) {
  return (
    <div className={style.wrongAnswers}>
      <div className={style.title}>Wrong Answers</div>
      {failedExample.map((example, i) => {
        return (
          <CardWrongAnswer
            index={i}
            question={quizData.Quiz[example.CurrentQuizNo - 1].Question.Text}
            correctAnswer={example.Correct}
            selectedAnswer={example.StudentAnswer}
          />
        )
      })}
    </div>
  )
}
