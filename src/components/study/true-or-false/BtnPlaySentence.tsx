import trueOrFalseCSS from '@stylesheets/true-or-false.module.scss'
import trueOrFalseCSSMobile from '@stylesheets/mobile/true-or-false.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { PlayState } from '@hooks/study/useStudyAudio'

import { IcoPlay, IcoStop } from '@components/common/Icons'

type TrueSentenceProps = {
  playState: PlayState
  playTrueSentence: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? trueOrFalseCSSMobile : trueOrFalseCSS

export default function BtnPlaySentence({
  playState,
  playTrueSentence,
}: TrueSentenceProps) {
  return (
    <div className={style.wordPlayButton} onClick={() => playTrueSentence()}>
      {playState === 'playing' ? (
        <IcoStop isColor width={24} height={24} />
      ) : (
        <IcoPlay isColor width={24} height={24} />
      )}
      <div className={style.txtL}>Playback</div>
    </div>
  )
}
