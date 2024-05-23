import summaryCSS from '@stylesheets/summary.module.scss'
import summaryCSSMobile from '@stylesheets/mobile/summary.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { PlayState } from '@hooks/study/useStudyAudio'
import { IcoPlay, IcoStop } from '@components/common/Icons'

type BtnPlaySentenceProps = {
  playState: PlayState
  playSentence: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? summaryCSSMobile : summaryCSS

export default function BtnPlaySentence({
  playState,
  playSentence,
}: BtnPlaySentenceProps) {
  return (
    <div className={style.wordPlayButton} onClick={() => playSentence()}>
      {playState === 'playing' ? (
        <IcoStop isColor width={24} height={24} />
      ) : (
        <IcoPlay isColor width={24} height={24} />
      )}

      <div className={style.txtL}>Playback (completed sentence)</div>
    </div>
  )
}
