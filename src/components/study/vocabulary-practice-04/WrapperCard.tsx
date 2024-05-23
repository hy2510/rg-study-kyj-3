import vocabularyCSS from '@stylesheets/vocabulary-practice.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-practice.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { IVocabulary4 } from '@interfaces/IVocabulary'

import { PlayState } from '@hooks/study/useStudyAudio'

type WrapperCardProps = {
  playState: PlayState
  quizData: IVocabulary4
  quizNo: number
  playWord: () => void
}

import BtnPlayWord from './BtnPlayWord'
import Gap from '../common-study/Gap'
import Mean from './Mean'

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

export default function WrapperCard({
  playState,
  quizData,
  quizNo,
  playWord,
}: WrapperCardProps) {
  return (
    <div
      className={`${style.wordCard} animate__animated animate__slideInRight`}
    >
      <BtnPlayWord
        playState={playState}
        word={quizData.Quiz[quizNo - 1].Question.Text}
        playWord={playWord}
      />

      <Gap height={10} />

      <Mean
        meanData={quizData.Quiz[quizNo - 1]}
        mainMeanLang={quizData.MainMeanLanguage}
        subMeanLang={quizData.SubMeanLanguage}
      />
    </div>
  )
}
