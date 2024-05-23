import { useEffect, useState, useContext } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'
import { saveUserAnswer } from '@services/studyApi'
import { getListeningActivity4 } from '@services/quiz/ListeningActivityApi'

import listeningCSS from '@stylesheets/listening-activity.module.scss'
import listeningCSSMobile from '@stylesheets/mobile/listening-activity.module.scss'

// Types [
import {
  IStudyData,
  IScoreBoardData as IScoreBoard,
  IUserAnswer,
} from '@interfaces/Common'
import { IListeningActivity4Example } from '@interfaces/IListeningActivity'

export type MultiPlayStateProps = {
  playState: PlayState
  playType: '' | 'sentence' | 'all'
  seq: number
}
// ] Types

// utils
import { shuffle } from 'lodash'
import useStepIntro from '@hooks/common/useStepIntro'
import { useQuiz } from '@hooks/study/useQuiz'
import { useQuizTimer } from '@hooks/study/useQuizTimer'
import { useAnimation } from '@hooks/study/useAnimation'
import { useFetch } from '@hooks/study/useFetch'
import { useCurrentQuizNo } from '@hooks/study/useCurrentQuizNo'
import { useStudentAnswer } from '@hooks/study/useStudentAnswer'
import useStudyAudio, { PlayState } from '@hooks/study/useStudyAudio'
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

// components - listening activity 4
import ImgQuestion from '@components/study/listening-activity-04/ImgQuestion'
import WrapperExample from '@components/study/listening-activity-04/WrapperExample'

const STEP_TYPE = 'Listening Activity'

const isMobile = useDeviceDetection()

const style = isMobile ? listeningCSSMobile : listeningCSS

export default function ListeningActivity4(props: IStudyData) {
  const { handler } = useContext(AppContext) as AppContextProps

  const STEP = props.currentStep

  const timer = useQuizTimer(() => {
    // timer가 0에 도달하면 호출되는 콜백함수 구현
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
  const [quizData, recordedData] = useFetch(getListeningActivity4, props, STEP)
  const [quizNo, setQuizNo] = useState<number>(1) // 퀴즈 번호

  // 과거 기록
  const {
    scoreBoardData,
    setStudentAnswers,
    addStudentAnswers,
    makeUserAnswerData,
  } = useStudentAnswer()
  const [exampleData, setExamples] = useState<IListeningActivity4Example[]>([])
  const [tryCount, setTryCount] = useState(0) // 시도 횟수
  const [incorrectCount, setIncorrectCount] = useState<number>(0) // 문제 틀린 횟수

  // 정 / 오답시 하단에 나오는 correct / incorrect
  const { bottomPopupState, changeBottomPopupState } = useBottomPopup()

  // audio
  const { playAudio, stopAudio } = useStudyAudio()
  // 음원이 여러 개인 경우를 위해서
  const [multiPlayState, setMultiPlayState] = useState<MultiPlayStateProps>({
    playState: '',
    playType: '',
    seq: -1,
  })
  // 문제 처음 시작할 경우 모든 보기를 읽어주는 것
  const [isPlayAllFirst, setPlayFirstAll] = useState(false)

  // 인트로
  useEffect(() => {
    if (!isStepIntro && quizData) {
      timer.setup(quizData.QuizTime, true)

      changeQuizState('studying')
    }
  }, [isStepIntro])

  // 데이터를 받아온 후
  useEffect(() => {
    if (quizData) {
      try {
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
      } catch (e) {
        console.log(e)
      }
    }
  }, [quizData])

  // 퀴즈 번호가 바뀌면
  useEffect(() => {
    if (!isStepIntro && !isResultShow && quizData) {
      timer.setup(quizData.QuizTime, true)

      setTryCount(0)
      setIncorrectCount(0)
      setExamples(shuffle(quizData.Quiz[quizNo - 1].Examples))
      setPlayFirstAll(false)

      changeQuizState('studying')
    }
  }, [quizNo])

  //
  useEffect(() => {
    if (
      !isStepIntro &&
      !isResultShow &&
      quizData &&
      quizState === 'studying' &&
      !isPlayAllFirst
    ) {
      // 퀴즈 번호가 바뀌고 처음 시작일 때 모든 문장을 한번씩 읽어줌
      setPlayFirstAll(true)

      playAll()
    }
  }, [quizState])

  // 오디오 재생 및 중지
  useEffect(() => {
    stopAudio()

    if (quizData) {
      if (multiPlayState.seq > -1) {
        if (multiPlayState.playType === 'sentence') {
          const cbAfterPlaySentence = () => {
            setMultiPlayState({
              playState: '',
              playType: '',
              seq: -1,
            })
          }

          playAudio(exampleData[multiPlayState.seq].Sound, cbAfterPlaySentence)
        } else if (multiPlayState.playType === 'all') {
          const cbPlayNextSentence = () => {
            if (
              multiPlayState.seq <
              quizData.Quiz[quizNo - 1].Examples.length - 1
            ) {
              setMultiPlayState({
                playState: 'playing',
                playType: 'all',
                seq: multiPlayState.seq + 1,
              })
            } else {
              stopAudio()

              setMultiPlayState({
                playState: '',
                playType: '',
                seq: -1,
              })
            }
          }

          playAudio(exampleData[multiPlayState.seq].Sound, cbPlayNextSentence)
        }
      }
    }
  }, [multiPlayState])

  // 로딩
  if (!quizData) return <>Loading...</>

  // 정답 체크
  const checkAnswer = async (
    target: React.RefObject<HTMLDivElement>,
    selectedText: string,
  ) => {
    try {
      changeQuizState('checking')
      stopAudio()
      setMultiPlayState({
        playState: '',
        playType: '',
        seq: -1,
      })

      const isCorrect =
        quizData.Quiz[quizNo - 1].Question.Text === selectedText ? true : false

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
        selectedAnswer: selectedText,
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

          // 채점판
          const answerData: IScoreBoard = {
            quizNo: quizNo,
            maxCount: quizData.QuizAnswerCount,
            answerCount: tryCount + 1,
            ox: isCorrect,
          }

          if (!isCorrect) {
            setIncorrectCount(incorrectCount + 1)
          }

          setTryCount(tryCount + 1)
          addStudentAnswers(answerData)
          afterCheckAnswer(target, isCorrect)
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  // 답변 체크 후
  const afterCheckAnswer = (
    target: React.RefObject<HTMLDivElement>,
    isCorrect: boolean,
  ) => {
    timer.stop()

    changeBottomPopupState({
      isActive: true,
      isCorrect: isCorrect,
    })

    if (target.current) {
      if (isCorrect) {
        animationManager.play(target.current, [
          'animate__fadeIn',
          style.correct,
        ])
      } else {
        animationManager.play(target.current, [
          'animate__headShake',
          style.incorrect,
        ])
      }
    }
  }

  // 애니메이션 완료 후
  const onAnimationEndHandler = (e: React.AnimationEvent<HTMLDivElement>) => {
    const target = e.currentTarget

    // 정 / 오답 확인
    const isCorrect = animationManager.isContain(target, 'animate__fadeIn')
      ? true
      : false

    setTimeout(() => {
      changeBottomPopupState({
        isActive: false,
        isCorrect: false,
      })

      animationManager.remove(target, [
        style.correct,
        style.incorrect,
        'animate__fadeIn',
        'animate__headShake',
      ])

      if (isCorrect) {
        if (quizNo + 1 > quizData.Quiz.length) {
          changeResultShow(true)
        } else {
          setQuizNo(quizNo + 1)
        }
      } else {
        if (tryCount >= quizData.QuizAnswerCount) {
          if (quizNo + 1 > quizData.Quiz.length) {
            changeResultShow(true)
          } else {
            setQuizNo(quizNo + 1)
          }
        } else {
          timer.setup(quizData.QuizTime, true)
          changeQuizState('studying')
        }
      }
    }, 1000)
  }

  /**
   * 헤더 메뉴 클릭하는 기능
   */
  const changeSideMenu = (state: boolean) => {
    setSideOpen(state)
  }

  // 음원 재생
  const playWord = (index: number) => {
    // 재생 중에 다른 보기의 스피커를 클릭한 경우 현재 재생중인 오디오를 중지 후 재생
    // 재생 중인 스피커를 다시 클릭한 경우 중지
    if (multiPlayState.playState === '' && index > -1) {
      // 모든 스피커가 재생중이 아닌 경우 - 그냥 재생
      setMultiPlayState({
        playState: 'playing',
        playType: 'sentence',
        seq: index,
      })
    } else if (
      multiPlayState.playState === 'playing' &&
      multiPlayState.seq === index
    ) {
      // 이미 재생중인 스피커를 클릭한 경우 - 중지
      setMultiPlayState({
        playState: '',
        playType: '',
        seq: -1,
      })
    } else if (
      multiPlayState.playState === 'playing' &&
      multiPlayState.seq !== index
    ) {
      // 이미 재생중인데 다른 스피커를 클릭한 경우 - 기존 스피커 중지 후 재생
      setMultiPlayState({
        playState: 'playing',
        playType: 'sentence',
        seq: index,
      })
    }
  }

  /**
   * 학습 완료 후 문장 전체 재생
   */
  const playAll = () => {
    stopAudio()

    if (multiPlayState.playState === 'playing') {
      setMultiPlayState({
        playState: '',
        playType: '',
        seq: -1,
      })
    } else {
      setMultiPlayState({
        playState: 'playing',
        playType: 'all',
        seq: 0,
      })
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
            comment={'그림을 보고 알맞은 소리를 고르세요.'}
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
                {isMobile ? <Gap height={0} /> : <Gap height={15} />}

                <Container
                  typeCSS={style.listeningActivity4}
                  containerCSS={style.container}
                >
                  <ImgQuestion src={quizData.Quiz[quizNo - 1].Question.Image} />

                  <Gap height={15} />

                  <WrapperExample
                    multiPlayState={multiPlayState}
                    exampleData={exampleData}
                    playWord={playWord}
                    checkAnswer={checkAnswer}
                    onAnimationEndHandler={onAnimationEndHandler}
                  />
                </Container>
                {isMobile ? <Gap height={5} /> : <Gap height={15} />}
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
