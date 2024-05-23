import writingActivityCSS from '@stylesheets/writing-activity.module.scss'
import writingActivityCSSMobile from '@stylesheets/mobile/writing-activity.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'
type WritingAreaProps = {
  answerData: string
  onChangeHandler: (text?: string) => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? writingActivityCSSMobile : writingActivityCSS

export default function WritingArea({
  answerData,
  onChangeHandler,
}: WritingAreaProps) {
  return (
    <div className={style.writingArea}>
      <textarea
        placeholder="Please fill out within 30 to 300 characters."
        value={answerData}
        onChange={(e) => onChangeHandler(e.currentTarget.value)}
      />
    </div>
  )
}
