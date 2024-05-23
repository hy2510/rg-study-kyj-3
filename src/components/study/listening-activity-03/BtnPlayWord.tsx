import listeningCSS from '@stylesheets/listening-activity.module.scss'
import listeningCSSMobile from '@stylesheets/mobile/listening-activity.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { PlayState } from '@hooks/study/useStudyAudio'
import { IcoPlay, IcoStop } from '@components/common/Icons'

type BtnPlayWordProps = {
  playState: PlayState
  onPlay: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? listeningCSSMobile : listeningCSS

export default function BtnPlayWord({ playState, onPlay }: BtnPlayWordProps) {
  return (
    <div className={style.wordPlayButton} onClick={() => onPlay()}>
      {playState === '' ? (
        <IcoPlay isColor width={34} height={34} />
      ) : (
        <IcoStop isColor width={34} height={34} />
      )}
      <span className={style.txtL}>Playback</span>
    </div>
  )
}
