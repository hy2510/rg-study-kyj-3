import writingActivityCSS from '@stylesheets/writing-activity.module.scss'
import writingActivityCSSMobile from '@stylesheets/mobile/writing-activity.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type BtnSaveProps = {
  saveAnswer: () => Promise<void>
}

const isMobile = useDeviceDetection()

const style = isMobile ? writingActivityCSSMobile : writingActivityCSS

export default function BtnSave({ saveAnswer }: BtnSaveProps) {
  return (
    <div className={style.saveButton} onClick={() => saveAnswer()}>
      Save
    </div>
  )
}
