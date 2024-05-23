import readingComprehensionCSS from '@stylesheets/reading-comprehension.module.scss'
import readingComprehensionCSSMobile from '@stylesheets/mobile/reading-comprehension.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { MultiPlayStateProps } from '@pages/study/ReadingComprehension2'
import { IcoPlay, IcoStop } from '@components/common/Icons'

type BtnPlaySentenceProps = {
  multiPlayState: MultiPlayStateProps
  sentence: string
  index: number
  playSentence: (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number,
  ) => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? readingComprehensionCSSMobile : readingComprehensionCSS

export default function BtnPlaySentence({
  multiPlayState,
  sentence,
  index,
  playSentence,
}: BtnPlaySentenceProps) {
  return (
    <div
      className={style.wordPlayButton2}
      onClick={(e) => {
        playSentence(e, index)
      }}
    >
      {multiPlayState.playState === 'playing' &&
      multiPlayState.seq === index ? (
        <IcoStop isColor width={24} height={24} />
      ) : (
        <IcoPlay isColor width={24} height={24} />
      )}
      <div className={style.txtL}>{sentence}</div>
    </div>
  )
}
