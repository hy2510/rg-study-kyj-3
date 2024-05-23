import summaryCSS from '@stylesheets/summary.module.scss'
import summaryCSSMobile from '@stylesheets/mobile/summary.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type BtnGoNextProps = {
  showResult: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? summaryCSSMobile : summaryCSS

export default function BtnGoNext({ showResult }: BtnGoNextProps) {
  return (
    <div className={`${style.btnNext}`} onClick={() => showResult()}>
      Next
    </div>
  )
}
