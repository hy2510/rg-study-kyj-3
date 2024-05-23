import { useEffect, useState } from 'react'

import vocabularyCSS from '@stylesheets/vocabulary-practice.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-practice.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

// Types [
import { IStudyData } from '@interfaces/Common'
import { getVocabularyPractice1 } from '@services/quiz/VocabularyAPI'
// ] Types

// utils & hooks
import useStepIntro from '@hooks/common/useStepIntro'
import { useQuizTimer } from '@hooks/study/useQuizTimer'
import { useFetch } from '@hooks/study/useFetch'
import { useStudentAnswer } from '@hooks/study/useStudentAnswer'
import useStudyAudio from '@hooks/study/useStudyAudio'

// components - common
import StepIntro from '@components/study/common-study/StepIntro'
import QuizHeader from '@components/study/common-study/QuizHeader'
import QuizBody from '@components/study/common-study/QuizBody'
import Container from '@components/study/common-study/Container'
import StudySideMenu from '@components/study/common-study/StudySideMenu'

// components - vocalbulary practice 1
import CardWord from '@components/study/vocabulary-practice-01/CardWord'
import Indicator from '@components/study/vocabulary-practice-01/Indicator'
import BtnNext from '@components/study/vocabulary-practice-01/BtnNext'

const STEP_TYPE = 'Vocabulary Practice'

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

export default function VocabularyPractice1(props: IStudyData) {
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

  // 퀴즈 데이터 세팅
  const { scoreBoardData } = useStudentAnswer()
  const [quizData, recordedData] = useFetch(getVocabularyPractice1, props, STEP) // 퀴즈 데이터 / 저장된 데이터
  const [quizNo, setQuizNo] = useState<number>(1) // 퀴즈 번호

  // 마지막 장까지 봤는지
  const [isLastPage, setIsLastPage] = useState(false)

  // audio
  const { playState, playAudio, stopAudio } = useStudyAudio()

  // 인트로가 없어지면
  useEffect(() => {
    if (!isStepIntro && quizData) {
      timer.setup(quizData.QuizTime, true)
      playWord()
    }
  }, [isStepIntro])

  // 퀴즈 번호가 변경되면
  useEffect(() => {
    if (!isStepIntro && quizData) {
      stopAudio()

      if (quizNo === quizData.Quiz.length) {
        setIsLastPage(true)
      }

      playWord()
    }
  }, [quizNo])

  // 플레이어 상태가 변하면
  useEffect(() => {
    if (
      quizData &&
      playState === '' &&
      quizNo === Object.keys(quizData.Quiz).length
    ) {
      setIsLastPage(true)
    }
  }, [playState])

  useEffect(() => {
    if (!isStepIntro && !isLastPage) {
      setQuizNo(1)
    }
  }, [isLastPage])

  if (!quizData) return <div>Loading...</div>

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
              typeCSS={style.vocabularyPractice1}
              containerCSS={style.container}
            >
              <CardWord
                playState={playState}
                cardInfo={quizData.Quiz[quizNo - 1]}
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
