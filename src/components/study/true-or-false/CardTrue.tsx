import trueOrFalseCSS from '@stylesheets/true-or-false.module.scss'
import trueOrFalseCSSMobile from '@stylesheets/mobile/true-or-false.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type CardTrueProps = {
  checkAnswer: (target: HTMLDivElement, selectedBtn: boolean) => Promise<void>
}

const isMobile = useDeviceDetection()

const style = isMobile ? trueOrFalseCSSMobile : trueOrFalseCSS

export default function CardTrue({ checkAnswer }: CardTrueProps) {
  return (
    <div
      className={`${style.textCard}`}
      onClick={(e) => checkAnswer(e.currentTarget, true)}
    >
      <div className={style.answer}>
        <div className={style.true}>O</div>
        <div className={style.answerText}>True</div>
      </div>
    </div>
  )
}
