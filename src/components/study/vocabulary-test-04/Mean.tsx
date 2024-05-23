import vocabularyCSS from '@stylesheets/vocabulary-test.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-test.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { IVocabulary4Quiz, MeanLanguage } from '@interfaces/IVocabulary'

import { upperFirst } from 'lodash'

type MeanProps = {
  meanData: IVocabulary4Quiz
  mainMeanLang: MeanLanguage
  subMeanLang: MeanLanguage
}

type SentenceProps = {
  meanData: IVocabulary4Quiz
  lang: MeanLanguage
}

type TlanslationProps = {
  meanData: IVocabulary4Quiz
  lang: MeanLanguage
}

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

// main mean
const Meaning = ({ meanData, lang }: SentenceProps) => {
  const mainLang: string = upperFirst(lang)
  let mainMean: string = ''

  switch (mainLang) {
    case 'Korean':
    case 'Chinese':
    case 'Japanese':
    case 'Vietnamese':
    case 'Indonesian':
    case 'English':
    case 'Britannica':
      mainMean = meanData.Question[mainLang]
      break

    default:
      mainMean = meanData.Question.Korean
  }

  return (
    <div className={style.meaning}>
      {meanData.Question.SpeechPart}. {mainMean}
    </div>
  )
}

// sentence mean
const Sentence = ({ meanData, lang }: TlanslationProps) => {
  const subLang: string = upperFirst(lang)
  let subMean = ''

  switch (subLang) {
    case 'Korean':
    case 'Chinese':
    case 'Japanese':
    case 'Vietnamese':
    case 'Indonesian':
    case 'English':
    case 'Britannica':
      subMean = meanData.Question['Britannica']
        ? meanData.Question['Britannica']
        : meanData.Question[subLang]
      break

    default:
      subMean = meanData.Question.Britannica
  }

  return (
    <div className={style.sentence}>
      {meanData.Question.SpeechPart}. {subMean}
    </div>
  )
}

export default function Mean({
  meanData,
  mainMeanLang,
  subMeanLang,
}: MeanProps) {
  return (
    <>
      <Meaning meanData={meanData} lang={mainMeanLang} />
      <Sentence meanData={meanData} lang={subMeanLang} />
    </>
  )
}
