import trueOrFalseCSS from '@stylesheets/true-or-false.module.scss'
import trueOrFalseCSSMobile from '@stylesheets/mobile/true-or-false.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type TextQuestionProps = {
  text: string
}

const isMobile = useDeviceDetection()

const style = isMobile ? trueOrFalseCSSMobile : trueOrFalseCSS

export default function TextQuestion({ text }: TextQuestionProps) {
  return (
    <div
      className={style.questionText}
      dangerouslySetInnerHTML={{ __html: text }}
    ></div>
  )
}
