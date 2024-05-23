import summaryCSS from '@stylesheets/summary.module.scss'
import summaryCSSMobile from '@stylesheets/mobile/summary.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

const isMobile = useDeviceDetection()

const style = isMobile ? summaryCSSMobile : summaryCSS

export default function SentenceHelp() {
  return (
    <div className={`${style.correctTextCard} ${style.question}`}>
      <div className={style.questionMark}>
        Choose the sentences in the correct order.
      </div>
    </div>
  )
}
