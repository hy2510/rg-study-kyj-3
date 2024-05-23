import testResultCSS from '@stylesheets/test-result.module.scss'
import testResultCSSMobile from '@stylesheets/mobile/test-result.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type QuizAnswerProps = {
  anserNum: number
  answerText: string
  wrongAnswer?: boolean
}

const isMobile = useDeviceDetection()

const style = isMobile ? testResultCSSMobile : testResultCSS

export default function QuizAnswer({
  anserNum,
  answerText,
  wrongAnswer,
}: QuizAnswerProps) {
  return (
    <div className={style.quizAnswer}>
      <div className={`${style.answerNum} ${wrongAnswer && style.wrong}`}>
        {anserNum}
      </div>
      <div className={`${style.answerText} ${wrongAnswer && style.wrong}`}>
        {answerText}
      </div>
    </div>
  )
}
