import trueOrFalseCSS from '@stylesheets/true-or-false.module.scss'
import trueOrFalseCSSMobile from '@stylesheets/mobile/true-or-false.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type CardFalseProps = {
  checkAnswer: (target: HTMLDivElement, selectedBtn: boolean) => Promise<void>
}

const isMobile = useDeviceDetection()

const style = isMobile ? trueOrFalseCSSMobile : trueOrFalseCSS

export default function CardFalse({ checkAnswer }: CardFalseProps) {
  return (
    <div
      className={`${style.textCard}`}
      onClick={(e) => checkAnswer(e.currentTarget, false)}
    >
      <div className={style.answer}>
        <div className={style.false}>X</div>
        <div className={style.answerText}>False</div>
      </div>
    </div>
  )
}
