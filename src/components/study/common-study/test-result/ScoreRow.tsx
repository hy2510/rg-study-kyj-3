import { ReactNode } from 'react'

import testResultCSS from '@stylesheets/test-result.module.scss'
import testResultCSSMobile from '@stylesheets/mobile/test-result.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { IScoreBoardData } from '@interfaces/Common'

type ScoreRowProps = {
  studentAnswer: IScoreBoardData[]
  quizAnswerCount: number
}

const isMobile = useDeviceDetection()

const style = isMobile ? testResultCSSMobile : testResultCSS

export default function ScoreRow({
  studentAnswer,
  quizAnswerCount,
}: ScoreRowProps) {
  let currentQuizNo = 0
  let rows: ReactNode[] = []
  let cols: ReactNode[] = []

  studentAnswer.map((el) => {
    if (currentQuizNo !== el.quizNo) {
      currentQuizNo = el.quizNo

      cols.push(<div>{currentQuizNo}</div>)
    }

    for (let i = 1; i <= quizAnswerCount; i++) {
      if (i < el.answerCount) {
        cols.push(<div>X</div>)
      } else if (i === el.answerCount) {
        if (el.ox) {
          cols.push(<div>O</div>)
        } else {
          cols.push(<div>X</div>)
        }
      } else {
        cols.push(<div></div>)
      }
    }

    rows.push(
      <div
        key={`rows-result-${currentQuizNo}`}
        className={`${style.score} ${
          quizAnswerCount === 3
            ? style.count3
            : quizAnswerCount === 1
            ? style.count1
            : ''
        }`}
      >
        {cols}
      </div>,
    )

    cols = []
  })
  return <>{rows}</>
}
