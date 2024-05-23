import trueSentenceCSS from '@stylesheets/true-sentence.module.scss'
import trueSentenceCSSMobile from '@stylesheets/mobile/true-sentence.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

const isMobile = useDeviceDetection()

const style = isMobile ? trueSentenceCSSMobile : trueSentenceCSS

import { PlayState } from '@hooks/study/useStudyAudio'
import { IcoPlay, IcoStop } from '@components/common/Icons'

type trueSentenceProps = {
  playState: PlayState
  sentence: string
  changeCorrectSentenceState: (state: boolean) => void
  playSentence: () => void
}

export default function CorrectSentence({
  playState,
  sentence,
  changeCorrectSentenceState,
  playSentence,
}: trueSentenceProps) {
  return (
    <div className={style.trueSentencePopup}>
      <div className={style.title}>Correct Sentence</div>

      <div className={style.container}>
        <div className={style.wordPlayButton} onClick={() => playSentence()}>
          {playState === 'playing' ? (
            <IcoStop isColor width={24} height={24} />
          ) : (
            <IcoPlay isColor width={24} height={24} />
          )}
          <div className={style.txtL}>Playback</div>
        </div>

        <div className={style.sentence}>{sentence}</div>
      </div>

      <div
        className={style.nextButton}
        onClick={() => changeCorrectSentenceState(false)}
      >
        Next
      </div>
    </div>
  )
}
