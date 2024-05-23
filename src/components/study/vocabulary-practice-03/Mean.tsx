import vocabularyCSS from '@stylesheets/vocabulary-practice.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-practice.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { IVocabulary3Quiz, MeanLanguage } from '@interfaces/IVocabulary'

import { upperFirst } from 'lodash'

import Gap from '../common-study/Gap'

type MeanProps = {
  meanData: IVocabulary3Quiz
  mainMeanLang: MeanLanguage
}

type SentenceProps = {
  meanData: IVocabulary3Quiz
  mainMeanLang: MeanLanguage
}

type TlanslationProps = {
  meanData: IVocabulary3Quiz
  mainMeanLang: MeanLanguage
}

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

// main mean
const Sentence = ({ meanData, mainMeanLang }: SentenceProps) => {
  const mainLang: string = upperFirst(mainMeanLang)
  let mainMean: string = ''

  switch (mainLang) {
    case 'Korean':
    case 'Chinese':
    case 'Japanese':
    case 'Vietnamese':
    case 'Indonesian':
      mainMean = meanData.Question[mainLang]
      break

    case 'English':
      if (
        meanData.Question['English'] !== '' &&
        meanData.Question['Britannica'] !== ''
      ) {
        // 영어도 있고 사전도 있으면 사전
        mainMean = meanData.Question['Britannica']
      } else if (
        meanData.Question['English'] === '' &&
        meanData.Question['Britannica'] !== ''
      ) {
        // 영어가 없는 경우 사전
        mainMean = meanData.Question['Britannica']
      } else if (
        meanData.Question['English'] !== '' &&
        meanData.Question['Britannica'] === ''
      ) {
        // 사전이 없는 경우 영어
        mainMean = meanData.Question[mainLang]
      }
      break

    default:
      mainMean = meanData.Question.Korean
  }

  return (
    <div className={style.txtL}>
      {meanData.Question.SpeechPart}. {mainMean}
    </div>
  )
}

// sub mean
const Translation = ({ meanData, mainMeanLang }: TlanslationProps) => {
  const mainLang: string = upperFirst(mainMeanLang)
  let subMean = ''

  if (mainLang === 'English') {
    return <></>
  } else {
    subMean =
      meanData.Question['Britannica'] !== ''
        ? meanData.Question['Britannica']
        : meanData.Question['English']

    return (
      <div className={style.txtP}>
        {meanData.Question.SpeechPart}. {subMean}
      </div>
    )
  }
}

export default function Mean({ meanData, mainMeanLang }: MeanProps) {
  return (
    <div className={style.meaning}>
      <Sentence meanData={meanData} mainMeanLang={mainMeanLang} />

      <Gap height={10} />

      <Translation meanData={meanData} mainMeanLang={mainMeanLang} />
    </div>
  )
}
