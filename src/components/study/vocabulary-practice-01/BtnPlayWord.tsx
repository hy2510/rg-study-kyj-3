import vocabularyCSS from '@stylesheets/vocabulary-practice.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-practice.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { IVocabulary1Quiz } from '@interfaces/IVocabulary'
import { PlayState } from '@hooks/study/useStudyAudio'
import { IcoPlay, IcoStop } from '@components/common/Icons'

type BtnPlayWordProps = {
  playState: PlayState
  cardInfo: IVocabulary1Quiz
  playWord: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

export default function BtnPlayWord({
  playState,
  cardInfo,
  playWord,
}: BtnPlayWordProps) {
  return (
    <div className={style.wordPlayButton} onClick={() => playWord()}>
      {playState === '' ? (
        <IcoPlay isColor width={24} height={24} />
      ) : (
        <IcoStop isColor width={24} height={24} />
      )}
      <div className={style.txtL}>{cardInfo.Question.Text}</div>
    </div>
  )
}
