import { useEffect, useState, useContext } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'
import { saveUserAnswer } from '@services/studyApi'
import { getListeningActivity2 } from '@services/quiz/ListeningActivityApi'

import listeningCSS from '@stylesheets/listening-activity.module.scss'
import listeningCSSMobile from '@stylesheets/mobile/listening-activity.module.scss'

// Types [
import {
  IStudyData,
  IScoreBoardData as IScoreBoard,
  IUserAnswer,
} from '@interfaces/Common'
import { IListeningActivity2Example } from '@interfaces/IListeningActivity'
// ] Types

// utils
import { shuffle } from 'lodash'
import useStepIntro from '@hooks/common/useStepIntro'
import { useQuiz } from '@hooks/study/useQuiz'
import { useQuizTimer } from '@hooks/study/useQuizTimer'
import useStudyAudio from '@hooks/study/useStudyAudio'
import { useFetch } from '@hooks/study/useFetch'
import { useCurrentQuizNo } from '@hooks/study/useCurrentQuizNo'
import { useAnimation } from '@hooks/study/useAnimation'
import { useStudentAnswer } from '@hooks/study/useStudentAnswer'
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

// components - listening activity 2
import BtnPlayWord from '@components/study/listening-activity-02/BtnPlayWord'
import CardWord from '@components/study/listening-activity-02/CardWord'

const STEP_TYPE = 'Listening Activity'

const isMobile = useDeviceDetection()

const style = isMobile ? listeningCSSMobile : listeningCSS

export default function ListeningActivity2(props: IStudyData) {
  const { handler } = useContext(AppContext) as AppContextProps
  const STEP = props.currentStep

  const timer = useQuizTimer(() => {
    // timer가 0에 도달하면 호출되는 콜백함수 구현
    // 로그아웃
  })

  // 애니메이션 hook
  const animationManager = useAnimation()

  // 인트로
  const [introAnim, setIntroAnim] = useState<
    'animate__bounceInRight' | 'animate__bounceOutLeft'
  >('animate__bounceInRight')
  const { isStepIntro, closeStepIntro } = useStepIntro()
  const { isResultShow, changeResultShow } = useResult()

  // 사이드 메뉴
  const [isSideOpen, setSideOpen] = useState(false)

  // 퀴즈 데이터 세팅
  const { quizState, changeQuizState } = useQuiz()
  const [quizData, recordedData] = useFetch(getListeningActivity2, props, STEP)
  const {
    scoreBoardData,
    setStudentAnswers,
    addStudentAnswers,
    makeUserAnswerData,
  } = useStudentAnswer()
  const [exampleData, setExamples] = useState<IListeningActivity2Example[]>([])
  const [quizNo, setQuizNo] = useState<number>(1) // 퀴즈 번호
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
      try {
        // 현재 퀴즈 번호
        const [currentQuizNo, tryCnt] = useCurrentQuizNo(
          recordedData,
          quizData.QuizAnswerCount,
        )

        // 기존 기록과 대조하여 표시해주기
        const correctedExample = recordedData.map((record) => {
          return quizData.Quiz.slice(0, 6).find(
            (quiz) => record.OX === '1' && record.QuizNo === quiz.QuizNo,
          )?.Question.Text
        })

        const examples = quizData.Examples.slice(0, 6).map((example) => {
          return {
            ...example,
            IsCorrected: correctedExample.find((ce) => ce === example.Text)
              ? true
              : false,
          }
        })

        // 기존 기록과 대비하여 표시해주기 end
        setTryCount(tryCnt)
        setIncorrectCount(tryCnt)
        setStudentAnswers(recordedData, quizData.QuizAnswerCount) // 기존 데이터를 채점판에 넣어주기
        setExamples(shuffle(examples))
        setQuizNo(currentQuizNo) // 현재 퀴즈 번호
      } catch (e) {
        console.log(e)
      }
    }
  }, [quizData])

  // useEffect - quizNo
  useEffect(() => {
    if (!isStepIntro && !isResultShow && quizData) {
      setTryCount(0)
      setIncorrectCount(0)
      changeQuizState('studying')
    }
  }, [quizNo])

  // quizState에 따른 오디오 재생 여부
  useEffect(() => {
    if (quizState === 'studying' && quizData && !isStepIntro && !isResultShow) {
      timer.setup(quizData?.QuizTime, true)

      playAudio(quizData.Quiz[quizNo - 1].Question.Sound)
    }
  }, [quizState])

  // 로딩
  if (!quizData) return <>Loading...</>

  // 정답 체크
  const checkAnswer = async (
    target: EventTarget & HTMLDivElement,
    selectedAnswer: string,
  ) => {
    changeQuizState('checking')

    const isCorrect =
      quizData.Quiz[quizNo - 1].Question.Text === selectedAnswer ? true : false

    // 채점판 만들기
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
  }

  /**
   * 정답 체크 후
   * @param checkedExample
   */
  const afterCheckAnswer = (
    target: EventTarget & HTMLDivElement,
    isCorrect: boolean,
  ) => {
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

  /**
   * 카드의 애니메이션이 완료된 후
   * @param e 애니메이션 완료 이벤트
   */
  const onCardAnimationEndHandler = (
    e: React.AnimationEvent<HTMLDivElement>,
    disabledCard: () => void,
  ) => {
    const target = e.currentTarget

    // 정 / 오답 확인
    const isCorrect = animationManager.isContain(target, 'animate__fadeIn')
      ? true
      : false

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

      if (isCorrect) {
        disabledCard()

        setTimeout(() => {
          if (quizNo + 1 > quizData.Quiz.length) {
            changeResultShow(true)
          } else {
            setQuizNo(quizNo + 1)
          }
        }, 300)
      } else {
        animationManager.remove(target, ['animate__headShake'])

        changeBottomPopupState({
          isActive: false,
          isCorrect: false,
        })

        if (tryCount >= quizData.QuizAnswerCount) {
          setTryCount(0)
          setIncorrectCount(0)

          if (quizNo + 1 > quizData.Quiz.length) {
            changeResultShow(true)
          } else {
            setQuizNo(quizNo + 1)
          }
        } else {
          changeQuizState('studying')
        }
      }
    }, 1500)
  }

  // 단어 재생
  const playWord = () => {
    if (playState === '') {
      playAudio(quizData.Quiz[quizNo - 1].Question.Sound)
    } else {
      stopAudio()
    }
  }

  /**
   * 헤더 메뉴 클릭하는 기능
   */
  const changeSideMenu = (state: boolean) => {
    setSideOpen(state)
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
            comment={'소리를 듣고 알맞은 단어를 고르세요.'}
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
                <BtnPlayWord playState={playState} onPlay={playWord} />

                {isMobile ? <Gap height={10} /> : <Gap height={15} />}

                <Container
                  typeCSS={style.listeningActivity2}
                  containerCSS={style.container}
                >
                  {exampleData.map((example, i) => {
                    return (
                      <CardWord
                        text={example.Text}
                        isCorrected={example.IsCorrected}
                        checkAnswer={checkAnswer}
                        onCardAnimationEndHandler={onCardAnimationEndHandler}
                      />
                    )
                  })}
                </Container>

                {isMobile ? <Gap height={10} /> : <Gap height={15} />}
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
