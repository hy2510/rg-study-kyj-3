import { useEffect, useRef, useState, useContext } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'
import { deletePenalty, saveUserAnswerPartial } from '@services/studyApi'
import { getClozeTest3 } from '@services/quiz/ClozeTestAPI'

import clozeTestCSS from '@stylesheets/cloze-test.module.scss'
import clozeTestCSSMobile from '@stylesheets/mobile/cloze-test.module.scss'

// Types [
import {
  IStudyData,
  IScoreBoardData as IScoreBoard,
  IUserAnswerPartial,
} from '@interfaces/Common'

// 예제와 유저의 답안을 체크하기 위함
type AnswerInfoProps = {
  example: string
  input: string
  isEqual: boolean
}
type InputValue = {
  text: string
  isCorrected: boolean
}
type PenaltyState = 'none' | 'penalty' | 'success'
// ] Types

// utils
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
import Container from '@components/study/common-study/Container'
import StudyPopupBottom from '@components/study/common-study/StudyPopupBottom'
import TestResult from '@components/study/common-study/TestResult'
import Gap from '@components/study/common-study/Gap'

// components - cloze test 3
import BtnPlayWord from '@components/study/cloze-test-03/BtnPlayWord'
import WrapperQuestion from '@components/study/cloze-test-03/WrapperQuestion'

const STEP_TYPE = 'Cloze Test'

const isMobile = useDeviceDetection()

const style = isMobile ? clozeTestCSSMobile : clozeTestCSS

export default function ClozeTest3(props: IStudyData) {
  const { handler } = useContext(AppContext) as AppContextProps
  const STEP = props.currentStep

  const timer = useQuizTimer(() => {
    checkAnswer()
  })

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
  const [quizData, recordedData] = useFetch(getClozeTest3, props, STEP) // 퀴즈 데이터 / 저장된 데이터
  const [quizNo, setQuizNo] = useState<number>(1) // 퀴즈 번호
  const [userAnswerStr, setUserAnswerStr] = useState<string[]>([])

  // 과거 기록
  const {
    scoreBoardData,
    setStudentAnswers,
    addStudentAnswers,
    makeUserPartialAnswerData,
  } = useStudentAnswer()
  const [tryCount, setTryCount] = useState(0) // 시도 횟수
  const [incorrectCount, setIncorrectCount] = useState<number>(0) // 문제 틀린 횟수

  // input
  const inputRefs = useRef<HTMLInputElement[]>([])
  const [inputValues, setInputValues] = useState<InputValue[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  // 패널티
  const [penaltyState, setPenaltyState] = useState<PenaltyState>('none')

  // 정 / 오답시 하단에 나오는 correct / incorrect
  const { bottomPopupState, changeBottomPopupState } = useBottomPopup()

  // audio
  const { playState, playAudio, stopAudio } = useStudyAudio()

  // 인트로
  useEffect(() => {
    if (!isStepIntro && quizData) {
      if (penaltyState === 'none') {
        timer.setup(quizData.QuizTime, true)

        playSentence()
      }

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

      // 과거 기록 동기화
      if (recordedData.length > 0) {
        if (
          quizData.IsEnablePenaltyReview &&
          recordedData[recordedData.length - 1].PenaltyWord !== ''
        ) {
          // 패널티인 경우
          setInputValues(
            new Array(quizData.Quiz[currentQuizNo - 2].Examples.length).fill({
              text: '',
              isCorrected: false,
            }),
          )

          setPenaltyState('penalty')
          setTryCount(quizData.QuizAnswerCount)
          setIncorrectCount(quizData.QuizAnswerCount)
          setQuizNo(recordedData[recordedData.length - 1].CurrentQuizNo)
        } else {
          // 패널티 아닌 경우
          if (
            recordedData[currentQuizNo - 1] &&
            recordedData[currentQuizNo - 1].CurrentQuizNo === currentQuizNo &&
            recordedData[currentQuizNo - 1].StudentAnswer !== ''
          ) {
            // 패널티는 아니지만 푼 경우
            const inputValues =
              recordedData[recordedData.length - 1].StudentAnswer.split('/')
            const prevData = setPrevRecordData(inputValues, currentQuizNo)

            setUserAnswerStr(
              recordedData[recordedData.length - 1].StudentAnswer.split('/'),
            )

            if (prevData) {
              const index = prevData.findIndex((data) => !data.isCorrected)

              setCurrentIndex(index)
            }

            setInputValues(prevData)
          } else {
            // 풀지 않은 경우
            setInputValues(
              new Array(quizData.Quiz[currentQuizNo - 1].Examples.length).fill({
                text: '',
                isCorrected: false,
              }),
            )
            setUserAnswerStr(
              new Array(quizData.Quiz[currentQuizNo - 1].Examples.length).fill(
                '',
              ),
            )
          }

          setTryCount(tryCnt)
          setIncorrectCount(tryCnt)
          setQuizNo(currentQuizNo)
        }
      } else {
        setTryCount(tryCnt)
        setIncorrectCount(tryCnt)
        setQuizNo(currentQuizNo) // 현재 퀴즈 번호
        setUserAnswerStr(
          new Array(quizData.Quiz[currentQuizNo - 1].Examples.length).fill(''),
        )

        setInputValues([
          ...setPrevRecordData(
            new Array(quizData.Quiz[currentQuizNo - 1].Examples.length).fill(
              '',
            ),
            currentQuizNo,
          ),
        ])
      }

      setStudentAnswers(recordedData, quizData.QuizAnswerCount) // 기존 데이터를 채점판에 넣어주기
    }
  }, [quizData])

  // 퀴즈 번호가 바뀐 경우 문제가 바뀐 것으로 판단.
  useEffect(() => {
    if (!isStepIntro && !isResultShow && quizData) {
      timer.setup(quizData.QuizTime, true)

      playSentence()
      setCurrentIndex(0)
      resetInputValues()
      changeQuizState('studying')
    }
  }, [quizNo])

  // 퀴즈 상태가 변경되면
  useEffect(() => {
    if (
      quizState === 'studying' &&
      quizData &&
      !isStepIntro &&
      !isResultShow &&
      penaltyState === 'none'
    ) {
      timer.setup(quizData.QuizTime, true)
    }
  }, [quizState])

  // 인풋의 current index가 변경되면
  useEffect(() => {
    if (currentIndex > -1 && inputRefs?.current[currentIndex]) {
      inputRefs?.current[currentIndex].focus()
    }
  }, [currentIndex])

  // 패널티 상태가 바뀌면
  useEffect(() => {
    if (quizData) {
      if (penaltyState === 'penalty' && !isStepIntro) {
        timer.stop()
      } else if (penaltyState === 'success') {
        afterPenalty()
      }
    }
  }, [penaltyState])

  // 로딩
  if (!quizData) return <>Loading...</>

  /**
   * input값 체크 후 input들의 정보와 유저 답안 및 정답을 리턴한다
   * @returns input들의 정보와 유저 답안 및 정답
   */
  const checkInput = (): [
    AnswerInfoProps[],
    boolean,
    string,
    string,
    string,
  ] => {
    let answerDatas: AnswerInfoProps[] = []
    let userAnswers: string[] = []
    let correctAnswers: string[] = []
    const userAnswerArr = userAnswerStr

    for (let i = 0; i < inputRefs?.current.length; i++) {
      const infoObj: AnswerInfoProps = {
        example: quizData.Quiz[quizNo - 1].Examples[i].Text,
        input: inputRefs?.current[i].value,
        isEqual:
          quizData.Quiz[quizNo - 1].Examples[i].Text ===
          inputRefs?.current[i].value,
      }

      if (userAnswerArr[i].length > 0) {
        userAnswerArr[i] =
          userAnswerArr[i].slice(-1) === '1'
            ? userAnswerArr[i]
            : (userAnswerArr[i] +=
                quizData.Quiz[quizNo - 1].Examples[i].Text ===
                inputRefs?.current[i].value
                  ? '1'
                  : '2')
      } else {
        userAnswerArr[i] =
          quizData.Quiz[quizNo - 1].Examples[i].Text ===
          inputRefs?.current[i].value
            ? '1'
            : '2'
      }

      correctAnswers.push(infoObj.example)
      answerDatas.push(infoObj)
      userAnswers.push(infoObj.input)
    }

    setUserAnswerStr(userAnswerArr)

    return [
      answerDatas,
      correctAnswers.join('┒') === userAnswers.join('┒'),
      correctAnswers.join('┒'),
      userAnswers.join('┒'),
      userAnswerArr.join('/'),
    ]
  }

  /** [ 타이핑을 끝낸 후 ]
   * @param inputRef input tag refs
   * @param correctCount 일치하는 타이핑 횟수
   * @param onIndexHandler input tag 포커스 관리
   */
  const checkAnswer = async () => {
    try {
      changeQuizState('checking')
      timer.stop()

      if (quizState === 'studying') {
        const [
          answerDatas,
          isCorrect,
          correctAnswer,
          userAnswers,
          partialRecord,
        ] = checkInput()

        // 채점판 만들기
        const answerData: IScoreBoard = {
          quizNo: quizNo,
          maxCount: quizData.QuizAnswerCount,
          answerCount: tryCount + 1,
          ox: isCorrect,
        }

        // 유저 답 데이터 생성
        const userAnswer: IUserAnswerPartial = makeUserPartialAnswerData({
          mobile: '',
          studyId: props.studyId,
          studentHistoryId: props.studentHistoryId,
          bookType: props.bookType,
          step: STEP,
          quizId: quizData.Quiz[quizNo - 1].QuizId,
          quizNo: quizData.Quiz[quizNo - 1].QuizNo,
          currentQuizNo: quizData.Quiz[quizNo - 1].QuizNo,
          correct: correctAnswer,
          selectedAnswer: userAnswers,
          partialRecord: partialRecord,
          tryCount: tryCount + 1,
          maxQuizCount: quizData.QuizAnswerCount,
          quizLength: quizData.Quiz.length,
          isCorrect: isCorrect,
          answerData: answerData,
          isEnabledPenalty: quizData.IsEnablePenaltyReview,
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

          setTryCount(tryCount + 1)

          afterCheckAnswer(isCorrect, answerDatas)
        }
      }
    } catch (e) {
      console.log(e)
    }
  }

  /** [ 서버에 유저의 답안 저장 후 ]
   * @param isCorrect 정 / 오답
   */
  const afterCheckAnswer = (
    isCorrect: boolean,
    answerDatas: AnswerInfoProps[],
  ) => {
    changeBottomPopupState({
      isActive: true,
      isCorrect: isCorrect,
    })

    setTimeout(() => {
      if (isCorrect) {
        if (quizNo + 1 > Object.keys(quizData.Quiz).length) {
          // 마지막 문제 처리
          changeResultShow(true)
        } else {
          resetInputValues()
          setTryCount(0)
          setIncorrectCount(0)
          changePenaltyState('none')
          setUserAnswerStr(
            new Array(quizData.Quiz[quizNo].Examples.length).fill(''),
          )

          setQuizNo(quizNo + 1)
        }
      } else {
        let isInputIndexChange = true
        let inputIndex = 0
        let newInputValues: InputValue[] = []

        // 인풋값 초기화
        inputRefs?.current.forEach((input, index) => {
          if (!answerDatas[index].isEqual) {
            if (isInputIndexChange) {
              isInputIndexChange = false
              inputIndex = index
            }
          }

          newInputValues.push({
            text: answerDatas[index].input,
            isCorrected: answerDatas[index].isEqual,
          })
        })

        setInputValues([...newInputValues])

        if (tryCount === quizData.QuizAnswerCount - 1) {
          // 패널티인 상황
          stopAudio()
          setCurrentIndex(0)
          changePenaltyState('penalty')
        } else {
          // 오답인 상황
          timer.setup(quizData.QuizTime, true)

          setCurrentIndex(inputIndex)
          changeQuizState('studying')
        }
      }

      changeBottomPopupState({
        isActive: false,
        isCorrect: false,
      })
    }, 1500)
  }

  // input 관련
  const changeInputIndex = (index: number) => {
    setCurrentIndex(index)
  }

  const changeInputValue = (index: number, newValue: string) => {
    const newInputValues = inputValues.map((value, i) => {
      return index === i
        ? { text: newValue, isCorrected: value.isCorrected }
        : { text: value.text, isCorrected: value.isCorrected }
    })

    setInputValues([...newInputValues])
  }

  // input values 초기화
  const resetInputValues = () => {
    if (quizData.Quiz[quizNo]) {
      setInputValues([
        ...new Array(quizData.Quiz[quizNo].Examples.length).fill({
          text: '',
          isCorrected: false,
        }),
      ])
    }
  }
  // input end

  // 패널티 관련
  const changePenaltyState = (value: 'none' | 'penalty' | 'success') => {
    setPenaltyState(value)
  }

  /** [ 패널티 완료 후 ] */
  const afterPenalty = async () => {
    const isLastQuiz = quizNo + 1 > quizData.Quiz.length ? true : false
    const clearPenalty = async () => {
      const res = await deletePenalty({
        mobile: '',
        bookType: props.bookType,
        studyId: props.studyId,
        studentHistoryId: props.studentHistoryId,
        step: `${STEP}`,
        quizId: quizData.Quiz[quizNo - 1].QuizId,
        isLastQuiz: isLastQuiz,
        isFinishStudy: isLastQuiz && props.lastStep === STEP ? true : false,
      })

      if (Number(res.result) === 0) {
        stopAudio()

        if (quizNo + 1 > Object.keys(quizData.Quiz).length) {
          // 마지막 문제 처리
          changeResultShow(true)
        } else {
          resetInputValues()
          setTryCount(0)
          setIncorrectCount(0)
          setUserAnswerStr(
            new Array(quizData.Quiz[quizNo].Examples.length).fill(''),
          )
          changePenaltyState('none')

          setQuizNo(quizNo + 1)
        }
      }
    }

    clearPenalty()
  }

  const setPrevRecordData = (
    inputVals: string[],
    quizNo: number,
  ): InputValue[] => {
    let tempArr: InputValue[] = [] // 기존에 푼 답안을 담아줄 배열

    for (let i = 0; i < inputVals.length; i++) {
      const inputVal: InputValue = {
        text:
          inputVals[i].slice(-1) === '1'
            ? quizData.Quiz[quizNo - 1].Examples[i].Text
            : '',
        isCorrected: inputVals[i].slice(-1) === '1',
      }

      tempArr.push(inputVal)
    }

    return tempArr
  }

  const playSentence = (cb?: () => void) => {
    if (penaltyState === 'none') {
      if (playState === 'playing') {
        stopAudio()
      } else {
        playAudio(quizData.Quiz[quizNo - 1].Question.Sound)
      }
    } else if (penaltyState === 'success' && playState === '') {
      playAudio(quizData.Quiz[quizNo - 1].Question.Sound, cb)
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
            comment={'문장을 읽고 빈칸에 들어갈 답을 입력하세요.'}
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
                className={`${clozeTestCSS.comment} animate__animated animate__fadeInLeft`}
              >
                {STEP_TYPE}
              </div>

              <QuizBody>
                <Container
                  typeCSS={style.clozeTest2}
                  containerCSS={style.container}
                >
                  {isMobile ? <></> : <Gap height={0} />}

                  {penaltyState === 'none' ? (
                    <BtnPlayWord
                      playState={playState}
                      playSentence={playSentence}
                    />
                  ) : (
                    <div className={style.testReview}>
                      <div className={style.title}>Test Review</div>
                    </div>
                  )}

                  <WrapperQuestion
                    inputRefs={inputRefs}
                    quizState={quizState}
                    exampleData={quizData.Quiz[quizNo - 1]}
                    currentIndex={currentIndex}
                    inputValues={inputValues}
                    penaltyState={penaltyState}
                    changeInputValue={changeInputValue}
                    changeInputIndex={changeInputIndex}
                    checkAnswer={checkAnswer}
                    changePenaltyState={changePenaltyState}
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

              <StudyPopupBottom bottomPopupState={bottomPopupState} />
            </>
          )}
        </>
      )}
    </>
  )
}
