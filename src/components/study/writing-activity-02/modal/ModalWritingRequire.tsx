import stepIntroCSS from '@stylesheets/step-intro.module.scss'
import stepIntroCSSMobile from '@stylesheets/mobile/step-intro.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type ModalWritingRequireProps = {
  unit: string
  goWritingActivity: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? stepIntroCSSMobile : stepIntroCSS

export default function ModalWritingRequire({
  unit,
  goWritingActivity,
}: ModalWritingRequireProps) {
  return (
    <div className={style.stepIntro}>
      <div
        className={`${style.container} animate__animated animate__bounceInRight`}
      >
        <div className={style.stepOrder}>Step5</div>
        <div className={style.quizType}>Writing Activity</div>
        <div className={style.comment}>글쓰기 후 첨삭을 받으세요.</div>

        <div className={style.readingUnit}>
          <img
            src={`https://wcfresource.a1edu.com/newsystem/image/character/subcharacter/${unit}_13.png`}
            alt=""
          />
        </div>
        <div className={style.startButton} onClick={() => goWritingActivity()}>
          Start
        </div>
      </div>
    </div>
  )
}
