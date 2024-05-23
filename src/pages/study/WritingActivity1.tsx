import { useEffect, useRef, useState, useContext } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'
import { saveUserAnswer } from '@services/studyApi'

import writingActivityCSS from '@stylesheets/writing-activity.module.scss'
import writingActivityCSSMobile from '@stylesheets/mobile/writing-activity.module.scss'

// Types [
import {
  IStudyData,
  IScoreBoardData as IScoreBoard,
  IUserAnswer,
} from '@interfaces/Common'
import { getWritingActivity1 } from '@services/quiz/WritingActivityAPI'
import { IWritingActivity1Example } from '@interfaces/IWritingActivity'
export type SentenceState = '' | 'correct' | 'incorrect'
// ] Types

// utils
import { shuffle } from 'lodash'
import useStepIntro from '@hooks/common/useStepIntro'
import { useQuiz } from '@hooks/study/useQuiz'
import { useQuizTimer } from '@hooks/study/useQuizTimer'
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

// components - writing activity 1
import BtnPlayWord from '@components/study/writing-activity-01/BtnPlayWord'
import ArrowUp from '@components/study/writing-activity-01/ArrowUp'
import WrapperExample from '@components/study/writing-activity-01/WrapperExample'
import WrapperSentenceBox from '@components/study/writing-activity-01/WrapperSentenceBox'
import BtnGoNext from '@components/study/writing-activity-01/BtnGoNext'

const STEP_TYPE = 'Writing Activity'

const isMobile = useDeviceDetection()

const style = isMobile ? writingActivityCSSMobile : writingActivityCSS

export default function WrtingActivity1(props: IStudyData) {
  const { bookInfo, handler } = useContext(AppContext) as AppContextProps
  const STEP = props.currentStep

  const timer = useQuizTimer(() => {
    // timer가 0에 도달하면 호출되는 콜백함수 구현
    // 로그아웃
  })

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
  const [quizData, recordedData] = useFetch(getWritingActivity1, props, STEP)
  const [quizNo, setQuizNo] = useState<number>(1) // 퀴즈 번호

  // 과거 기록
  const {
    scoreBoardData,
    setStudentAnswers,
    addStudentAnswers,
    makeUserAnswerData,
  } = useStudentAnswer()
  const [tryCount, setTryCount] = useState(0) // 시도 횟수
  const [incorrectCount, setIncorrectCount] = useState<number>(0) // 문제 틀린 횟수

  // 문장
  const [sentenceState, setSentenceState] = useState<SentenceState>('')

  // 예제
  const exampleRefs = useRef<HTMLDivElement[]>([])
  const [exampleData, setExamples] = useState<IWritingActivity1Example[]>([])
  const [sentenceData, setSentence] = useState<string[]>([])

  // 정 / 오답시 하단에 나오는 correct / incorrect
  const { bottomPopupState, changeBottomPopupState } = useBottomPopup()

  const [isBtnNext, setBtnNext] = useState(false)

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
        setQuizNo(currentQuizNo) // 현재 퀴즈 번호
      } catch (e) {
        console.log(e)
      }
    }
  }, [quizData])

  // sentence가 다 채워진 경우 정답 체크
  useEffect(() => {
    if (quizData && sentenceState === '') {
      if (sentenceData.length === quizData.Quiz[quizNo - 1].Examples.length) {
        checkAnswer()
      }
    }
  }, [sentenceData])

  // quizNo가 바뀌면 문제가 바뀐 것으로 인식
  useEffect(() => {
    if (!isStepIntro && !isResultShow && quizData) {
      stopAudio()
      setExamples(shuffle(quizData.Quiz[quizNo - 1].Examples))

      setIncorrectCount(0)
      setTryCount(0)
      changeQuizState('studying')
    }
  }, [quizNo])

  useEffect(() => {
    if (quizState === 'studying' && quizData && !isStepIntro && !isResultShow) {
      setSentenceState('')
      resetSentence()

      if (bookInfo.BookLevel.includes('K')) {
        playAudio(quizData.Quiz[quizNo - 1].Question.Sound)
      }
    }
  }, [quizState])

  useEffect(() => {
    if (isBtnNext && quizData && quizState === 'checking') {
      stopAudio()
    }
  }, [isBtnNext])

  // 로딩
  if (!quizData) return <>Loading...</>

  /** [ 하단 단어 선택할 경우 위로 올리기 ]
   * @index 하단에 선택한 단어 번호
   * @selectedWord 선택한 단어
   */
  const selectWord = (index: number, selectedWord: string) => {
    exampleRefs.current[index].classList.add(style.send)

    const newSentence = [...sentenceData, selectedWord]

    setSentence(newSentence)
  }

  /** [ sentence 부분 클릭해서 없애기 ]
   * @param word 클릭한 단어
   */
  const removeWord = (word: string) => {
    if (quizState === 'studying') {
      const resetIndex = exampleData.findIndex(
        (example) => example.Text === word,
      )
      const newSentence = sentenceData.filter((sen: string) => {
        return sen !== word
      })

      exampleRefs.current[resetIndex].classList.remove(style.send)

      setSentence(newSentence)
    }
  }

  // sentence 초기화
  const resetSentence = () => {
    try {
      if (exampleRefs.current) {
        exampleRefs.current.map((exampleRefs) =>
          exampleRefs.classList.remove(style.send),
        )
      }
    } catch (e) {
    } finally {
      setSentence([])
    }
  }

  // 정답 체크
  const checkAnswer = async () => {
    try {
      changeQuizState('checking')

      if (quizState === 'studying') {
        timer.stop()
        stopAudio()

        const question = quizData.Quiz[quizNo - 1].Question.Text
        const makedSentence = sentenceData.reduce(
          (acc, cur) => acc + (' ' + cur),
        )
        const isCorrect = question === makedSentence
        let incorrectCnt = incorrectCount

        // 채점판 생성
        const answerData: IScoreBoard = {
          quizNo: quizNo,
          maxCount: quizData.QuizAnswerCount,
          answerCount: tryCount + 1,
          ox: isCorrect,
        }

        // 유저 답안
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
          selectedAnswer: makedSentence,
          tryCount: tryCount + 1,
          maxQuizCount: quizData.QuizAnswerCount,
          quizLength: quizData.Quiz.length,
          isCorrect: isCorrect,
          answerData: answerData,
          isFinishStudy: props.lastStep === STEP ? true : false,
        })

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

          addStudentAnswers(answerData)

          setTryCount(tryCount + 1)

          afterCheckAnswer(isCorrect, incorrectCnt + 1)
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  const afterCheckAnswer = (isCorrect: boolean, incorrectCnt: number) => {
    setSentenceState(isCorrect ? 'correct' : 'incorrect')
    changeBottomPopupState({
      isActive: true,
      isCorrect: isCorrect,
    })

    setTimeout(() => {
      changeBottomPopupState({
        isActive: false,
        isCorrect: false,
      })

      if (isCorrect) {
        // 정답인 경우
        if (bookInfo.BookLevel.includes('K')) {
          beforeNextQuiz()
        } else {
          const cbAfterPlayAudio = () => {
            setBtnNext(true)
          }

          playAudio(quizData.Quiz[quizNo - 1].Question.Sound, cbAfterPlayAudio)
        }
      } else {
        if (incorrectCnt >= quizData.QuizAnswerCount) {
          // 오답인데 기회를 모두 소모한 경우
          const correctSentence = quizData.Quiz[quizNo - 1].Examples.map(
            (example) => example.Text,
          )
          setSentence([...correctSentence])

          if (bookInfo.BookLevel.includes('K')) {
            beforeNextQuiz()
          } else {
            const cbAfterPlayAudio = () => {
              setBtnNext(true)
            }

            playAudio(
              quizData.Quiz[quizNo - 1].Question.Sound,
              cbAfterPlayAudio,
            )
          }
        } else {
          // 오답이지만 기회가 남아있는 경우
          timer.setup(quizData.QuizTime, true)
          changeQuizState('studying')
        }
      }
    }, 2000)
  }

  // 다음 퀴즈로 넘어가기 전
  const beforeNextQuiz = () => {
    stopAudio()

    const cbBeforNextQuiz = () => {
      resetSentence()
      setSentenceState('')

      if (quizNo + 1 > quizData.Quiz.length) {
        changeResultShow(true)
      } else {
        if (bookInfo.BookLevel.includes('K')) {
          timer.setup(quizData.QuizTime, true)

          setQuizNo(quizNo + 1)
        } else {
          const cbAfterPlayAudio = () => {
            setBtnNext(true)
          }

          playAudio(quizData.Quiz[quizNo - 1].Question.Sound, cbAfterPlayAudio)
        }
      }
    }

    playAudio(quizData.Quiz[quizNo - 1].Question.Sound, cbBeforNextQuiz)
  }

  const goNextQuiz = () => {
    if (quizNo + 1 > quizData.Quiz.length) {
      stopAudio()
      timer.stop()
      changeResultShow(true)
    } else {
      timer.setup(quizData.QuizTime, true)

      setQuizNo(quizNo + 1)
      setBtnNext(false)
    }
  }

  /**
   * 헤더 메뉴 클릭하는 기능
   */
  const changeSideMenu = (state: boolean) => {
    setSideOpen(state)
  }

  const playSentence = () => {
    if (playState === '') {
      playAudio(quizData.Quiz[quizNo - 1].Question.Sound)
    } else {
      if (quizState === 'studying') stopAudio()
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
            comment={'카드를 순서대로 나열하여 올바른 문장을 완성하세요.'}
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
                <BtnPlayWord playState={playState} onPlay={playSentence} />

                <Gap height={15} />

                <Container
                  typeCSS={style.writingActivity1}
                  containerCSS={style.container}
                >
                  {/* 위쪽 문장칸 */}
                  <WrapperSentenceBox
                    sentenceState={sentenceState}
                    sentenceData={sentenceData}
                    removeWord={removeWord}
                  />

                  <>
                    {/* K레벨이 아닌 경우에는 버튼을 클릭해서 다음 문제로 넘어감 */}
                    {!isBtnNext ? (
                      <>
                        {/* 화살표 */}
                        <ArrowUp />

                        {/* 하단 카드칸 */}
                        <WrapperExample
                          exampleRefs={exampleRefs}
                          exampleData={exampleData}
                          selectWord={selectWord}
                        />
                      </>
                    ) : (
                      <BtnGoNext goNextQuiz={goNextQuiz} />
                    )}
                  </>
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
