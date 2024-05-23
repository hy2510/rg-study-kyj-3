import writingActivityCSS from '@stylesheets/writing-activity.module.scss'
import writingActivityCSSMobile from '@stylesheets/mobile/writing-activity.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type BtnSubmitProps = {
  isSubmit: boolean
  submitAnswer: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? writingActivityCSSMobile : writingActivityCSS

export default function BtnSubmit({ isSubmit, submitAnswer }: BtnSubmitProps) {
  return (
    <div
      style={!isSubmit ? { opacity: '0.5', cursor: 'default' } : {}}
      className={style.submitButton}
      onClick={() => submitAnswer()}
    >
      Submit
    </div>
  )
}
