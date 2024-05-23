import vocabularyCSS from '@stylesheets/vocabulary-practice.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-practice.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { IcoPlay, IcoStop } from '@components/common/Icons'
import { PlayState } from '@hooks/study/useStudyAudio'

type BtnPlayWordProps = {
  playState: PlayState
  playWord: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

export default function BtnPlayWord({ playState, playWord }: BtnPlayWordProps) {
  return (
    <div
      className={style.wordPlayButton2}
      onClick={() => playWord()}
      tabIndex={-1}
    >
      {playState === 'playing' ? (
        <IcoStop isColor width={34} height={34} />
      ) : (
        <IcoPlay isColor width={34} height={34} />
      )}
    </div>
  )
}
