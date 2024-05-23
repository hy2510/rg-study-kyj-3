import summaryCSS from '@stylesheets/summary.module.scss'
import summaryCSSMobile from '@stylesheets/mobile/summary.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type TrueSentenceProps = {
  sentence: string
  playSentence: () => void
  goNextQuiz: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? summaryCSSMobile : summaryCSS

export default function TrueSentence({
  sentence,
  goNextQuiz,
}: TrueSentenceProps) {
  return (
    <div className={style.trueSentencePopup}>
      <div className={style.title}>True Sentence</div>
      <div className={style.container}>
        <div className={style.sentence}>{sentence}</div>
      </div>
      <div className={style.nextButton} onClick={() => goNextQuiz()}>
        Next
      </div>
    </div>
  )
}
