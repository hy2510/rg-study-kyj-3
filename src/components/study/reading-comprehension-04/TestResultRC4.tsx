import testResultCSS from '@stylesheets/test-result.module.scss'
import testResultCSSMobile from '@stylesheets/mobile/test-result.module.scss'

import { IRecordAnswerType, IScoreBoardData } from '@interfaces/Common'
import { IReadingComprehension4 } from '@interfaces/IReadingComprehension'

import useCharacter from '@hooks/study/useCharacter'
import useDeviceDetection from '@hooks/common/useDeviceDetection'

import ScoreBoard from '../common-study/test-result/ScoreBoard'
import Gap from '@components/study/common-study/Gap'
import WrapperWrongAnswer from './test-result/WrapperWrongAnswer'
import { LottieScrollDownAni } from '@components/common/LottieAnims'

const isMobile = useDeviceDetection()

const style = isMobile ? testResultCSSMobile : testResultCSS

type TestResultProps = {
  isReTest: boolean
  isReTestFail: boolean
  step: number | string
  quizType: string
  quizAnswerCount: number
  studentAnswer: IScoreBoardData[]
  quizData: IReadingComprehension4
  failedExample: IRecordAnswerType[]
  passMark?: number
  doReTest: () => void
  onFinishActivity: any
}

// 기본결과화면
export default function TestResult({
  isReTest,
  isReTestFail,
  step,
  quizType,
  quizAnswerCount,
  studentAnswer,
  quizData,
  failedExample,
  passMark,
  doReTest,
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
      if (el.answerCount === quizAnswerCount) incorrectCount++
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
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                right: isMobile ? '-180px' : '-220px',
                bottom: '-50px',
              }}
            >
              <LottieScrollDownAni />
            </div>
          </div>
        </div>

        <div className={style.passmark}>Passmark: {passMark}</div>

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
          {isReTest ? (
            <ScoreBoard
              quizAnswerCount={quizAnswerCount}
              studentAnswer={studentAnswer}
            />
          ) : (
            <WrapperWrongAnswer
              quizData={quizData}
              failedExample={failedExample}
            />
          )}
        </div>
        <Gap height={50} />
      </div>

      {isReTest ? (
        isReTestFail ? (
          <div
            className={style.nextButton}
            onClick={() => {
              try {
                window.onExitStudy()
              } catch (e) {
                location.replace('/')
              }
            }}
          >
            OK
          </div>
        ) : (
          <div className={style.nextButton} onClick={() => doReTest()}>
            Re Test
          </div>
        )
      ) : (
        <div className={style.nextButton} onClick={() => onFinishActivity()}>
          Next
        </div>
      )}
    </div>
  )
}
