import reactStringReplace from 'react-string-replace'

import vocabularyCSS from '@stylesheets/vocabulary-practice.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-practice.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { IVocabulary2Quiz } from '@interfaces/IVocabulary'
import { MultiPlayStateProps } from '@pages/study/VocabularyPractice2'

import { IcoPlay, IcoStop } from '@components/common/Icons'

type BtnPlayWordProps = {
  multiPlayState: MultiPlayStateProps
  cardInfo: IVocabulary2Quiz
  playSentence: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

export default function BtnPlayWord({
  multiPlayState,
  cardInfo,
  playSentence,
}: BtnPlayWordProps) {
  return (
    <div className={style.wordPlayButton} onClick={() => playSentence()}>
      {multiPlayState.playState === 'playing' &&
      multiPlayState.playType === 'sentence' ? (
        <IcoStop isColor width={24} height={24} />
      ) : (
        <IcoPlay isColor width={24} height={24} />
      )}
      <div className={style.txtP}>
        {reactStringReplace(
          cardInfo.Question.Text,
          cardInfo.Question.Word,
          () => (
            <span style={{ color: '#f15144' }}>{cardInfo.Question.Word}</span>
          ),
        )}
      </div>
    </div>
  )
}
