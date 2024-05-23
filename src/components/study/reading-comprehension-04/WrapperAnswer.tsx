import readingComprehensionCSS from '@stylesheets/reading-comprehension.module.scss'
import readingComprehensionCSSMobile from '@stylesheets/mobile/reading-comprehension.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { IReadingComprehension4Example } from '@interfaces/IReadingComprehension'

type WrapperAnswerProps = {
  isHideQuestion: boolean
  question: string
  exampleData: IReadingComprehension4Example[]
  checkAnswer: (
    selectedAnswer: string,
    target?: EventTarget & HTMLDivElement,
  ) => Promise<void>
}

import Gap from '../common-study/Gap'
import TextQuestion from './TextQuestion'
import WrapperExample from './WrapperExample'

const isMobile = useDeviceDetection()

const style = isMobile ? readingComprehensionCSSMobile : readingComprehensionCSS

export default function WrapperAnswer({
  isHideQuestion,
  question,
  exampleData,
  checkAnswer,
}: WrapperAnswerProps) {
  return (
    <div className={style.answers}>
      {isMobile ? <Gap height={5} /> : <Gap height={10} />}

      {!isHideQuestion && <TextQuestion question={question} />}

      {isMobile ? <Gap height={0} /> : <Gap height={10} />}

      <WrapperExample exampleData={exampleData} checkAnswer={checkAnswer} />
    </div>
  )
}
