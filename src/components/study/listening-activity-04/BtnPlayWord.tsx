import listeningCSS from '@stylesheets/listening-activity.module.scss'
import listeningCSSMobile from '@stylesheets/mobile/listening-activity.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { MultiPlayStateProps } from '@pages/study/ListeningActivity4'
import { IcoPlay, IcoStop } from '@components/common/Icons'

type BtnPlayWordProps = {
  multiPlayState: MultiPlayStateProps
  index: number
  playWord: (index: number) => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? listeningCSSMobile : listeningCSS

export default function BtnPlayWord({
  multiPlayState,
  index,
  playWord,
}: BtnPlayWordProps) {
  return (
    <div className={style.wordPlayButton2} onClick={() => playWord(index)}>
      {multiPlayState.playState === 'playing' &&
      multiPlayState.seq === index ? (
        <IcoStop isColor width={44} height={44} />
      ) : (
        <IcoPlay isColor width={44} height={44} />
      )}
    </div>
  )
}
