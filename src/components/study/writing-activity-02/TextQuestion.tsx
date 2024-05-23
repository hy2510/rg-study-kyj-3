import writingActivityCSS from '@stylesheets/writing-activity.module.scss'
import writingActivityCSSMobile from '@stylesheets/mobile/writing-activity.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type TextQuestionProps = {
  question: string
}

const isMobile = useDeviceDetection()

const style = isMobile ? writingActivityCSSMobile : writingActivityCSS

export default function TextQuestion({ question }: TextQuestionProps) {
  return <div className={style.questionText}>{question}</div>
}
