import { useEffect, useRef } from 'react'

import summaryCSS from '@stylesheets/summary.module.scss'
import summaryCSSMobile from '@stylesheets/mobile/summary.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { WordDataProp } from '@pages/study/Summary2'

type AnswerProps = {
  isComplete: boolean
  wordData: WordDataProp
  questionNo: number
}

const isMobile = useDeviceDetection()

const style = isMobile ? summaryCSSMobile : summaryCSS

export default function Answer({
  isComplete,
  wordData,
  questionNo,
}: AnswerProps) {
  const answerRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (wordData.QuestionIndex === questionNo && answerRef.current !== null) {
      answerRef.current.scrollIntoView()
    }
  }, [questionNo])

  let word = ''

  if (wordData.State === 'none' && wordData.QuestionIndex > 0) {
    if (wordData.QuestionIndex === questionNo) {
      word = '?'
    }
  } else {
    word = wordData.Word
  }

  return (
    <span
      ref={answerRef}
      className={`
        ${style.answerBox}
        ${
          wordData.QuestionIndex === questionNo && !isComplete
            ? style.currentOrder
            : ''
        }
        ${wordData.State === 'correct' ? style.correctAnswer : ''}        
        ${wordData.State === 'incorrect' ? style.incorrectAnswer : ''}
      `}
      dangerouslySetInnerHTML={{ __html: word }}
    ></span>
  )
}
