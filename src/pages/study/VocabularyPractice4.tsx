import { useEffect, useRef, useState } from 'react'
import { getVocabularyPractice4 } from '@services/quiz/VocabularyAPI'

import vocabularyCSS from '@stylesheets/vocabulary-practice.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-practice.module.scss'

// Types [
import { IStudyData } from '@interfaces/Common'
// ] Types

// utils & hooks
import useStepIntro from '@hooks/common/useStepIntro'
import { useQuiz } from '@hooks/study/useQuiz'
import { useQuizTimer } from '@hooks/study/useQuizTimer'
import { useAnimation } from '@hooks/study/useAnimation'
import { useFetch } from '@hooks/study/useFetch'
import { useStudentAnswer } from '@hooks/study/useStudentAnswer'
import useStudyAudio from '@hooks/study/useStudyAudio'
import useDeviceDetection from '@hooks/common/useDeviceDetection'

// components
import StepIntro from '@components/study/common-study/StepIntro'
import QuizHeader from '@components/study/common-study/QuizHeader'
import QuizBody from '@components/study/common-study/QuizBody'
import Container from '@components/study/common-study/Container'
import StudySideMenu from '@components/study/common-study/StudySideMenu'

// components - vocabulary practice 4
import WrapperCard from '@components/study/vocabulary-practice-04/WrapperCard'
import Indicator from '@components/study/vocabulary-practice-04/Indicator'
import BtnNext from '@components/study/vocabulary-practice-04/BtnNext'

const STEP_TYPE = 'Vocabulary Practice'

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

export default function VocabularyPractice4(props: IStudyData) {
  const STEP = props.currentStep

  const timer = useQuizTimer(() => {
    // timer가 0에 도달하면 호출되는 콜백함수 구현
  })

  // 인트로
  const [introAnim, setIntroAnim] = useState<
    'animate__bounceInRight' | 'animate__bounceOutLeft'
  >('animate__bounceInRight')
  const { isStepIntro, closeStepIntro } = useStepIntro() // 데이터 가져오기
  const [isSideOpen, setSideOpen] = useState(false)

  const animationManager = useAnimation()

  // 퀴즈 데이터 세팅
  const { quizState, changeQuizState } = useQuiz()
  // 퀴즈 데이터 / 저장된 데이터
  const [quizData, recordedData] = useFetch(getVocabularyPractice4, props, STEP)
  const [quizNo, setQuizNo] = useState<number>(1) // 퀴즈 번호
  const { scoreBoardData } = useStudentAnswer()

  // 마지막 장까지 봤는지
  const [isLastPage, setIsLastPage] = useState(false)

  // audio
  const { playState, playAudio, stopAudio } = useStudyAudio()

  // 카드
  const wrapperRef = useRef<HTMLDivElement>(null)

  // 인트로가 없어지면
  useEffect(() => {
    if (!isStepIntro && quizData) {
      timer.setup(quizData.QuizTime, true)

      setTimeout(() => {
        playWord()
      }, 500)
    }
  }, [isStepIntro])

  // 퀴즈 번호가 바뀌면 다음 카드인 상황
  useEffect(() => {
    if (!isStepIntro && quizData) {
      stopAudio()

      if (quizNo === quizData.Quiz.length) {
        setIsLastPage(true)
      }

      playWord()
    }
  }, [quizNo])

  // 퀴즈 상태가 변경되면 애니메이션 제거
  useEffect(() => {
    if (quizData && quizState === 'studying') {
      if (wrapperRef.current) {
        animationManager.remove(wrapperRef.current, [
          `animate__fadeInRight`,
          `animate__fadeInLeft`,
        ])
      }
    }
  }, [quizState])

  useEffect(() => {
    if (!isStepIntro && !isLastPage) {
      setQuizNo(1)
    }
  }, [isLastPage])

  // 로딩
  if (!quizData) return <>Loading...</>

  /**
   * 퀴즈 번호 변경
   * @param value 퀴즈 번호
   */
  const changeQuizNo = (value: number) => {
    stopAudio()

    if (value < 1) {
      if (isLastPage) setQuizNo(Object.keys(quizData.Quiz).length)
    } else if (value > Object.keys(quizData.Quiz).length) {
      setQuizNo(1)
    } else {
      setQuizNo(value)
    }
  }

  // 오디오 재생 - 단어
  const playWord = () => {
    if (playState === 'playing') {
      stopAudio()
    } else {
      playAudio(quizData.Quiz[quizNo - 1].Question.Sound)
    }
  }

  /**
   * 헤더 메뉴 클릭하는 기능
   */
  const changeSideMenu = (state: boolean) => {
    setSideOpen(state)
  }
  /**
   * 단어 학습으로
   */
  const goTest = () => {
    stopAudio()
    props.changeVocaState(false)
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
            comment={'카드를 넘기면서 단어를 학습하세요.'}
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
              typeCSS={style.vocabularyPractice4}
              containerCSS={style.container}
            >
              <WrapperCard
                playState={playState}
                quizData={quizData}
                quizNo={quizNo}
                playWord={playWord}
              />

              <Indicator
                isLastPage={isLastPage}
                quizNo={quizNo}
                totalQuizCnt={quizData.Quiz.length}
                changeQuizNo={changeQuizNo}
              />

              <>{isLastPage && <BtnNext goTest={goTest} />}</>
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
