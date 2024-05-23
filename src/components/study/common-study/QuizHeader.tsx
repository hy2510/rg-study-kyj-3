import { IcoHeart } from '@components/common/Icons'

import quizTemplateCSS from '@stylesheets/quiz-template.module.scss'
import quizTemplateMobileCSS from '@stylesheets/mobile/quiz-template.module.scss'
import useDeviceDetection from '@hooks/common/useDeviceDetection'

const isMobile = useDeviceDetection()
const style = isMobile ? quizTemplateMobileCSS : quizTemplateCSS

interface QuizHeaderProps {
  quizNumber: number
  totalQuizCnt: number
  life: number
  timeMin: number
  timeSec: number
  changeSideMenu: (state: boolean) => void
}

export default function QuizHeader({
  quizNumber,
  totalQuizCnt,
  life,
  timeMin,
  timeSec,
  changeSideMenu,
}: QuizHeaderProps) {
  //남은 시간
  const timeText = `${timeMin <= 9 ? `0` + timeMin : timeMin}:${
    timeSec <= 9 ? `0` + timeSec : timeSec
  }`

  return (
    <div
      className={`${style.quizHeader} animate__animated animate__slideInDown`}
    >
      <div className={style.quizHeaderCol1}>
        <div className={style.quizNumber}>
          {quizNumber}
          <span style={{ fontSize: '16px' }}>/</span>
          {totalQuizCnt}
          <div className={style.attempts}>
            <IcoHeart isColor width={18} height={18} />
            <div className={style.txtL}>{life}</div>
          </div>
        </div>
        <div className={style.qMark}></div>
      </div>
      <div className={style.quizHeaderCol2}>
        <div className={style.quizTimer}>
          <div className={style.iconTimer}></div>
          {timeText}
        </div>
      </div>
      <div className={style.quizHeaderCol3}>
        <div
          className={style.openMenuButton}
          onClick={() => changeSideMenu(true)}
        ></div>
      </div>
    </div>
  )
}
