import { useEffect, useRef } from 'react'

import vocabularyCSS from '@stylesheets/vocabulary-test.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-test.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { QuizState } from '@hooks/study/useQuiz'
import { BottomPopupStateProps } from '@hooks/study/useBottomPopup'

type InputProps = {
  quizState: QuizState
  bottomPopupState: BottomPopupStateProps
  isSideOpen: boolean
  isHint: boolean
  inputVal: string
  correctAnswer: string
  changeInputVal: (value: string) => void
  checkAnswer: (isCorrect: boolean, selectedAnswer: string) => Promise<void>
}

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

export default function Input({
  quizState,
  bottomPopupState,
  isSideOpen,
  isHint,
  inputVal,
  correctAnswer,
  changeInputVal,
  checkAnswer,
}: InputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onClickHandler = () => {
      if (inputRef.current) {
        if (isSideOpen || isHint) {
          inputRef.current.blur()
        } else {
          inputRef.current.focus()
        }
      }
    }

    onClickHandler()

    window.addEventListener('click', onClickHandler)

    return () => {
      window.removeEventListener('click', onClickHandler)
    }
  }, [isSideOpen, isHint])

  /**
   * 키보드 타이핑 이벤트
   * @param e
   */
  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (quizState === 'studying') {
      e.preventDefault()

      const regex = /^[ㄱ-ㅎa-zA-Z-' ]+(?:'){0,1}[a-zA-Z]?$/g
      let text: string = e.currentTarget.value

      if (!regex.test(text)) {
        text = text.slice(0, text.length - 1)
      }

      if (text === correctAnswer) {
        checkAnswer(true, text)
      } else {
        changeInputVal(text)
      }
    }
  }

  /**
   * 키보드 타이핑 이벤트
   * @param e
   */
  const onKeyUpHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && quizState === 'studying' && inputVal !== '') {
      checkAnswer(false, inputVal)
    }
  }

  return (
    <div
      className={`${style.textField} animate__animated} ${
        bottomPopupState.isActive && !bottomPopupState.isCorrect
          ? `animate__headShake ${style.incorrect}`
          : ''
      }`}
    >
      {bottomPopupState.isActive && bottomPopupState.isCorrect ? (
        <div
          className={`${style.correctAnswer} animate__animated animate__flipInX`}
        >
          {correctAnswer}
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            className={style.inputField}
            type="text"
            value={inputVal}
            onChange={(e) => onChangeHandler(e)}
            onKeyUp={(e) => onKeyUpHandler(e)}
            onCopy={(e) => e.preventDefault()}
            onPaste={(e) => e.preventDefault()}
            tabIndex={-1}
            autoFocus
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            inputMode="search"
          />
          <div className={style.wordText}></div>
        </>
      )}
    </div>
  )
}
