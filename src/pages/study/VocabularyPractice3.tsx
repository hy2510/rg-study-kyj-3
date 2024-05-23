import { useEffect, useState, useContext } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'
import { saveUserAnswer } from '@services/studyApi'
import { getVocabularyPractice3 } from '@services/quiz/VocabularyAPI'
import vocabularyCSS from '@stylesheets/vocabulary-practice.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-practice.module.scss'

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
import { useFetch } from '@hooks/study/useFetch'
import { useCurrentQuizNoVocaPractice } from '@hooks/study/useCurrentQuizNo'
import { useStudentAnswer } from '@hooks/study/useStudentAnswer'
import useStudyAudio from '@hooks/study/useStudyAudio'
import useDeviceDetection from '@hooks/common/useDeviceDetection'

// components - common
import StepIntro from '@components/study/common-study/StepIntro'
import QuizHeader from '@components/study/common-study/QuizHeader'
import QuizBody from '@components/study/common-study/QuizBody'
import Container from '@components/study/common-study/Container'
import StudySideMenu from '@components/study/common-study/StudySideMenu'
import Gap from '@components/study/common-study/Gap'

// components - vocabulary practice 3
import WrapperCard from '@components/study/vocabulary-practice-03/WrapperCard'

const STEP_TYPE = 'Vocabulary Practice'

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

export default function VocabularyPractice3(props: IStudyData) {
  const { handler } = useContext(AppContext) as AppContextProps
  const STEP = props.currentStep

  const timer = useQuizTimer(() => {
    // timer가 0에 도달하면 호출되는 콜백함수 구현
  })

  // 인트로 및 결과창
  // 인트로
  const [introAnim, setIntroAnim] = useState<
    'animate__bounceInRight' | 'animate__bounceOutLeft'
  >('animate__bounceInRight')
  const { isStepIntro, closeStepIntro } = useStepIntro() // 데이터 가져오기
  const [isSideOpen, setSideOpen] = useState(false)

  // 퀴즈 데이터 세팅
  const { quizState, changeQuizState } = useQuiz()
  // 퀴즈 데이터 / 저장된 데이터
  const [quizData, recordedData] = useFetch(
    getVocabularyPractice3,
    props,
    `${STEP}P`,
  )
  const [quizNo, setQuizNo] = useState<number>(1) // 퀴즈 번호
  const {
    scoreBoardData,
    setStudentAnswers,
    addStudentAnswers,
    makeUserAnswerData,
  } = useStudentAnswer()
  const [tryCount, setTryCount] = useState(0) // 시도 횟수

  // input ref
  const [inputVal, setInputVal] = useState<string>('')

  // audio
  const { playState, playAudio, stopAudio } = useStudyAudio()

  // 인트로가 없어지면
  useEffect(() => {
    if (!isStepIntro && quizData) {
      timer.setup(quizData.QuizTime, true)

      playWord()
      changeQuizState('studying')
    }
  }, [isStepIntro])

  useEffect(() => {
    if (quizData) {
      // 현재 퀴즈 번호
      const [currentQuizNo, tryCnt] = useCurrentQuizNoVocaPractice(
        recordedData,
        quizData.QuizAnswerCount,
      )

      if (quizData.Quiz.length < currentQuizNo) {
        props.changeVocaState(false)
      } else {
        if (recordedData.length > 0) {
          setStudentAnswers(recordedData, quizData.QuizAnswerCount) // 기존 데이터를 채점판에 넣어주기
        }

        setTryCount(tryCnt)
        setQuizNo(currentQuizNo)
      }
    }
  }, [quizData])

  // quiz no 변경되면 다음 단어
  useEffect(() => {
    if (quizData && !isStepIntro) {
      setInputVal('')
      setTryCount(0)

      playWord()

      changeQuizState('studying')
    }
  }, [quizNo])

  // 로딩
  if (!quizData) return <>Loading...</>

  /**
   * 정답 체크
   */
  const checkAnswer = async () => {
    try {
      changeQuizState('checking')

      if (quizState === 'studying') {
        if (quizData.IsEnabledTyping) {
          // input이 활성화 된 경우
          const isCorrect = quizData.Quiz[quizNo - 1].Question.Text === inputVal

          if (isCorrect) {
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
              step: '2P',
              quizId: quizData.Quiz[quizNo - 1].QuizId,
              quizNo: quizData.Quiz[quizNo - 1].QuizNo,
              currentQuizNo: quizNo,
              correct: quizData.Quiz[quizNo - 1].Question.Text,
              selectedAnswer: inputVal,
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

              addStudentAnswers(answerData)
              setTryCount(tryCount + 1)

              if (tryCount + 1 >= quizData.QuizAnswerCount) {
                if (quizNo + 1 > quizData.Quiz.length) {
                  props.changeVocaState(false)
                } else {
                  setQuizNo(quizNo + 1)
                }
              } else {
                setInputVal('')
                playWord()
                changeQuizState('studying')
              }
            }
          } else {
            if (quizData.IsSkipAvailable) {
              stopAudio()

              // skip이 가능한 경우
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
                step: '2P',
                quizId: quizData.Quiz[quizNo - 1].QuizId,
                quizNo: quizData.Quiz[quizNo - 1].QuizNo,
                currentQuizNo: quizNo,
                correct: quizData.Quiz[quizNo - 1].Question.Text,
                selectedAnswer: inputVal,
                tryCount: tryCount + 1,
                maxQuizCount: quizData.QuizAnswerCount,
                quizLength: quizData.Quiz.length,
                isCorrect: isCorrect,
                answerData: answerData,
                isFinishStudy: props.lastStep === STEP ? true : false,
              })

              const res = await saveUserAnswer(userAnswer)

              if (Number(res.result) === 0) {
                addStudentAnswers(answerData)

                if (quizNo + 1 > quizData.Quiz.length) {
                  props.changeVocaState(false)
                } else {
                  setQuizNo(quizNo + 1)
                }
              }
            } else {
              // skip이 불가능한 경우
              setInputVal('')
              changeQuizState('studying')
            }
          }
        } else {
          // input이 비활성화인 경우
          // 채점판 만들기
          const answerData: IScoreBoard = {
            quizNo: quizNo,
            maxCount: quizData.QuizAnswerCount,
            answerCount: tryCount + 1,
            ox: true,
          }

          // 유저 답 데이터 생성
          const userAnswer: IUserAnswer = makeUserAnswerData({
            mobile: '',
            studyId: props.studyId,
            studentHistoryId: props.studentHistoryId,
            bookType: props.bookType,
            step: '2P',
            quizId: quizData.Quiz[quizNo - 1].QuizId,
            quizNo: quizData.Quiz[quizNo - 1].QuizNo,
            currentQuizNo: quizNo,
            correct: quizData.Quiz[quizNo - 1].Question.Text,
            selectedAnswer: inputVal,
            tryCount: tryCount + 1,
            maxQuizCount: quizData.QuizAnswerCount,
            quizLength: quizData.Quiz.length,
            isCorrect: true,
            answerData: answerData,
            isFinishStudy: props.lastStep === STEP ? true : false,
          })

          const res = await saveUserAnswer(userAnswer)

          if (Number(res.result) === 0) {
            addStudentAnswers(answerData)

            if (quizNo + 1 > quizData.Quiz.length) {
              props.changeVocaState(false)
            } else {
              setQuizNo(quizNo + 1)
            }
          }
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  const changeInputVal = (value: string) => {
    setInputVal(value)
  }

  /**
   * 단어 재생
   */
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
            comment={'단어를 보고 듣고 따라서 입력하세요.'}
            onStepIntroClozeHandler={() => {
              setIntroAnim('animate__bounceOutLeft')
            }}
          />
        </div>
      ) : (
        <>
          <QuizHeader
            quizNumber={quizNo}
            totalQuizCnt={Object.keys(quizData.Quiz).length}
            life={quizData.QuizAnswerCount}
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
            <Container
              typeCSS={style.vocabularyPractice3}
              containerCSS={style.container}
            >
              <Gap height={20} />

              <WrapperCard
                isSideOpen={isSideOpen}
                isEnabledTyping={quizData.IsEnabledTyping}
                playState={playState}
                quizData={quizData}
                quizNo={quizNo}
                tryCount={tryCount}
                inputVal={inputVal}
                playWord={playWord}
                changeInputVal={changeInputVal}
                checkAnswer={checkAnswer}
              />
            </Container>
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
        </>
      )}
    </>
  )
}
