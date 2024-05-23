import stepIntroCSS from '@stylesheets/step-intro.module.scss'
import stepIntroCSSMobile from '@stylesheets/mobile/step-intro.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'
import useCharacter from '@hooks/study/useCharacter'

type StepIntroProps = {
  step: number | string
  quizType: string
  comment: string
  onStepIntroClozeHandler: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? stepIntroCSSMobile : stepIntroCSS

export default function StepIntro({
  step,
  quizType,
  comment,
  onStepIntroClozeHandler,
}: StepIntroProps) {
  const CHARACTER = useCharacter()

  return (
    <div className={style.stepIntro}>
      <div
        className={`${style.container} animate__animated animate__bounceInRight`}
      >
        <div className={style.stepOrder}>
          {step === 'R' ? 'Re Test' : `Step ${step}`}
        </div>
        <div className={style.quizType}>{quizType}</div>
        <div className={style.comment}>{comment}</div>
        <div className={style.readingUnit}>
          <img
            src={`https://wcfresource.a1edu.com/newsystem/image/character/subcharacter/${CHARACTER}_13.png`}
            alt=""
          />
        </div>
        <div className={style.startButton} onClick={onStepIntroClozeHandler}>
          Start
        </div>
      </div>
    </div>
  )
}
