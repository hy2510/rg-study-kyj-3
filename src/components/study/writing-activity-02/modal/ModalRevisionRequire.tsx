import testResultCSS from '@stylesheets/test-result.module.scss'
import testResultCSSMobile from '@stylesheets/mobile/test-result.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type ModalRevisionRequireProps = {
  currentSubmitCount: number
  maxSubmitCount: number
  submitWritingActivity: () => Promise<void>
}

const isMobile = useDeviceDetection()

const style = isMobile ? testResultCSSMobile : testResultCSS

export default function ModalRevisionRequire({
  currentSubmitCount,
  maxSubmitCount,
  submitWritingActivity,
}: ModalRevisionRequireProps) {
  return (
    <div className={style.submitRevision}>
      <div
        className={`${style.container} animate__animated animate__bounceInRight`}
      >
        <div className={style.stepOrder}>Step5. Writing Activity</div>
        <div className={style.title}>이 달의 첨삭</div>

        <div className={style.revisionBoard}>
          <div className={style.txtLabel}>목표 첨삭:</div>
          <div className={style.txtCount}>{maxSubmitCount}</div>

          <div className={style.txtLabel}>남은 첨삭:</div>
          <div className={style.txtCount}>
            {maxSubmitCount - currentSubmitCount - 1}
          </div>

          <div className={style.txtLabel}>첨삭 완료:</div>
          <div className={style.txtCount}>
            {currentSubmitCount + 1} / {maxSubmitCount}
          </div>
        </div>

        <div className={`${style.selectBox} ${style.revisionDone}`}>
          <div
            className={style.yesButton}
            onClick={() => submitWritingActivity()}
          >
            Done
          </div>
        </div>
      </div>
    </div>
  )
}
