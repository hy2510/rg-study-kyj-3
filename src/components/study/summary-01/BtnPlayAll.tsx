import summaryCSS from '@stylesheets/summary.module.scss'
import summaryCSSMobile from '@stylesheets/mobile/summary.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { MultiPlayStateProps } from '@pages/study/Summary1'

import { IcoPlay, IcoStop } from '@components/common/Icons'
import { useEffect } from 'react'

type BtnPlayAllProps = {
  multiPlayState: MultiPlayStateProps
  playAll: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? summaryCSSMobile : summaryCSS

export default function BtnPlayAll({
  multiPlayState,
  playAll,
}: BtnPlayAllProps) {
  return (
    <div className={style.wordPlayButton} onClick={() => playAll()}>
      {multiPlayState.playState === 'playing' ? (
        <IcoStop isColor width={24} height={24} />
      ) : (
        <IcoPlay isColor width={24} height={24} />
      )}

      <div className={style.txtL}>Playback</div>
    </div>
  )
}
