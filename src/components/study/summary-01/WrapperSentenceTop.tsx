import summaryCSS from '@stylesheets/summary.module.scss'
import summaryCSSMobile from '@stylesheets/mobile/summary.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { ISummary1Quiz } from '@interfaces/ISummary'
import { IScoreBoardData } from '@interfaces/Common'
import { MultiPlayStateProps } from '@pages/study/Summary1'

import SentenceHelp from './SentenceHelp'
import SelectedSentence from './SelectedSentence'
import { useEffect, useRef } from 'react'

type WrapperSentenceTopProps = {
  isStepEnd: boolean
  multiPlayState: MultiPlayStateProps
  sentenceData: ISummary1Quiz[]
  selectedData: IScoreBoardData[]
  playSentence: (index: number) => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? summaryCSSMobile : summaryCSS

export default function WrapperSentenceTop({
  isStepEnd,
  multiPlayState,
  sentenceData,
  selectedData,
  playSentence,
}: WrapperSentenceTopProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.scrollTo({
        top: wrapperRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [selectedData])

  return (
    <div ref={wrapperRef} className={style.correctOrders}>
      {sentenceData.map((sentence, i) => {
        return selectedData[i] ? (
          <SelectedSentence
            key={`$ss-0${i}`}
            multiPlayState={multiPlayState}
            index={i}
            sentenceData={sentence}
            selectedData={selectedData[i]}
            playSentence={playSentence}
          />
        ) : (
          <></>
        )
      })}

      {!isStepEnd && <SentenceHelp />}
    </div>
  )
}
