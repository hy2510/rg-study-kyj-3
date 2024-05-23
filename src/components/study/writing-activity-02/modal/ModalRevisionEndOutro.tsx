import testResultCSS from '@stylesheets/test-result.module.scss'
import testResultCSSMobile from '@stylesheets/mobile/test-result.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type ModalRevisionEndOutroProps = {
  currentSubmitCount: number
  maxSubmitCount: number
  submitNoRevision: () => Promise<void>
}

const isMobile = useDeviceDetection()

const style = isMobile ? testResultCSSMobile : testResultCSS

export default function ModalRevisionEndOutro({
  currentSubmitCount,
  maxSubmitCount,
  submitNoRevision,
}: ModalRevisionEndOutroProps) {
  return (
    <div className={style.submitRevision}>
      <div
        className={`${style.container} animate__animated animate__bounceInRight`}
      >
        <div className={style.stepOrder}>Step5. Writing Activity</div>
        <div className={style.title}>이 달의 첨삭</div>
        <div className={style.comment}>
          수고했어요! 이달의 남은 첨삭은 모두 사용했어요.
        </div>
        <div className={style.revisionBoard}>
          <div className={style.txtLabel}>남은 첨삭:</div>
          <div className={style.txtCount}>
            {maxSubmitCount - currentSubmitCount} / {maxSubmitCount}
          </div>
          <div className={style.txtLabel}>첨삭 완료:</div>
          <div className={style.txtCount}>{currentSubmitCount}</div>
        </div>
        <div className={`${style.selectBox} ${style.revisionDone}`}>
          <div className={style.noButton} onClick={() => submitNoRevision()}>
            Done
          </div>
        </div>
      </div>
    </div>
  )
}
