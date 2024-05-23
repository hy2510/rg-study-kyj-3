import { useEffect, useState } from 'react'
import { saveWritingActivity } from '@services/studyApi'
import { getWritingActivity2 } from '@services/quiz/WritingActivityAPI'

import writingActivityCSS from '@stylesheets/writing-activity.module.scss'
import writingActivityCSSMobile from '@stylesheets/mobile/writing-activity.module.scss'

// Types [
import { IStudyData, IUserAnswerWriting } from '@interfaces/Common'
// ] Types

// utils & hooks
import { trimEnd, trimStart } from 'lodash'
import { useQuizTimer } from '@hooks/study/useQuizTimer'
import useStepIntro from '@hooks/common/useStepIntro'
import { useFetch } from '@hooks/study/useFetch'
import { useQuiz } from '@hooks/study/useQuiz'
import { useResult } from '@hooks/study/useResult'
import { useStudentAnswer } from '@hooks/study/useStudentAnswer'
import useDeviceDetection from '@hooks/common/useDeviceDetection'

// components - common
import QuizHeader from '@components/study/common-study/QuizHeader'
import StudySideMenu from '@components/study/common-study/StudySideMenu'
import QuizBody from '@components/study/common-study/QuizBody'
import Gap from '@components/study/common-study/Gap'
import Container from '@components/study/common-study/Container'

// components - writing activity 1
import StepIntro from '@components/study/writing-activity-02/StepIntro'
import WrapperTab from '@components/study/writing-activity-02/WrapperTab'
import TextQuestion from '@components/study/writing-activity-02/TextQuestion'
import WritingArea from '@components/study/writing-activity-02/WritingArea'
import GoNextStepBox from '@components/study/writing-activity-02/GoNextStepBox'
import StepOutro from '@components/study/writing-activity-02/StepOutro'

const STEP_TYPE = 'Writing Activity'

const isMobile = useDeviceDetection()

const style = isMobile ? writingActivityCSSMobile : writingActivityCSS

export default function WritingActivity2(props: IStudyData) {
  const STEP = props.currentStep

  const timer = useQuizTimer(() => {
    // timer가 0에 도달하면 호출되는 콜백함수 구현
    // 로그아웃
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
  const [quizData, recordedData] = useFetch(getWritingActivity2, props, STEP)
  const { scoreBoardData, setStudentAnswers } = useStudentAnswer()

  const [currentTabIndex, setTabIndex] = useState(0)

  // text area data
  const [answerData, setAnswerData] = useState<string[]>([])
  const [isSubmit, setIsSubmit] = useState<boolean>(false)

  useEffect(() => {
    if (!isStepIntro && quizData) {
      timer.setup(quizData.QuizTime, true)

      changeQuizState('studying')
    }
  }, [isStepIntro])

  useEffect(() => {
    if (quizData) {
      try {
        // 저장 기록이 있는 경우
        if (recordedData.length > 0) {
          const recordedWriting: string[] = []

          recordedData.map((record) => recordedWriting.push(record.TempText))

          setAnswerData([...recordedWriting])
        } else {
          const newAnswer = new Array(quizData.Writing.Question.length).fill('')

          setAnswerData([...newAnswer])
        }

        setStudentAnswers(recordedData, 0) // 기존 데이터를 채점판에 넣어주기
      } catch (e) {
        console.log(e)
      }
    }
  }, [quizData])

  // 모든 텍스트에 조건에 충족하게 들어간 경우 submit버튼 활성화
  useEffect(() => {
    if (answerData && quizData) {
      // 1. 모든 textarea에 공백이 아닐 것
      // 2. min / max 조건
      const blankAnswerCnt = answerData.filter((answer) => answer === '').length
      const wordCount = getAnswerLength()

      if (
        blankAnswerCnt === 0 &&
        wordCount >= quizData.Writing.WordMinCount &&
        wordCount <= quizData.Writing.WordMaxCount
      ) {
        setIsSubmit(true)
      } else {
        setIsSubmit(false)
      }
    }
  }, [answerData])

  // 로딩
  if (!quizData) return <>Loading...</>

  const goWritingActivity = () => {
    setIntroAnim('animate__bounceOutLeft')
  }

  /**
   * step intro에서 Writing Activity 안하고 넘어가기
   */
  const noWritingActivity = async () => {
    changeQuizState('checking')

    if (quizState === 'loading') {
      const userAnswer: IUserAnswerWriting = {
        bookType: props.bookType,
        studyId: props.studyId,
        studentHistoryId: props.studentHistoryId,
        step: `${STEP}`,
        saveType: 'R',
        writeText: "''",
        isFinishStudy: true,
      }

      const res = await saveWritingActivity(userAnswer)

      if (Number(res.result) === 0) {
        // 끝
        props.onFinishActivity()
      }
    }
  }

  /**
   * step outro에서 첨삭받기
   */
  const submitWritingActivity = async () => {
    changeQuizState('checking')

    if (quizState === 'studying') {
      const userAnswer: IUserAnswerWriting = {
        bookType: props.bookType,
        studyId: props.studyId,
        studentHistoryId: props.studentHistoryId,
        step: `${STEP}`,
        saveType: 'S',
        writeText: "''",
        isFinishStudy: true,
      }

      const res = await saveWritingActivity(userAnswer)

      if (Number(res.result) === 0) {
        // 끝
        props.onFinishActivity()
      }
    }
  }

  /**
   * outro에서 첨삭받지 않기
   */
  const submitNoRevision = async () => {
    changeQuizState('checking')

    if (quizState === 'studying') {
      const userAnswer: IUserAnswerWriting = {
        bookType: props.bookType,
        studyId: props.studyId,
        studentHistoryId: props.studentHistoryId,
        step: `${STEP}`,
        saveType: 'E',
        writeText: "''",
        isFinishStudy: true,
      }

      const res = await saveWritingActivity(userAnswer)

      if (Number(res.result) === 0) {
        // 끝
        props.onFinishActivity()
      }
    }
  }

  /**
   * writing 완료
   */
  const submitAnswer = () => {
    if (isSubmit) changeResultShow(true)
  }

  /**
   * 퀴즈 번호 변경
   * @param value 바꿀 퀴즈 번호
   */
  const changeTabNo = (selectedTabIndex: number) => {
    setTabIndex(selectedTabIndex)
  }

  /**
   * 텍스트 입력
   * @param text  텍스트
   */
  const onChangeHandler = (text: string = '') => {
    let prevData = answerData !== undefined ? [...answerData] : [text]
    prevData[currentTabIndex] = text

    setAnswerData([...prevData])
  }

  /**
   * 사용자가 입력한 단어의 수를 구하는 함수
   * 공백이 반복되면 1개로 카운트한다
   * @returns 단어 수
   */
  const getAnswerLength = (): number => {
    const textLength = answerData.reduce(
      (acc, cur) =>
        acc +
        (cur === ''
          ? 0
          : trimStart(trimEnd(cur.replaceAll(/\s+/g, ' '))).split(' ').length),
      0,
    )

    return textLength
  }

  /**
   * Writing Activity 중간 저장
   */
  const saveAnswer = async () => {
    try {
      changeQuizState('checking')

      const writedText = answerData.join('┒')

      if (quizState === 'studying') {
        const userAnswer: IUserAnswerWriting = {
          bookType: props.bookType,
          studyId: props.studyId,
          studentHistoryId: props.studentHistoryId,
          step: `${STEP}`,
          saveType: 'X',
          writeText: `${writedText}`,
        }

        const res = await saveWritingActivity(userAnswer)

        if (Number(res.result) === 0) {
          changeQuizState('studying')
        }
      }
    } catch (e) {
      console.log(e)
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
            mode={quizData.Writing.Mode}
            type={quizData.Writing.Type}
            currentSubmitCount={quizData.Writing.CurrentSubmitCount}
            maxSubmitCount={quizData.Writing.MaxSubmitCount}
            goWritingActivity={goWritingActivity}
            noWritingActivity={noWritingActivity}
          />
        </div>
      ) : (
        <>
          {isResultShow ? (
            <div className={`animate__animated `}>
              <StepOutro
                mode={quizData.Writing.Mode}
                type={quizData.Writing.Type}
                currentSubmitCount={quizData.Writing.CurrentSubmitCount}
                maxSubmitCount={quizData.Writing.MaxSubmitCount}
                submitWritingActivity={submitWritingActivity}
                submitNoRevision={submitNoRevision}
              />
            </div>
          ) : (
            <>
              <QuizHeader
                quizNumber={currentTabIndex + 1}
                totalQuizCnt={quizData.Writing.Question.length}
                life={1}
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
                {isMobile ? <></> : <Gap height={15} />}

                <Container
                  typeCSS={style.writingActivity2}
                  containerCSS={style.container}
                >
                  {/* 탭 */}
                  <WrapperTab
                    currentTabIndex={currentTabIndex}
                    questionData={quizData.Writing.Question}
                    changeTabNo={changeTabNo}
                  />

                  {/* 탭에 따른 질문 */}
                  <TextQuestion
                    question={quizData.Writing.Question[currentTabIndex]}
                  />

                  {/* 글쓰기 영역 */}
                  <WritingArea
                    answerData={answerData[currentTabIndex]}
                    onChangeHandler={onChangeHandler}
                  />

                  {/* 하단 버튼 및 글자수 영역 */}
                  <GoNextStepBox
                    isSubmit={isSubmit}
                    wordMinCount={quizData.Writing.WordMinCount}
                    wordMaxCount={quizData.Writing.WordMaxCount}
                    answerLength={getAnswerLength()}
                    saveAnswer={saveAnswer}
                    submitAnswer={submitAnswer}
                  />
                </Container>

                {isMobile ? <Gap height={5} /> : <Gap height={15} />}
              </QuizBody>

              <StudySideMenu
                isSideOpen={isSideOpen}
                currentStep={STEP}
                currentStepType={STEP_TYPE}
                quizLength={0}
                maxAnswerCount={0}
                scoreBoardData={scoreBoardData}
                changeSideMenu={changeSideMenu}
              />
            </>
          )}
        </>
      )}
    </>
  )
}
