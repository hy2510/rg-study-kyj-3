import vocabularyCSS from '@stylesheets/vocabulary-practice.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-practice.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { IVocabulary2Quiz } from '@interfaces/IVocabulary'
import { MultiPlayStateProps } from '@pages/study/VocabularyPractice2'

import BtnPlayWord from './BtnPlayWord'
import BtnPlaySentence from './BtnPlaySentence'

type CardProps = {
  cardInfo: IVocabulary2Quiz
  multiPlayState: MultiPlayStateProps
  playWord: () => void
  playSentence: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

export default function Card({
  cardInfo,
  multiPlayState,
  playWord,
  playSentence,
}: CardProps) {
  return (
    <div
      className={`${style.wordCard} animate__animated animate__slideInRight`}
    >
      <div className={style.wordImage}>
        <img src={cardInfo.Question.Image} width={'100%'} />
      </div>

      {/* 단어 */}
      <div className={style.wordText}>
        <BtnPlayWord
          multiPlayState={multiPlayState}
          cardInfo={cardInfo}
          playWord={playWord}
        />
      </div>

      {/* 뜻 */}
      <div className={style.wordText}>
        <BtnPlaySentence
          multiPlayState={multiPlayState}
          cardInfo={cardInfo}
          playSentence={playSentence}
        />
      </div>
    </div>
  )
}
