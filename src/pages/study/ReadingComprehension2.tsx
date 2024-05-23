import { useEffect, useState, useContext } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'
import { saveUserAnswer } from '@services/studyApi'
import { getReadingComprehension2 } from '@services/quiz/RedaingComprehensionAPI'

import readingComprehensionCSS from '@stylesheets/reading-comprehension.module.scss'
import readingComprehensionCSSMobile from '@stylesheets/mobile/reading-comprehension.module.scss'

// Types [
import {
  IStudyData,
  IScoreBoardData as IScoreBoard,
  IUserAnswer,
} from '@interfaces/Common'
import { IReadingComprehension2Example } from '@interfaces/IReadingComprehension'

export type MultiPlayStateProps = {
  playState: PlayState
  seq: number
}
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
import useStudyAudio, { PlayState } from '@hooks/study/useStudyAudio'
import useBottomPopup from '@hooks/study/useBottomPopup'
import { useResult } from '@hooks/study/useResult'
import useDeviceDetection from '@hooks/common/useDeviceDetection'

// components - commons
import StepIntro from '@components/study/common-study/StepIntro'
import QuizHeader from '@components/study/common-study/QuizHeader'
import StudySideMenu from '@components/study/common-study/StudySideMenu'
import QuizBody from '@components/study/common-study/QuizBody'
import Gap from '@components/study/common-study/Gap'
import Container from '@components/study/common-study/Container'
import StudyPopupBottom from '@components/study/common-study/StudyPopupBottom'
import TestResult from '@components/study/common-study/TestResult'

// components - reading comprehension 2
import ImgQuestion from '@components/study/reading-comprehension-02/ImgQuestion'
import WrapperExample from '@components/study/reading-comprehension-02/WrapperExample'

const STEP_TYPE = 'Reading Comprehension'

const isMobile = useDeviceDetection()

const style = isMobile ? readingComprehensionCSSMobile : readingComprehensionCSS

export default function ReadingComprehension2(props: IStudyData) {
  const { handler } = useContext(AppContext) as AppContextProps
  const STEP = props.currentStep

  const timer = useQuizTimer(() => {
    // timer가 0에 도달하면 호출되는 콜백함수 구현
  })

  // 애니메이션
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
    getReadingComprehension2,
    props,
    STEP,
  )
  const [exampleData, setExamples] = useState<IReadingComprehension2Example[]>(
    [],
  )
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

  // audio
  const { playAudio, stopAudio } = useStudyAudio()
  // 음원이 여러 개인 경우를 위해서
  const [multiPlayState, setMultiPlayState] = useState<MultiPlayStateProps>({
    playState: '',
    seq: -1,
  })

  // 인트로 클릭 후
  useEffect(() => {
    if (!isStepIntro && quizData) {
      timer.setup(quizData.QuizTime, true)
      changeQuizState('studying')
    }
  }, [isStepIntro])

  // 오디오 재생 및 중지
  useEffect(() => {
    stopAudio()

    if (multiPlayState.seq > -1) {
      const cbAfterPlaySentence = () => {
        setMultiPlayState({
          playState: '',
          seq: -1,
        })
      }

      playAudio(exampleData[multiPlayState.seq].Sound, cbAfterPlaySentence)
    }
  }, [multiPlayState])

  // 퀴즈 데이터
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

  // 퀴즈 번호가 바뀌면 문제가 바뀐 것으로 판단
  useEffect(() => {
    if (!isStepIntro && !isResultShow && quizData) {
      timer.setup(quizData.QuizTime, true)

      setExamples(shuffle(quizData.Quiz[quizNo - 1].Examples))
      changeQuizState('studying')
    }
  }, [quizNo])

  // 로딩
  if (!quizData) return <>Loading...</>

  /**
   * 정답 체크
   * @param target
   * @param index
   */
  const checkAnswer = async (
    target: React.RefObject<HTMLDivElement>,
    index: number,
  ) => {
    try {
      changeQuizState('checking')
      stopAudio()
      setMultiPlayState({
        playState: '',
        seq: -1,
      })

      // 정 / 오답 구별
      const isCorrect =
        quizData.Quiz[quizNo - 1].Question.Text === exampleData[index].Text

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
        selectedAnswer: exampleData[index].Text,
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

          if (!isCorrect) {
            setIncorrectCount(incorrectCount + 1)
          }

          setTryCount(tryCount + 1)

          addStudentAnswers(answerData)

          afterCheckAnswer(target, isCorrect)
        }
      }
    } catch (e) {}
  }

  /**
   * 정답 체크 후
   * @param target
   * @param isCorrect
   */
  const afterCheckAnswer = (
    target: React.RefObject<HTMLDivElement>,
    isCorrect: boolean,
  ) => {
    changeBottomPopupState({
      isActive: true,
      isCorrect: isCorrect,
    })

    if (target.current) {
      if (isCorrect) {
        animationManager.play(target.current, [
          style.correct,
          'animate__fadeIn',
        ])
      } else {
        animationManager.play(target.current, [
          style.incorrect,
          'animate__headShake',
        ])
      }
    }
  }

  /**
   * 정/오답 애니메이션이 완료된 후
   * @param e 카드
   */
  const onAnimationEndHandler = (e: React.AnimationEvent<HTMLDivElement>) => {
    const target = e.currentTarget

    setTimeout(() => {
      animationManager.remove(target, [
        style.correct,
        style.incorrect,
        'animate__fadeIn',
        'animate__headShake',
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
    }, 1000)
  }

  // 예제 음원 재생
  const playSentence = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number,
  ) => {
    // 재생 중에 다른 보기의 스피커를 클릭한 경우 현재 재생중인 오디오를 중지 후 재생
    // 재생 중인 스피커를 다시 클릭한 경우 중지
    if (multiPlayState.playState === '' && index > -1) {
      // 모든 스피커가 재생중이 아닌 경우 - 그냥 재생
      setMultiPlayState({
        playState: 'playing',
        seq: index,
      })
    } else if (
      multiPlayState.playState === 'playing' &&
      multiPlayState.seq === index
    ) {
      // 이미 재생중인 스피커를 클릭한 경우 - 중지
      setMultiPlayState({
        playState: '',
        seq: -1,
      })
    } else if (
      multiPlayState.playState === 'playing' &&
      multiPlayState.seq !== index
    ) {
      // 이미 재생중인데 다른 스피커를 클릭한 경우 - 기존 스피커 중지 후 재생
      setMultiPlayState({
        playState: 'playing',
        seq: index,
      })
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
            comment={'그림을 보고 알맞은 문장을 고르세요.'}
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
                  typeCSS={style.readingComprehension2}
                  containerCSS={style.container}
                >
                  {/* 문제 이미지 */}
                  <ImgQuestion src={quizData.Quiz[quizNo - 1].Question.Image} />

                  <Gap height={15} />

                  {/* 보기 */}
                  <WrapperExample
                    multiPlayState={multiPlayState}
                    exampleData={exampleData}
                    playSentence={playSentence}
                    checkAnswer={checkAnswer}
                    onAnimationEndHandler={onAnimationEndHandler}
                  />
                </Container>
                {isMobile ? <Gap height={5} /> : <Gap height={15} />}
              </QuizBody>

              <StudySideMenu
                isSideOpen={isSideOpen}
                changeSideMenu={changeSideMenu}
                currentStep={STEP}
                currentStepType={STEP_TYPE}
                quizLength={quizData.Quiz.length}
                maxAnswerCount={quizData.QuizAnswerCount}
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
