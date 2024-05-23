import clozeTestCSS from '@stylesheets/cloze-test.module.scss'
import clozeTestCSSMobile from '@stylesheets/mobile/cloze-test.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { PlayState } from '@hooks/study/useStudyAudio'
import { IcoPlay, IcoStop } from '@components/common/Icons'

type BtnPlaySentenceProps = {
  playState: PlayState
  playSentence: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? clozeTestCSSMobile : clozeTestCSS

export default function BtnPlaySentence({
  playState,
  playSentence,
}: BtnPlaySentenceProps) {
  return (
    <div className={style.wordPlayButton} onClick={() => playSentence()}>
      {playState === 'playing' ? (
        <IcoStop isColor width={34} height={34} />
      ) : (
        <IcoPlay isColor width={34} height={34} />
      )}
      <div className={style.txtL}>Playback</div>
    </div>
  )
}
