import trueOrFalseCSS from '@stylesheets/true-or-false.module.scss'
import trueOrFalseCSSMobile from '@stylesheets/mobile/true-or-false.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type WrapperCardProps = {
  checkAnswer: (target: HTMLDivElement, selectedBtn: boolean) => Promise<void>
}

import CardTrue from './CardTrue'
import CardFalse from './CardFalse'

const isMobile = useDeviceDetection()

const style = isMobile ? trueOrFalseCSSMobile : trueOrFalseCSS

export default function WrapperCard({ checkAnswer }: WrapperCardProps) {
  return (
    <div className={style.answers}>
      <CardTrue checkAnswer={checkAnswer} />

      <CardFalse checkAnswer={checkAnswer} />
    </div>
  )
}
