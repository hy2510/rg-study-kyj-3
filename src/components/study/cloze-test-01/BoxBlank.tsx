import clozeTestCSS from '@stylesheets/cloze-test.module.scss'
import clozeTestCSSMobile from '@stylesheets/mobile/cloze-test.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type BoxBlankProps = {
  blankRef: React.RefObject<HTMLSpanElement>
  correctAnswer: string
}

const isMobile = useDeviceDetection()

const style = isMobile ? clozeTestCSSMobile : clozeTestCSS

export default function BoxBlank({ blankRef, correctAnswer }: BoxBlankProps) {
  return (
    <span ref={blankRef} className={`${style.answerBox}`}>
      {blankRef.current &&
        blankRef.current.classList.length > 1 &&
        correctAnswer}
    </span>
  )
}
