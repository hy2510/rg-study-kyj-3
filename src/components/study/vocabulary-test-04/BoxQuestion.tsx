import vocabularyCSS from '@stylesheets/vocabulary-test.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-test.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { IVocabulary4 } from '@interfaces/IVocabulary'
type BoxQuestionProps = {
  quizData: IVocabulary4
  quizNo: number
}

import Mean from './Mean'

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

export default function BoxQuestion({ quizData, quizNo }: BoxQuestionProps) {
  return (
    <div className={style.questionBox}>
      <Mean
        meanData={quizData.Quiz[quizNo - 1]}
        mainMeanLang={quizData.MainMeanLanguage}
        subMeanLang={quizData.SubMeanLanguage}
      />
    </div>
  )
}
