import vocabularyCSS from '@stylesheets/vocabulary-practice.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-practice.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { PlayState } from '@hooks/study/useStudyAudio'
import { IcoPlay, IcoStop } from '@components/common/Icons'

type BtnPlayWordProps = {
  playState: PlayState
  word: string
  playWord: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

export default function BtnPlayWord({
  playState,
  word,
  playWord,
}: BtnPlayWordProps) {
  return (
    <div className={style.wordText}>
      <div className={style.wordPlayButton} onClick={() => playWord()}>
        {playState === 'playing' ? (
          <IcoStop isColor width={24} height={24} />
        ) : (
          <IcoPlay isColor width={24} height={24} />
        )}
        {<div className={style.txtL}>{word}</div>}
      </div>
    </div>
  )
}
