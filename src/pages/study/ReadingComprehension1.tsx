import { useEffect, useState, useContext } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'
import { saveUserAnswer } from '@services/studyApi'
import { getReadingComprehension1 } from '@services/quiz/RedaingComprehensionAPI'

import readingComprehensionCSS from '@stylesheets/reading-comprehension.module.scss'
import readingComprehensionCSSMobile from '@stylesheets/mobile/reading-comprehension.module.scss'

// Types [
import {
  IStudyData,
  IScoreBoardData as IScoreBoard,
  IUserAnswer,
} from '@interfaces/Common'
import { IReadingComprehension1Example } from '@interfaces/IReadingComprehension'
// ] Types

// utils & hooks
import { shuffle } from 'lodash'
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

// components - reading comprehension 1
import BtnPlayWord from '@components/study/reading-comprehension-01/BtnPlayWord'
import Example from '@components/study/reading-comprehension-01/Example'

const STEP_TYPE = 'Reading Comprehension'

const isMobile = useDeviceDetection()

const style = isMobile ? readingComprehensionCSSMobile : readingComprehensionCSS

export default function ReadingComprehension1(props: IStudyData) {
  const { handler } = useContext(AppContext) as AppContextProps
  const STEP = props.currentStep

  const timer = useQuizTimer(() => {
    // timer가 0에 도달하면 호출되는 콜백함수 구현
    // doLogout()
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
  // 퀴즈 데이터 / 저장된 데이터
  const [quizData, recordedData] = useFetch(
    getReadingComprehension1,
    props,
    STEP,
  )
  const [quizNo, setQuizNo] = useState<number>(1) // 퀴즈 번호
  const {
    scoreBoardData,
    setStudentAnswers,
    addStudentAnswers,
    makeUserAnswerData,
  } = useStudentAnswer()
  const [exampleData, setExamples] = useState<IReadingComprehension1Example[]>(
    [],
  ) // 과거 기록
  const [tryCount, setTryCount] = useState(0) // 시도 횟수
  const [incorrectCount, setIncorrectCount] = useState<number>(0) // 문제 틀린 횟수

  // 정 / 오답시 하단에 나오는 correct / incorrect
  const { bottomPopupState, changeBottomPopupState } = useBottomPopup()

  // audio
  const { playState, playAudio, stopAudio } = useStudyAudio()

  useEffect(() => {
    if (!isStepIntro && quizData) {
      timer.setup(quizData.QuizTime, true)
      changeQuizState('studying')
    }
  }, [isStepIntro])

  useEffect(() => {
    if (quizData) {
      // 현재 퀴즈 번호
      const [currentQuizNo, tryCnt] = useCurrentQuizNo(
        recordedData,
        quizData.QuizAnswerCount,
      )

      setTryCount(tryCnt)
      setIncorrectCount(tryCnt)
      setExamples(shuffle(quizData.Quiz[currentQuizNo - 1].Examples))
      setStudentAnswers(recordedData, quizData.QuizAnswerCount) // 기존 데이터를 채점판에 넣어주기
      setQuizNo(currentQuizNo)
    }
  }, [quizData])

  // quizNo가 바뀌면 문제가 바뀐 것으로 인식
  useEffect(() => {
    if (!isStepIntro && !isResultShow && quizData) {
      setExamples(shuffle(quizData.Quiz[quizNo - 1].Examples))

      setTryCount(0)
      setIncorrectCount(0)

      timer.setup(quizData.QuizTime, true)
      changeQuizState('studying')
    }
  }, [quizNo])

  useEffect(() => {
    if (quizState === 'studying' && quizData && !isStepIntro && !isResultShow) {
      timer.start()
      playAudio(quizData.Quiz[quizNo - 1].Question.Sound)
    }
  }, [quizState])

  // 결과창 노출
  useEffect(() => {
    if (isResultShow) {
      timer.stop()
    }
  }, [isResultShow])

  // 로딩
  if (!quizData) return <>Loading...</>

  /**
   * [ 정/오답 체크 ]
   * @param target 유저가 선택한 div
   * @param selectedText 유저가 선택한 답안
   */
  const checkAnswer = async (
    target: EventTarget & HTMLDivElement,
    selectedAnswer: string,
  ) => {
    try {
      changeQuizState('checking')

      // 정 / 오답 구별
      const isCorrect =
        quizData.Quiz[quizNo - 1].Question.Text === selectedAnswer

      // 채점판
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
        correct: quizData.Quiz[quizNo - 1].Question.Text,
        selectedAnswer: selectedAnswer,
        tryCount: tryCount + 1,
        maxQuizCount: quizData.QuizAnswerCount,
        quizLength: quizData.Quiz.length,
        isCorrect: isCorrect,
        answerData: answerData,
        isFinishStudy: props.lastStep === STEP ? true : false,
      })

      if (quizState === 'studying') {
        timer.stop()

        // 서버에 유저 답안 저장
        const res = await saveUserAnswer(userAnswer)

        if (Number(res.result) === 0) {
          if (res.resultMessage) {
            handler.finishStudy = {
              id: Number(res.result),
              cause: res.resultMessage,
            }
          }

          addStudentAnswers(answerData)

          if (!isCorrect) {
            setIncorrectCount(incorrectCount + 1)
          }

          setTryCount(tryCount + 1)

          afterCheckAnswer(target, isCorrect)
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  const afterCheckAnswer = (
    target: EventTarget & HTMLDivElement,
    isCorrect: boolean,
  ) => {
    timer.stop()

    changeBottomPopupState({
      isActive: true,
      isCorrect: isCorrect,
    })

    if (isCorrect) {
      animationManager.play(target, ['animate__fadeIn', style.correct])
    } else {
      animationManager.play(target, ['animate__headShake', style.incorrect])
    }
  }

  const onAnimationEndHandler = (e: React.AnimationEvent<HTMLDivElement>) => {
    const target = e.currentTarget

    setTimeout(() => {
      animationManager.remove(target, [
        'animate__fadeIn',
        'animate__headShake',
        style.correct,
        style.incorrect,
      ])

      changeBottomPopupState({
        isActive: false,
        isCorrect: false,
      })

      setTryCount(0)
      setIncorrectCount(0)

      if (quizNo + 1 > quizData.Quiz.length) {
        changeResultShow(true)
      } else {
        setQuizNo(quizNo + 1)
      }
    }, 1500)
  }

  /**
   * 헤더 메뉴 클릭하는 기능
   */
  const changeSideMenu = (state: boolean) => {
    setSideOpen(state)
  }

  const playQuestion = () => {
    if (playState === '') {
      playAudio(quizData.Quiz[quizNo - 1].Question.Sound)
    } else {
      stopAudio()
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
            comment={'문장을 듣고 알맞은 카드를 고르세요.'}
            onStepIntroClozeHandler={() => {
              setIntroAnim('animate__bounceOutLeft')
            }}
          />
        </div>
      ) : (
        <>
          {isResultShow ? (
            <>
              <TestResult
                step={STEP}
                quizType={STEP_TYPE}
                quizAnswerCount={quizData.QuizAnswerCount}
                studentAnswer={scoreBoardData}
                onFinishActivity={props.onFinishActivity}
              />
            </>
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
                {isMobile ? <Gap height={0} /> : <Gap height={15} />}

                <BtnPlayWord
                  playState={playState}
                  question={quizData.Quiz[quizNo - 1].Question.Text}
                  onPlay={playQuestion}
                />

                {isMobile ? <Gap height={10} /> : <Gap height={15} />}

                <Container
                  typeCSS={style.readingComprehension1}
                  containerCSS={style.container}
                >
                  {exampleData.map((example, i) => {
                    return (
                      <Example
                        index={i + 1}
                        img={example.Image}
                        text={example.Text}
                        checkAnswer={checkAnswer}
                        onAnimationEndHandler={onAnimationEndHandler}
                      />
                    )
                  })}
                </Container>

                {isMobile ? <></> : <Gap height={15} />}
              </QuizBody>

              <StudySideMenu
                isSideOpen={isSideOpen}
                currentStep={STEP}
                currentStepType={STEP_TYPE}
                quizLength={quizData.Quiz.length}
                maxAnswerCount={quizData.QuizAnswerCount}
                changeSideMenu={changeSideMenu}
                scoreBoardData={scoreBoardData}
              />

              <StudyPopupBottom bottomPopupState={bottomPopupState} />
            </>
          )}
        </>
      )}
    </>
  )
}
