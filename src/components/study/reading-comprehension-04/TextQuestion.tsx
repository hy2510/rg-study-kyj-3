import readingComprehensionCSS from '@stylesheets/reading-comprehension.module.scss'
import readingComprehensionCSSMobile from '@stylesheets/mobile/reading-comprehension.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type TextQuestionProps = {
  question: string
}

const isMobile = useDeviceDetection()

const style = isMobile ? readingComprehensionCSSMobile : readingComprehensionCSS

export default function TextQuestion({ question }: TextQuestionProps) {
  return (
    <div
      className={style.questionText}
      dangerouslySetInnerHTML={{ __html: question }}
    ></div>
  )
}
