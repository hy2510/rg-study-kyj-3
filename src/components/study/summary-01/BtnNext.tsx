import summaryCSS from '@stylesheets/summary.module.scss'
import summaryCSSMobile from '@stylesheets/mobile/summary.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type BtnNextProps = {
  goNext: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? summaryCSSMobile : summaryCSS

export default function BtnNext({ goNext }: BtnNextProps) {
  return (
    <div
      onClick={() => goNext()}
      className={`${style.btnNext} animate__animated animate__flash`}
    >
      Next
    </div>
  )
}
