import vocabularyCSS from '@stylesheets/vocabulary-test.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-test.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { PlayState } from '@hooks/study/useStudyAudio'

import BtnPlayWord from './BtnPlayWord'

type BtnHintProps = {
  isHint: boolean
  playState: PlayState
  remainCount: number | undefined
  totalCount: number | undefined
  toggleHint: () => void
  playHint: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

export default function BtnHint({
  isHint,
  playState,
  remainCount,
  totalCount,
  toggleHint,
  playHint,
}: BtnHintProps) {
  return (
    <div style={{ position: 'relative' }}>
      <div className={style.hintButton} onClick={() => toggleHint()}>
        <span>
          Hint {remainCount && totalCount ? totalCount - remainCount : 0} /
          {totalCount}
        </span>
      </div>

      {isHint && (
        <div
          style={{ position: 'relative' }}
          className="animate__animated animate__fadeIn"
        >
          <div className={style.hintPopup}>
            <BtnPlayWord playState={playState} playHint={playHint} />
          </div>
          <div className={style.screenBlock} onClick={() => toggleHint()}></div>
        </div>
      )}
    </div>
  )
}
