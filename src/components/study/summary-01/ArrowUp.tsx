import summaryCSS from '@stylesheets/summary.module.scss'
import summaryCSSMobile from '@stylesheets/mobile/summary.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

const isMobile = useDeviceDetection()

const style = isMobile ? summaryCSSMobile : summaryCSS

export default function ArrowUp() {
  return (
    <div className={style.correctDirection}>
      <div className={style.iconArrowUp}></div>
    </div>
  )
}
