import testResultCSS from '@stylesheets/test-result.module.scss'
import testResultCSSMobile from '@stylesheets/mobile/test-result.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { IScoreBoardData } from '@interfaces/Common'

import ScoreRow from './ScoreRow'
import TableHeader from './TableHeader'

type ScoreBoardProps = {
  quizAnswerCount: number
  studentAnswer: IScoreBoardData[]
}

const isMobile = useDeviceDetection()

const style = isMobile ? testResultCSSMobile : testResultCSS

export default function ScoreBoard({
  quizAnswerCount,
  studentAnswer,
}: ScoreBoardProps) {
  return (
    <div className={style.scoreBoard}>
      <TableHeader quizAnswerCount={quizAnswerCount} />

      {/* Test Result 결과가 들어가는 곳 */}
      <ScoreRow
        studentAnswer={studentAnswer}
        quizAnswerCount={quizAnswerCount}
      />
    </div>
  )
}
