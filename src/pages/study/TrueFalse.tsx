import { useEffect, useState, useContext } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'
import { saveUserAnswer } from '@services/studyApi'
import { getTrueOrFalse } from '@services/quiz/TrueOrFalseAPI'

import trueOrFalseCSS from '@stylesheets/true-or-false.module.scss'
import trueOrFalseCSSMobile from '@stylesheets/mobile/true-or-false.module.scss'

// Types [
import {
  IStudyData,
  IScoreBoardData as IScoreBoard,
  IUserAnswer,
} from '@interfaces/Common'
// ] Types

// utils & hooks
import useStepIntro from '@hooks/common/useStepIntro'
import { useQuiz } from '@hooks/study/useQuiz'
import { useQuizTimer } from '@hooks/study/useQuizTimer'
import { useAnimation } from '@hooks/study/useAnimation'
import { useFetch } from '@hooks/study/useFetch'
import { useCurrentQuizNo } from '@hooks/study/useCurrentQuizNo'
import { useStudentAnswer } from '@hooks/study/useStudentAnswer'
import useStudyAudio from '@hooks/study/useStudyAudio'
import useBottomPopup from '@hooks/study/useBottomPopup'
import { useResult } from '@hooks/study/useResult'
import useDeviceDetection from '@hooks/common/useDeviceDetection'

// components - common
import StepIntro from '@components/study/common-study/StepIntro'
import QuizHeader from '@components/study/common-study/QuizHeader'
import StudySideMenu from '@components/study/common-study/StudySideMenu'
import QuizBody from '@components/study/common-study/QuizBody'
import Gap from '@components/study/common-study/Gap'
import Container from '@components/study/common-study/Container'
import StudyPopupBottom from '@components/study/common-study/StudyPopupBottom'
import TestResult from '@components/study/common-study/TestResult'

// components - true or false
import TextQuestion from '@components/study/true-or-false/TextQuestion'
import WrapperCard from '@components/study/true-or-false/WrapperCard'
import TrueSentence from '@components/study/true-or-false/TrueSentence'

const STEP_TYPE = 'True or False'

const isMobile = useDeviceDetection()

const style = isMobile ? trueOrFalseCSSMobile : trueOrFalseCSS

export default function TrueFalse(props: IStudyData) {
  const { handler } = useContext(AppContext) as AppContextProps
  const STEP = props.currentStep

  const timer = useQuizTimer(() => {
    if (quizData) {
      // 시간초과인 경우
      if (quizData.QuizTime > 300) {
        // doLogout()
      } else {
        checkAnswerTimeOut()
      }
    }
  })

  // 애니메이션 hook
  const animationManager = useAnimation()

  // 인트로 및 결과창
  const [introAnim, setIntroAnim] = useState<
    'animate__bounceInRight' | 'animate__bounceOutLeft'
  >('animate__bounceInRight')
  const { isStepIntro, closeStepIntro } = useStepIntro()
  const { isResultShow, changeResultShow } = useResult()

  // 사이드 메뉴
  const [isSideOpen, setSideOpen] = useState(false)

  // 퀴즈 데이터 세팅
  const { quizState, changeQuizState } = useQuiz()
  const [quizData, recordedData] = useFetch(getTrueOrFalse, props, STEP) // 퀴즈 데이터 / 저장된 데이터

  // 과거 기록
  const {
    scoreBoardData,
    setStudentAnswers,
    addStudentAnswers,
    makeUserAnswerData,
  } = useStudentAnswer()
  const [quizNo, setQuizNo] = useState<number>(1) // 퀴즈 번호
  const [tryCount, setTryCount] = useState(0) // 시도 횟수
  const [incorrectCount, setIncorrectCount] = useState<number>(0) // 문제 틀린 횟수

  // 정 / 오답시 하단에 나오는 correct / incorrect
  const { bottomPopupState, changeBottomPopupState } = useBottomPopup()

  // 정답 모달
  const [isTrueSentence, setIsTrueSentence] = useState(false)

  // audio
  const { playState, playAudio, stopAudio } = useStudyAudio()

  useEffect(() => {
    if (!isStepIntro && quizData) {
      timer.setup(quizData.QuizTime, true)
      changeQuizState('studying')
    }
  }, [isStepIntro])

  // 데이터를 받아온 후
  useEffect(() => {
    if (quizData) {
      // 현재 퀴즈 번호
      const [currentQuizNo, tryCnt] = useCurrentQuizNo(
        recordedData,
        quizData.QuizAnswerCount,
      )

      setTryCount(tryCnt)
      setIncorrectCount(tryCnt)
      setStudentAnswers(recordedData, quizData.QuizAnswerCount) // 기존 데이터를 채점판에 넣어주기
      setQuizNo(currentQuizNo)
    }
  }, [quizData])

  // quizNo가 바뀌면 문제가 바뀐 것으로 인식
  useEffect(() => {
    if (!isStepIntro && !isResultShow && quizData) {
      timer.setup(quizData.QuizTime, true)

      setTryCount(0)
      setIncorrectCount(0)

      changeQuizState('studying')
    }
  }, [quizNo])

  useEffect(() => {
    if (quizState === 'studying' && quizData && !isStepIntro && !isResultShow) {
      playSentence()
    }
  }, [quizState])

  // true sentence가 사라지면
  useEffect(() => {
    if (quizData && !isStepIntro && !isResultShow) {
      if (isTrueSentence) {
        playTrueSentence()
      } else {
        if (quizNo + 1 > quizData.Quiz.length) {
          // 마지막 문제 처리
          changeResultShow(true)
        } else {
          setQuizNo(quizNo + 1)
        }
      }
    }
  }, [isTrueSentence])

  // 로딩
  if (!quizData) return <>Loading...</>

  /**
   * [ 정/오답 체크 ]
   * @param buttonType True / False 버튼인지 구분
   */
  const checkAnswer = async (target: HTMLDivElement, selectedBtn: boolean) => {
    try {
      changeQuizState('checking')

      if (quizState === 'studying') {
        stopAudio()

        timer.stop()

        // 정 / 오답 구별
        const replaceHTMLReg = /<[^>]*>/gi
        const question = quizData.Quiz[quizNo - 1].Question.Text
        const correctText = quizData.Quiz[quizNo - 1].Examples[0].Text
        const isCorrectText = question === correctText
        const isCorrect = isCorrectText === selectedBtn

        // 채점판 생성
        const answerData: IScoreBoard = {
          quizNo: quizNo,
          maxCount: quizData.QuizAnswerCount,
          answerCount: tryCount + 1,
          ox: isCorrect,
        }
        // 유저 답 데이터 생성
        const userAnswer: IUserAnswer = makeUserAnswerData({
          mobile: '',
          studyId: props.studyId,
          studentHistoryId: props.studentHistoryId,
          bookType: props.bookType,
          step: STEP,
          quizId: quizData.Quiz[quizNo - 1].QuizId,
          quizNo: quizData.Quiz[quizNo - 1].QuizNo,
          currentQuizNo: quizNo,
          correct: quizData.Quiz[quizNo - 1].Question.Text.replace(
            replaceHTMLReg,
            '',
          ),
          selectedAnswer: `${isCorrect ? '1' : '2'}`,
          tryCount: tryCount + 1,
          maxQuizCount: quizData.QuizAnswerCount,
          quizLength: quizData.Quiz.length,
          isCorrect: isCorrect,
          answerData: answerData,
          isFinishStudy: props.lastStep === STEP ? true : false,
        })

        // 서버에 유저 답안 저장
        const res = await saveUserAnswer(userAnswer)

        // todo 에러 처리
        if (Number(res.result) === 0) {
          if (res.resultMessage) {
            handler.finishStudy = {
              id: Number(res.result),
              cause: res.resultMessage,
            }
          }

          addStudentAnswers(answerData)

          // 문제 정/오답 판단 및 애니메이션 부여
          if (isCorrect) {
            animationManager.play(target, ['animate__fadeIn', style.correct])
          } else {
            animationManager.play(target, ['animate__pulse', style.incorrect])
            setIncorrectCount(incorrectCount + 1)
          }

          setTryCount(tryCount + 1)

          afterCheckAnswer(isCorrect, isCorrectText, target)
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  /**
   * 시간 초과로 인한 오답
   */
  const checkAnswerTimeOut = async () => {
    try {
      changeQuizState('checking')

      if (quizState === 'studying') {
        stopAudio()

        timer.stop()

        // 정 / 오답 구별
        const replaceHTMLReg = /<[^>]*>/gi
        const question = quizData.Quiz[quizNo - 1].Question.Text
        const correctText = quizData.Quiz[quizNo - 1].Examples[0].Text
        const isCorrectText = question === correctText

        // 채점판 생성
        const answerData: IScoreBoard = {
          quizNo: quizNo,
          maxCount: quizData.QuizAnswerCount,
          answerCount: tryCount + 1,
          ox: false,
        }
        // 유저 답 데이터 생성
        const userAnswer: IUserAnswer = makeUserAnswerData({
          mobile: '',
          studyId: props.studyId,
          studentHistoryId: props.studentHistoryId,
          bookType: props.bookType,
          step: STEP,
          quizId: quizData.Quiz[quizNo - 1].QuizId,
          quizNo: quizData.Quiz[quizNo - 1].QuizNo,
          currentQuizNo: quizNo,
          correct: quizData.Quiz[quizNo - 1].Question.Text.replace(
            replaceHTMLReg,
            '',
          ),
          selectedAnswer: '2',
          tryCount: tryCount + 1,
          maxQuizCount: quizData.QuizAnswerCount,
          quizLength: quizData.Quiz.length,
          isCorrect: false,
          answerData: answerData,
          isFinishStudy: props.lastStep === STEP ? true : false,
        })

        // 서버에 유저 답안 저장
        const res = await saveUserAnswer(userAnswer)

        // todo 에러 처리
        if (Number(res.result) === 0) {
          if (res.resultMessage) {
            handler.finishStudy = {
              id: Number(res.result),
              cause: JSON.stringify(res.resultMessage),
            }
          }

          addStudentAnswers(answerData)

          setIncorrectCount(incorrectCount + 1)
          setTryCount(tryCount + 1)

          afterCheckAnswer(false, isCorrectText)
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  /** 정/오답 체크 후 실행되는 함수
   * @param target 타겟 Element
   * @param isCorrect 유저가 정답을 맞혔는지
   * @param isCorrectText 문장이 정답인지
   */
  const afterCheckAnswer = (
    isCorrect: boolean,
    isCorrectText: boolean,
    target?: HTMLDivElement,
  ) => {
    // 하단 정/오답
    changeBottomPopupState({
      isActive: true,
      isCorrect: isCorrect,
    })

    setTimeout(() => {
      // 하단 정/오답 숨김
      changeBottomPopupState({
        isActive: false,
        isCorrect: false,
      })

      // 버튼 초기화
      if (target) {
        animationManager.remove(target, [
          'animate__fadeIn',
          'animate__headShake',
          style.correct,
          style.incorrect,
        ])
      }

      if (isCorrectText) {
        if (quizNo + 1 > quizData.Quiz.length) {
          // 마지막 문제 처리
          changeResultShow(true)
        } else {
          setQuizNo(quizNo + 1)
        }
      } else {
        // 정답 모달창
        setIsTrueSentence(true)
      }
    }, 2000)
  }

  /** 다음 퀴즈로 넘어가는 함수 */
  const goNextQuiz = () => {
    stopAudio()
    setIsTrueSentence(false)
  }

  const changeSideMenu = (state: boolean) => {
    setSideOpen(state)
  }

  const playSentence = () => {
    if (playState === 'playing') {
      stopAudio()
    } else {
      playAudio(quizData.Quiz[quizNo - 1].Question.Sound)
    }
  }

  const playTrueSentence = () => {
    if (playState === 'playing') {
      stopAudio()
    } else {
      playAudio(quizData.Quiz[quizNo - 1].Examples[0].Sound)
    }
  }

  return (
    <>
      {isStepIntro ? (
        <div
          className={`animate__animated ${introAnim}`}
          onAnimationEnd={() => {
            if (introAnim === 'animate__bounceOutLeft') {
              closeStepIntro()
            }
          }}
        >
          <StepIntro
            step={STEP}
            quizType={STEP_TYPE}
            comment={'문장을 읽고 맞으면 O, 틀리면 X를 누르세요.'}
            onStepIntroClozeHandler={() => {
              setIntroAnim('animate__bounceOutLeft')
            }}
          />
        </div>
      ) : (
        <>
          {isResultShow ? (
            <TestResult
              step={STEP}
              quizType={STEP_TYPE}
              quizAnswerCount={quizData.QuizAnswerCount}
              studentAnswer={scoreBoardData}
              onFinishActivity={props.onFinishActivity}
            />
          ) : (
            <>
              <QuizHeader
                quizNumber={quizNo}
                totalQuizCnt={Object.keys(quizData.Quiz).length}
                life={quizData.QuizAnswerCount - incorrectCount}
                timeMin={timer.time.timeMin}
                timeSec={timer.time.timeSec}
                changeSideMenu={changeSideMenu}
              />

              <div
                className={`${style.comment} animate__animated animate__fadeInLeft`}
              >
                {STEP_TYPE}
              </div>

              <QuizBody>
                {!isTrueSentence ? (
                  <>
                    <Gap height={15} />

                    <Container
                      typeCSS={style.trueOrFalse}
                      containerCSS={style.container}
                    >
                      <Gap height={10} />

                      {/* 질문 */}
                      <TextQuestion
                        text={quizData.Quiz[quizNo - 1].Question.Text}
                      />

                      <Gap height={10} />

                      {/* 보기 */}
                      <WrapperCard checkAnswer={checkAnswer} />
                    </Container>
                    <Gap height={15} />
                  </>
                ) : (
                  <TrueSentence
                    playState={playState}
                    sentence={quizData.Quiz[quizNo - 1].Examples[0].Text}
                    playTrueSentence={playTrueSentence}
                    goNextQuiz={goNextQuiz}
                  />
                )}
              </QuizBody>

              <StudySideMenu
                isSideOpen={isSideOpen}
                currentStep={STEP}
                currentStepType={STEP_TYPE}
                quizLength={quizData.Quiz.length}
                maxAnswerCount={quizData.QuizAnswerCount}
                scoreBoardData={scoreBoardData}
                changeSideMenu={changeSideMenu}
              />

              <StudyPopupBottom bottomPopupState={bottomPopupState} />
            </>
          )}
        </>
      )}
    </>
  )
}
