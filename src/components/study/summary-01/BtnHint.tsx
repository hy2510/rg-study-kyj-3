import summaryCSS from '@stylesheets/summary.module.scss'
import summaryCSSMobile from '@stylesheets/mobile/summary.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type BtnHintProps = {
  tryCnt: number | undefined
  maxCnt: number | undefined
  onClickHint: () => Promise<void>
}

const isMobile = useDeviceDetection()

const style = isMobile ? summaryCSSMobile : summaryCSS

export default function BtnHint({
  tryCnt = 0,
  maxCnt = 0,
  onClickHint,
}: BtnHintProps) {
  return (
    <div className={style.hintButton} onClick={() => onClickHint()}>
      Chance {maxCnt - tryCnt} / {maxCnt}
    </div>
  )
}
