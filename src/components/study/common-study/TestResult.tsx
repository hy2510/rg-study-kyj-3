import testResultCSS from '@stylesheets/test-result.module.scss'
import testResultCSSMobile from '@stylesheets/mobile/test-result.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'
import useCharacter from '@hooks/study/useCharacter'

import { IScoreBoardData } from '@interfaces/Common'

import { LottieScrollDownAni } from '@components/common/LottieAnims'

import Gap from '@components/study/common-study/Gap'
import ScoreBoard from './test-result/ScoreBoard'

type TestResultProps = {
  step: number | string
  quizType: string
  quizAnswerCount: number
  studentAnswer: IScoreBoardData[]
  passMark?: number
  onFinishActivity: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? testResultCSSMobile : testResultCSS

// 기본결과화면
export default function TestResult({
  step,
  quizType,
  quizAnswerCount,
  studentAnswer,
  passMark,
  onFinishActivity,
}: TestResultProps) {
  const CHARACTER = useCharacter()
  let score = 0
  let correctCount = 0
  let incorrectCount = 0
  const point = 100 / studentAnswer.length

  studentAnswer.map((el) => {
    if (el.ox) {
      correctCount++

      switch (el.answerCount) {
        case 1:
          score += 1 * point
          break

        case 2:
          score += 0.5 * point
          break

        case 3:
          score += 0.25 * point
          break
      }
    } else {
      if (el.answerCount >= quizAnswerCount) incorrectCount++
    }
  })

  return (
    <div className={style.testResult}>
      <div className={style.quizType}>
        Step {step}. {quizType}
      </div>
      <div className={style.totalScoreContainer}>
        <div className={style.txtL}>SCORE: </div>
        <div className={`${style.totalScore} ${style.heartbeat}`}>
          {Math.floor(score)}
        </div>
      </div>

      <div className={style.container}>
        <div
          className={`${style.readingUnit} animate__animated animate__jackInTheBox`}
        >
          <img
            src={`https://wcfresource.a1edu.com/newsystem/image/character/subcharacter/${CHARACTER}_10.png`}
            alt=""
          />
          {/* <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                right: isMobile ? '-180px' : '-220px',
                bottom: '-50px',
              }}
            >
              <LottieScrollDownAni />
            </div>
          </div> */}
        </div>

        {passMark && <div className={style.passmark}>Passmark: {passMark}</div>}

        <div className={`${style.board1} animate__animated animate__fadeIn`}>
          <div className={style.correctScore}>
            <div className={style.title}>correct</div>
            <div className={style.number}>{correctCount}</div>
          </div>
          <div className={style.incorrectScore}>
            <div className={style.title}>incorrect</div>
            <div className={style.number}>{incorrectCount}</div>
          </div>
        </div>
        <div className={style.board2}>
          <ScoreBoard
            quizAnswerCount={quizAnswerCount}
            studentAnswer={studentAnswer}
          />
        </div>
        <Gap height={50} />
      </div>
      <div className={style.nextButton} onClick={() => onFinishActivity()}>
        Next
      </div>
    </div>
  )
}
