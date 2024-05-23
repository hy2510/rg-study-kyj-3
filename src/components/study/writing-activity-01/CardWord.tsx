import writingActivityCSS from '@stylesheets/writing-activity.module.scss'
import writingActivityCSSMobile from '@stylesheets/mobile/writing-activity.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type CardWordProps = {
  text: string
  removeWord: (word: string) => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? writingActivityCSSMobile : writingActivityCSS

export default function CardWord({ text, removeWord }: CardWordProps) {
  return (
    <div className={`${style.textCard}`} onClick={() => removeWord(text)}>
      <div className={style.awnserText}>{text}</div>
    </div>
  )
}
