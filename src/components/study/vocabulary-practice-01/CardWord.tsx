import vocabularyCSS from '@stylesheets/vocabulary-practice.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-practice.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { PlayState } from '@hooks/study/useStudyAudio'
import { IVocabulary1Quiz } from '@interfaces/IVocabulary'

import BtnPlayWord from './BtnPlayWord'

type CardWordProps = {
  playState: PlayState
  cardInfo: IVocabulary1Quiz
  playWord: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

export default function CardWord({
  playState,
  cardInfo,
  playWord,
}: CardWordProps) {
  return (
    <div className={`${style.wordCard} animate__animated`}>
      <div className={style.wordImage}>
        <img src={cardInfo.Question.Image} width={'100%'} />
      </div>

      <div className={style.wordText}>
        <BtnPlayWord
          playState={playState}
          cardInfo={cardInfo}
          playWord={playWord}
        />
      </div>
    </div>
  )
}
