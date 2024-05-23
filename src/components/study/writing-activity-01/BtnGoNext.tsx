import writingActivityCSS from '@stylesheets/writing-activity.module.scss'
import writingActivityCSSMobile from '@stylesheets/mobile/writing-activity.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type BtnGoNextProps = {
  goNextQuiz: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? writingActivityCSSMobile : writingActivityCSS

export default function BtnGoNext({ goNextQuiz }: BtnGoNextProps) {
  return (
    <div
      onClick={() => goNextQuiz()}
      className={`${style.goNextButton} animate__animated animate__flash`}
    >
      Next
    </div>
  )
}
