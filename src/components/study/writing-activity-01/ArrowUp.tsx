import writingActivityCSS from '@stylesheets/writing-activity.module.scss'
import writingActivityCSSMobile from '@stylesheets/mobile/writing-activity.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

const isMobile = useDeviceDetection()

const style = isMobile ? writingActivityCSSMobile : writingActivityCSS

export default function ArrowUp() {
  return (
    <div className={style.correctDirection}>
      <div className={style.iconArrowUp}></div>
    </div>
  )
}
