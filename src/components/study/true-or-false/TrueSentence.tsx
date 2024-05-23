import trueOrFalseCSS from '@stylesheets/true-or-false.module.scss'
import trueOrFalseCSSMobile from '@stylesheets/mobile/true-or-false.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { PlayState } from '@hooks/study/useStudyAudio'

type TrueSentenceProps = {
  sentence: string
  playState: PlayState
  playTrueSentence: () => void
  goNextQuiz: () => void
}

import BtnPlaySentence from './BtnPlaySentence'

const isMobile = useDeviceDetection()

const style = isMobile ? trueOrFalseCSSMobile : trueOrFalseCSS

export default function TrueSentence({
  playState,
  sentence,
  playTrueSentence,
  goNextQuiz,
}: TrueSentenceProps) {
  return (
    <div className={style.trueSentencePopup}>
      <div className={style.title}>True Sentence</div>
      <div className={style.container}>
        <BtnPlaySentence
          playState={playState}
          playTrueSentence={playTrueSentence}
        />

        <div
          className={style.sentence}
          dangerouslySetInnerHTML={{ __html: sentence }}
        ></div>
      </div>
      <div className={style.nextButton} onClick={() => goNextQuiz()}>
        Next
      </div>
    </div>
  )
}
