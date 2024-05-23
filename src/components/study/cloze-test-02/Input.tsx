import clozeTestCSS from '@stylesheets/cloze-test.module.scss'
import clozeTestCSSMobile from '@stylesheets/mobile/cloze-test.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { QuizState } from '@hooks/study/useQuiz'

import { useEffect, useRef, useState } from 'react'
import TextHelper from './TextHelper'
import CurrentTextHelper from './CurrentTextHelper'

type InputValue = {
  text: string
  isCorrected: boolean
}

type InputProps = {
  inputRefs: React.MutableRefObject<HTMLInputElement[]>
  quizState: QuizState
  inputIndex: number
  currentIndex: number
  inputValues: InputValue[]
  correctText: string
  changeInputValue: (index: number, newValue: string) => void
  checkAnswer: () => void
  changeInputIndex: (index: number) => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? clozeTestCSSMobile : clozeTestCSS

export default function Input({
  inputRefs,
  quizState,
  inputIndex,
  currentIndex,
  inputValues,
  correctText,
  changeInputValue,
  checkAnswer,
  changeInputIndex,
}: InputProps) {
  const [currentInputWidth, setCurrentInputWIdth] = useState(0)
  const [inputWidth, setInputWIdth] = useState(0)

  /**
   * 키다운 이벤트
   * @param e input
   */
  const onKeydownHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (quizState !== 'studying') e.preventDefault()

    if (e.key === 'Tab' || (e.altKey && e.key === 'Tab')) {
      // 탭을 누르거나 알트 + 탭을 누른 경우 이벤트 제거 및 포커싱
      e.preventDefault()
      inputRefs?.current[currentIndex].focus()
    }
  }

  /**
   * 키보드 입력 이벤트
   * @param e input
   */
  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()

    // 유효성 검사
    // 영어랑 마침표만 허용 - 추가될 수 있음
    const regex = /^[a-zA-Z-' ]+(?:'){0,1}[a-zA-Z]?$/g
    let text: string = e.currentTarget.value

    if (!regex.test(text)) {
      text = text.slice(0, text.length - 1)
    }

    changeInputValue(currentIndex, text)
  }

  /**
   * 키보드 입력 이벤트
   * @param e input
   * @param index index
   */
  const onKeyUpHandler = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    const text = e.currentTarget.value

    if (e.key === 'Enter' && text !== '') {
      // 유저가 엔터를 친 경우는 오답
      const lastInputIndex = getLastInputIndex(inputRefs, index)

      if (lastInputIndex === -1) {
        // 마지막 input인 경우
        checkAnswer()
      } else {
        // 마지막 input이 아닌 경우
        const nextInputIndex = getNextInputIndex(inputRefs, index)

        changeInputIndex(nextInputIndex)
      }
    } else {
      if (text === correctText) {
        const lastInputIndex = getLastInputIndex(inputRefs, index)

        if (lastInputIndex === -1) {
          // 마지막 input인 경우
          changeInputIndex(-1)
          checkAnswer()
        } else {
          // 마지막 input이 아닌 경우
          const nextInputIndex = getNextInputIndex(inputRefs, index)

          changeInputIndex(nextInputIndex)
        }
      }
    }
  }

  /**
   * 다음 input이 존재하는지 확인
   * @param inputRefs input
   * @param currentInputIndex 현재 Input index
   * @returns 다음 input의 index
   */
  const getNextInputIndex = (
    inputRefs: React.MutableRefObject<HTMLInputElement[]>,
    currentInputIndex: number,
  ): number => {
    const nextInputIndex = inputRefs?.current.findIndex(
      (input, index) =>
        !inputValues[index].isCorrected && index > currentInputIndex,
    )

    return nextInputIndex
  }

  /**
   * 마지막 input index 구하기
   * @param inputRefs input
   * @param currentInputIndex 현재 input index
   * @returns 마지막 input index
   */
  const getLastInputIndex = (
    inputRefs: React.MutableRefObject<HTMLInputElement[]>,
    currentInputIndex: number,
  ): number => {
    const nextInputIndex = inputRefs?.current.findLastIndex(
      (input: HTMLInputElement, index: number) =>
        !inputValues[index].isCorrected && index > currentInputIndex,
    )

    return nextInputIndex
  }

  const changeInputWidth = (width: number) => {
    setInputWIdth(width)
  }

  const changeCurrentInputWidth = (width: number) => {
    setCurrentInputWIdth(width)
  }

  return (
    <span
      className={`${style.answerBox} ${
        currentIndex === inputIndex ? style.currentOrder : ''
      }`}
    >
      {currentIndex === inputIndex ? (
        <>
          {/* 풀어야하는 인풋인 경우 */}
          <span className={style.currentInput}>
            <input
              ref={(el: HTMLInputElement) =>
                (inputRefs.current[inputIndex] = el)
              }
              id="textFild"
              style={{
                width: `${currentInputWidth + 4}px`,
              }}
              type="text"
              value={inputValues[currentIndex].text}
              onKeyDown={(e) => onKeydownHandler(e)}
              onChange={(e) => onChangeHandler(e)}
              onKeyUp={(e) => onKeyUpHandler(e, currentIndex)}
              onCopy={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              inputMode="search"
              autoFocus
              tabIndex={-1}
            />
            {currentInputWidth <= 0 && (
              <CurrentTextHelper
                correctText={correctText}
                changeCurrentInputWidth={changeCurrentInputWidth}
              />
            )}
          </span>
        </>
      ) : (
        <>
          {/* 풀어야하는 인풋이 아닌 경우 */}
          <span className={style.otherInput}>
            <input
              ref={(el: HTMLInputElement) =>
                (inputRefs.current[inputIndex] = el)
              }
              style={{
                width: `${inputWidth + 4}px`,
              }}
              value={inputValues[inputIndex].text}
              disabled
            />
          </span>
          {inputWidth <= 0 && (
            <TextHelper
              correctText={correctText}
              changeInputWidth={changeInputWidth}
            />
          )}
        </>
      )}
    </span>
  )
}
