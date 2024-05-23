import { useEffect, useState, useContext } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'
import { saveUserAnswerPartial } from '@services/studyApi'
import { getSummary2 } from '@services/quiz/SummaryApi'

import summaryCSS from '@stylesheets/summary.module.scss'
import summaryCSSMobile from '@stylesheets/mobile/summary.module.scss'

// Types [
import {
  IStudyData,
  IScoreBoardData as IScoreBoard,
  IRecordAnswerType,
  IUserAnswerPartial,
} from '@interfaces/Common'
import {
  ISummary2Example,
  ISummary2Quiz,
  ISummary2Sentence,
} from '@interfaces/ISummary'

export type WordDataProp = {
  Word: string
  QuestionIndex: number
  State: 'none' | 'correct' | 'incorrect'
}
// ] Types

// utils & hooks
import { shuffle } from 'lodash'
import useStepIntro from '@hooks/common/useStepIntro'
import { useQuiz } from '@hooks/study/useQuiz'
import { useQuizTimer } from '@hooks/study/useQuizTimer'
import { useAnimation } from '@hooks/study/useAnimation'
import { useFetch } from '@hooks/study/useFetch'
import { useCurrentQuizNoPartial } from '@hooks/study/useCurrentQuizNo'
import {
  useStudentAnswer,
  convertPartialRecordToScoreBoard,
} from '@hooks/study/useStudentAnswer'
import useBottomPopup from '@hooks/study/useBottomPopup'
import useStudyAudio, { PlayState } from '@hooks/study/useStudyAudio'
import { useResult } from '@hooks/study/useResult'
import useDeviceDetection from '@hooks/common/useDeviceDetection'

// components - common
import StepIntro from '@components/study/common-study/StepIntro'
import QuizHeader from '@components/study/common-study/QuizHeader'
import QuizBody from '@components/study/common-study/QuizBody'
import Container from '@components/study/common-study/Container'
import StudyPopupBottom from '@components/study/common-study/StudyPopupBottom'
import StudySideMenu from '@components/study/common-study/StudySideMenu'
import TestResult from '@components/study/common-study/TestResult'

// components - summary 2
import BoxQuestion from '@components/study/summary-02/BoxQuestion'
import ArrowUp from '@components/study/summary-02/ArrowUp'
import WrapperExample from '@components/study/summary-02/WrapperExample'
import BtnPlaySentence from '@components/study/summary-02/BtnPlaySentence'
import BtnGoNext from '@components/study/summary-02/BtnGoNext'

const STEP_TYPE = 'Summary Test'

const isMobile = useDeviceDetection()

const style = isMobile ? summaryCSSMobile : summaryCSS

export default function Summary2(props: IStudyData) {
  const { handler } = useContext(AppContext) as AppContextProps
  const STEP = props.currentStep

  const timer = useQuizTimer(() => {
    // timer가 0에 도달하면 호출되는 콜백함수 구현
    checkAnswerTimeOut()
  })

  const animationManager = useAnimation()

  // 인트로 및 결과창
  const [introAnim, setIntroAnim] = useState<
    'animate__bounceInRight' | 'animate__bounceOutLeft'
  >('animate__bounceInRight')
  const { isStepIntro, closeStepIntro } = useStepIntro()
  const { isResultShow, changeResultShow } = useResult()

  // 사이드 메뉴
  const [isSideOpen, setSideOpen] = useState(false)

  // 퀴즈 데이터
  const { quizState, changeQuizState } = useQuiz()
  const [quizData, recordedData] = useFetch(getSummary2, props, STEP) // 퀴즈 데이터 / 저장된 데이터
  const [quizNo, setQuizNo] = useState<number>(1) // 퀴즈 번호
  const [questionNo, setQuestionNo] = useState<number>(1)
  const [sentenceData, setSentenceData] = useState<WordDataProp[]>([])
  const [exampleData, setExamples] = useState<ISummary2Example[]>([])
  const [topExample, setTopExample] = useState<ISummary2Example[]>([])
  const [bottomExample, setBottomExample] = useState<ISummary2Example[]>([])
  const [partialRecord, setPartialRecord] = useState<string>('')
  const [tryCount, setTryCount] = useState(0) // 시도 횟수
  const [incorrectCount, setIncorrectCount] = useState<number>(0) // 문제 틀린 횟수

  // 과거 기록
  const {
    scoreBoardData,
    setStudentAnswersPartial,
    addStudentAnswers,
    makeUserPartialAnswerData,
  } = useStudentAnswer()

  // 정 / 오답시 하단에 나오는 correct / incorrect
  const { bottomPopupState, changeBottomPopupState } = useBottomPopup()

  // audio
  const { playState, playAudio, stopAudio } = useStudyAudio()

  // 스텝 완료
  const [isComplete, setComplete] = useState(false)

  // 인트로
  useEffect(() => {
    if (!isStepIntro && quizData) {
      timer.setup(quizData.QuizTime, true)
      changeQuizState('studying')
    }
  }, [isStepIntro])

  useEffect(() => {
    if (quizData) {
      // 현재 퀴즈 번호
      let [currentQuizNo, lastQuizNo, tryCnt] = [1, 1, 0]

      if (recordedData && recordedData.length > 0) {
        const currentQuizData = quizData.Quiz.find(
          (quiz) =>
            quiz.QuizNo === recordedData[recordedData.length - 1].QuizNo,
        )
        const requireQuizCount = currentQuizData?.Examples.length || 0

        ;[currentQuizNo, lastQuizNo, tryCnt] = useCurrentQuizNoPartial(
          recordedData,
          requireQuizCount,
          quizData.QuizAnswerCount,
        )
      }

      const examples = convertExampleArr(quizData.Quiz)
      const wordData = convertSentence2Words(
        quizData.Sentence,
        recordedData,
        examples,
      )

      if (currentQuizNo > 1 || tryCnt > 0) {
        // 기록이 존재하면
        const [topExam, bottomExam] = splitExamples(examples, currentQuizNo - 1)

        setQuizNo(lastQuizNo)
        setQuestionNo(currentQuizNo)

        setPartialByRecordData(recordedData, lastQuizNo)

        setTopExample(topExam)
        setBottomExample(shuffle(bottomExam))
      } else {
        // 기록이 없으면
        setBottomExample(shuffle(examples))
      }

      setStudentAnswersPartial(recordedData, quizData.QuizAnswerCount)

      setIncorrectCount(tryCnt)
      setTryCount(tryCnt)

      setSentenceData(wordData)
      setExamples(examples)
    }
  }, [quizData])

  useEffect(() => {
    if (quizData && !isStepIntro) {
      setTryCount(0)
      setIncorrectCount(0)

      timer.setup(quizData.QuizTime, true)

      changeQuizState('studying')
    }
  }, [questionNo])

  useEffect(() => {
    if (isComplete && quizData) {
      playSentence()
    }
  }, [isComplete])

  // 로딩
  if (!quizData) return <>Loading...</>

  /////////////////////////////////////////////////////////
  // 정답 체크
  /////////////////////////////////////////////////////////
  const checkAnswer = async (
    target: EventTarget & HTMLDivElement,
    selectedText: string,
  ) => {
    try {
      changeQuizState('checking')

      const isCorrect: boolean =
        exampleData[questionNo - 1].Text === selectedText

      if (quizState === 'studying') {
        timer.stop()

        const correctStr = isCorrect ? '1' : '2'

        let currentPartialRecord = partialRecord + correctStr

        // 채점판 만들기
        const answerData: IScoreBoard = {
          quizNo: questionNo,
          maxCount: quizData.QuizAnswerCount,
          answerCount: tryCount + 1,
          ox: isCorrect,
        }

        // 유저 답안
        const userAnswer: IUserAnswerPartial = makeUserPartialAnswerData({
          mobile: '',
          studyId: props.studyId,
          studentHistoryId: props.studentHistoryId,
          bookType: props.bookType,
          step: STEP,
          quizId: quizData.Quiz[quizNo - 1].QuizId,
          quizNo: quizData.Quiz[quizNo - 1].QuizNo,
          currentQuizNo: questionNo,
          correct: exampleData[questionNo - 1].Text,
          selectedAnswer: selectedText,
          partialRecord: currentPartialRecord,
          tryCount: tryCount + 1,
          maxQuizCount: quizData.QuizAnswerCount,
          quizLength: exampleData.length,
          isCorrect: isCorrect,
          answerData: answerData,
          isFinishStudy: props.lastStep === STEP ? true : false,
        })

        const res = await saveUserAnswerPartial(userAnswer)

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

          setPartialRecord(currentPartialRecord)
          setTryCount(tryCount + 1)

          afterCheckAnswer(isCorrect, target)
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  /////////////////////////////////////////////////////////
  // 정답 체크 후
  /////////////////////////////////////////////////////////
  const afterCheckAnswer = (
    isCorrect: boolean,
    target: EventTarget & HTMLDivElement,
  ) => {
    changeBottomPopupState({
      isActive: true,
      isCorrect: isCorrect,
    })

    if (isCorrect) {
      animationManager.play(target, [style.correct, 'animate__fadeIn'])
    } else {
      animationManager.play(target, [style.incorrect, 'animate__headShake'])
    }
  }

  // 보기 애니메이션 완료 후
  const onAnimationEnd = (target: EventTarget & HTMLDivElement) => {
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
        // 정답인 경우
        const newSentenceData = changeSentenceData(questionNo, isCorrect)
        const newTopeExam = addTopExampleData(questionNo)
        const newBottomExamp = removeBottomExampleData(questionNo)

        setSentenceData(newSentenceData)
        setTopExample(newTopeExam)
        setBottomExample(newBottomExamp)

        if (questionNo + 1 <= exampleData.length) {
          // 다음 문제가 있는 경우
          const nextQuizNo = getNextQuizNo()

          // 현재 퀴즈 번호가 다음 퀴즈번호와 같지 않다면 퀴즈가 바뀐 것으로 판단
          if (quizNo !== nextQuizNo) {
            setPartialRecord('')
            setQuizNo(nextQuizNo)
          } else {
            setPartialRecord(partialRecord + ',')
          }

          setQuestionNo(questionNo + 1)
        } else {
          // 다음 문제가 없는 경우
          setComplete(true)
        }
      } else {
        // 오답인 경우
        if (tryCount < quizData.QuizAnswerCount) {
          // 기회가 남음
          timer.setup(quizData.QuizTime, true)
          changeQuizState('studying')
        } else {
          // 기회가 없음 - 다음 문제로
          const newSentenceData = changeSentenceData(questionNo, isCorrect)
          const newTopeExam = addTopExampleData(questionNo)
          const newBottomExamp = removeBottomExampleData(questionNo)

          setSentenceData(newSentenceData)
          setTopExample(newTopeExam)
          setBottomExample(newBottomExamp)

          if (questionNo + 1 <= exampleData.length) {
            // 다음 문제가 있는 경우
            const nextQuizNo = getNextQuizNo()

            // 현재 퀴즈 번호가 다음 퀴즈번호와 같지 않다면 퀴즈가 바뀐 것으로 판단
            if (quizNo !== nextQuizNo) {
              setPartialRecord('')
              setQuizNo(nextQuizNo)
            } else {
              setPartialRecord(partialRecord + ',')
            }

            setQuestionNo(questionNo + 1)
          } else {
            // 다음 문제가 없는 경우
            setComplete(true)
          }
        }
      }
    }, 1000)
  }

  /**
   * 타임 아웃으로 인한 정답 체크
   */
  const checkAnswerTimeOut = async () => {
    try {
      changeQuizState('checking')

      if (quizState === 'studying') {
        timer.stop()

        let currentPartialRecord = partialRecord + '2'

        // 채점판 만들기
        const answerData: IScoreBoard = {
          quizNo: questionNo,
          maxCount: quizData.QuizAnswerCount,
          answerCount: tryCount + 1,
          ox: false,
        }

        // 유저 답안
        const userAnswer: IUserAnswerPartial = makeUserPartialAnswerData({
          mobile: '',
          studyId: props.studyId,
          studentHistoryId: props.studentHistoryId,
          bookType: props.bookType,
          step: STEP,
          quizId: quizData.Quiz[quizNo - 1].QuizId,
          quizNo: quizData.Quiz[quizNo - 1].QuizNo,
          currentQuizNo: questionNo,
          correct: '2',
          selectedAnswer: currentPartialRecord,
          partialRecord: currentPartialRecord,
          tryCount: tryCount + 1,
          maxQuizCount: quizData.QuizAnswerCount,
          quizLength: exampleData.length,
          isCorrect: false,
          answerData: answerData,
          isFinishStudy: props.lastStep === STEP ? true : false,
        })

        const res = await saveUserAnswerPartial(userAnswer)

        if (Number(res.result) === 0) {
          if (res.resultMessage) {
            handler.finishStudy = {
              id: Number(res.result),
              cause: res.resultMessage,
            }
          }

          addStudentAnswers(answerData)
          setIncorrectCount(incorrectCount + 1)

          setPartialRecord(currentPartialRecord)
          setTryCount(tryCount + 1)

          changeBottomPopupState({
            isActive: true,
            isCorrect: false,
          })

          afterCheckAnswerTimeOut(tryCount + 1, currentPartialRecord)
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  /**
   * 타임 아웃 이후
   * @param tryCount
   */
  const afterCheckAnswerTimeOut = (
    tryCount: number,
    currentPartialRecord: string,
  ) => {
    setTimeout(() => {
      changeBottomPopupState({
        isActive: false,
        isCorrect: false,
      })

      if (tryCount >= quizData.QuizAnswerCount) {
        // 기회가 없음 - 다음 문제로
        const newSentenceData = changeSentenceData(questionNo, false)
        const newTopeExam = addTopExampleData(questionNo)
        const newBottomExamp = removeBottomExampleData(questionNo)

        setSentenceData(newSentenceData)
        setTopExample(newTopeExam)
        setBottomExample(newBottomExamp)

        if (questionNo + 1 <= exampleData.length) {
          // 다음 문제가 있는 경우
          const nextQuizNo = getNextQuizNo()

          // 현재 퀴즈 번호가 다음 퀴즈번호와 같지 않다면 퀴즈가 바뀐 것으로 판단
          if (quizNo !== nextQuizNo) {
            setPartialRecord('')
            setQuizNo(nextQuizNo)
          } else {
            setPartialRecord(currentPartialRecord + ',')
          }

          setQuestionNo(questionNo + 1)
        } else {
          // 다음 문제가 없는 경우
          setComplete(true)
        }
      } else {
        // 기회가 남음
        timer.setup(quizData.QuizTime, true)
        changeQuizState('studying')
      }
    }, 1000)
  }

  /**
   * 기록으로부터 다음 퀴즈 번호 구하기
   * @param lastRecordData
   * @returns 다음 퀴즈 번호
   */
  const getNextQuizNoByRecordData = (lastRecordData: IRecordAnswerType) => {
    let nextQuizNo = 0

    if (
      lastRecordData.StudentAnswer.split(',').length <
      quizData.Quiz[lastRecordData.QuizNo - 1].Examples.length
    ) {
      // 같은 quiz no내에 다음 퀴즈가 있는 경우
      nextQuizNo = lastRecordData.QuizNo
    } else if (
      lastRecordData.StudentAnswer.split(',').length ===
      quizData.Quiz[lastRecordData.QuizNo - 1].Examples.length
    ) {
      if (
        lastRecordData.AnswerCount === quizData.QuizAnswerCount ||
        lastRecordData.OX === '1'
      ) {
        // 기회가 없는 경우
        nextQuizNo = lastRecordData.QuizNo + 1
      } else if (lastRecordData.AnswerCount < quizData.QuizAnswerCount) {
        // 다음 퀴즈가 없지만, 기회가 남아있는 경우
        nextQuizNo = lastRecordData.QuizNo
      }
    }

    return nextQuizNo
  }

  /**
   * 다음 퀴즈 번호 구하기
   * @returns 다음 퀴즈 번호
   */
  const getNextQuizNo = (): number => {
    let nextQuizNo = 1

    quizData.Quiz.map((quiz, quizIndex) => {
      if (quiz.Examples.length > 0) {
        quiz.Examples.map((example) => {
          if (example.Text === exampleData[questionNo].Text) {
            nextQuizNo = quizIndex + 1
          }
        })
      }
    })

    return nextQuizNo
  }

  /**
   * 과거 기록이 존재하는 경우 현재 진행 중인 학습에 넣어줌
   * @param recordedData
   * @param nextQuizNo
   */
  const setPartialByRecordData = (
    recordedData: IRecordAnswerType[],
    nextQuizNo: number,
  ) => {
    let partialRecord = ''

    recordedData.filter((record) => {
      if (record.QuizNo === nextQuizNo) {
        if (
          record.AnswerCount === quizData.QuizAnswerCount ||
          record.StudentAnswer.slice(-1) === '1'
        ) {
          partialRecord = record.StudentAnswer + ','
        } else {
          partialRecord = record.StudentAnswer
        }
      }
    })

    setPartialRecord(partialRecord)
  }

  /**
   * sentence data 생성
   * @param sentence
   * @param recordedData
   * @param examples
   * @returns sentence data
   */
  const convertSentence2Words = (
    sentence: ISummary2Sentence,
    recordedData: IRecordAnswerType[],
    examples: ISummary2Example[],
  ): WordDataProp[] => {
    const convertedRecordData = convertPartialRecordToScoreBoard(
      recordedData,
      quizData.QuizAnswerCount,
    )

    // 단어 단위로 자른 후 index를 넣어주기
    let startIndex = 0

    // sentence -> word 로 분리
    const wordArr = sentence.Texts.map((text) => text.split(' ')).reduce(
      (acc, cur) => [...acc, ...cur],
    )

    // word에 데이터 삽입
    const wordDataArr = wordArr.map((word): WordDataProp => {
      if (word.includes('┒')) {
        let wordState: WordDataProp['State'] = 'none'

        if (convertedRecordData[startIndex]) {
          if (convertedRecordData[startIndex].ox) {
            wordState = 'correct'
          } else if (
            !convertedRecordData[startIndex].ox &&
            convertedRecordData[startIndex].answerCount ===
              quizData.QuizAnswerCount
          ) {
            wordState = 'incorrect'
          }
        }

        return {
          Word: examples[startIndex].Text,
          QuestionIndex: ++startIndex,
          State: wordState,
        }
      } else {
        return {
          Word: word,
          QuestionIndex: 0,
          State: 'none',
        }
      }
    })

    return wordDataArr
  }

  /////////////////////////////////////////////////////////
  // sentenceData 변경
  /////////////////////////////////////////////////////////
  const changeSentenceData = (
    questionNo: number,
    isCorrect: boolean,
  ): WordDataProp[] => {
    let newSentenceData: WordDataProp[] = [...sentenceData]

    const wordIndex = sentenceData.findIndex(
      (word) => word.QuestionIndex === questionNo,
    )

    newSentenceData[wordIndex].State = isCorrect ? 'correct' : 'incorrect'

    return newSentenceData
  }

  /////////////////////////////////////////////////////////
  // example 데이터 추가 / 제거
  /////////////////////////////////////////////////////////
  const addTopExampleData = (questionNo: number): ISummary2Example[] => {
    const newTopData: ISummary2Example[] = [
      ...topExample,
      exampleData[questionNo - 1],
    ]

    return newTopData
  }

  const removeBottomExampleData = (questionNo: number): ISummary2Example[] => {
    const correctText = exampleData[questionNo - 1].Text
    const newBottomExam: ISummary2Example[] = bottomExample.filter(
      (exam) => exam.Text !== correctText,
    )

    return newBottomExam
  }

  /////////////////////////////////////////////////////////
  // Example 만들기
  /////////////////////////////////////////////////////////
  const convertExampleArr = (quizes: ISummary2Quiz[]): ISummary2Example[] => {
    const examples = quizes
      .map((quiz) => quiz.Examples)
      .reduce((acc, cur) => [...acc, ...cur])

    return examples
  }

  /////////////////////////////////////////////////////////
  // 과거 기록이 있다면 Example 분리하기
  /////////////////////////////////////////////////////////
  const splitExamples = (
    examples: ISummary2Example[],
    quizNo: number,
  ): [ISummary2Example[], ISummary2Example[]] => {
    const topExample: ISummary2Example[] = examples.slice(0, quizNo)
    const bottomExample: ISummary2Example[] = examples.slice(
      quizNo,
      examples.length,
    )

    return [topExample, bottomExample]
  }

  /////////////////////////////////////////////////////////
  // 서머리 완료 후 오디오 재생
  /////////////////////////////////////////////////////////
  const playSentence = () => {
    if (playState === 'playing') {
      stopAudio()
    } else {
      playAudio(quizData.Sentence.Sounds[0])
    }
  }

  const showResult = () => {
    stopAudio()
    changeResultShow(true)
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
            comment={'지문을 보고 빈칸에 들어갈 알맞은 답을 순서대로 고르세요.'}
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
                quizNumber={questionNo}
                totalQuizCnt={exampleData.length}
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
                <Container
                  typeCSS={style.summaryTest2}
                  containerCSS={style.container}
                >
                  <>
                    {isComplete && (
                      <BtnPlaySentence
                        playState={playState}
                        playSentence={playSentence}
                      />
                    )}
                  </>

                  {/* 상단 문장 */}
                  <BoxQuestion
                    isComplete={isComplete}
                    sentenceData={sentenceData}
                    questionNo={questionNo}
                  />

                  <>
                    {!isComplete ? (
                      <>
                        {/* 문장 아래 화살표 */}
                        <ArrowUp />

                        {/* 선택지 */}
                        <WrapperExample
                          exampleData={bottomExample}
                          checkAnswer={checkAnswer}
                          onAnimationEnd={onAnimationEnd}
                        />
                      </>
                    ) : (
                      <BtnGoNext showResult={showResult} />
                    )}
                  </>
                </Container>
              </QuizBody>

              <StudySideMenu
                isSideOpen={isSideOpen}
                currentStep={STEP}
                currentStepType={STEP_TYPE}
                quizLength={exampleData.length}
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
