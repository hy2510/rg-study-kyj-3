import writingActivityCSS from '@stylesheets/writing-activity.module.scss'
import writingActivityCSSMobile from '@stylesheets/mobile/writing-activity.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { SentenceState } from '@pages/study/WritingActivity1'

import CardWord from './CardWord'

type WrapperSentenceBoxProps = {
  sentenceState: SentenceState
  sentenceData: string[]
  removeWord: (word: string) => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? writingActivityCSSMobile : writingActivityCSS

export default function WrapperSentenceBox({
  sentenceState,
  sentenceData,
  removeWord,
}: WrapperSentenceBoxProps) {
  return (
    <div
      className={`${style.enterBox} ${
        sentenceState === 'correct'
          ? style.correctText
          : sentenceState === 'incorrect'
          ? style.incorrectText
          : ''
      }`}
    >
      {sentenceData.map((sentence, i) => {
        return <CardWord text={sentence} removeWord={removeWord} />
      })}
    </div>
  )
}
