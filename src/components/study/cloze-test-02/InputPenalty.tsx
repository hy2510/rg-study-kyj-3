import { useEffect, useRef, useState } from 'react'

import clozeTestCSS from '@stylesheets/cloze-test.module.scss'
import clozeTestCSSMobile from '@stylesheets/mobile/cloze-test.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type InputPenaltyProps = {
  inputRefs: React.MutableRefObject<HTMLInputElement[]>
  penaltyState: 'penalty' | 'success'
  inputIndex: number
  currentIndex: number
  correctText: string
  changePenaltyState: (state: 'none' | 'penalty' | 'success') => void
  changeInputIndex: (index: number) => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? clozeTestCSSMobile : clozeTestCSS

export default function InputPenalty({
  inputRefs,
  penaltyState,
  inputIndex,
  currentIndex,
  correctText,
  changeInputIndex,
  changePenaltyState,
}: InputPenaltyProps) {
  const [value, setValue] = useState<string>('')
  const [currentInputWidth, setCurrentInputWidth] = useState<number>(0)
  const [inputWidth, setInputWidth] = useState<number>(0)
  const currenHintRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)

  /**
   * 키다운 이벤트
   * @param e input
   */
  const onKeydownHandler = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (penaltyState !== 'penalty') e.preventDefault()

    if (e.key === 'Tab' || (e.altKey && e.key === 'Tab')) {
      // 탭을 누르거나 알트 + 탭을 누른 경우 이벤트 제거 및 포커싱
      e.preventDefault()
      inputRefs.current[currentIndex].focus()
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
    const regex = /^[ㄱ-ㅎa-zA-Z-' ]+(?:'){0,1}[a-zA-Z]?$/g
    let text: string = e.currentTarget.value

    if (!regex.test(text)) {
      text = text.slice(0, text.length - 1)
    }

    setValue(text)
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

    if (text === correctText) {
      const lastInputIndex = getLastInputIndex(inputRefs, index)

      if (lastInputIndex === -1) {
        // 마지막 input인 경우
        changeInputIndex(-1)
        changePenaltyState('success')
      } else {
        // 마지막 input이 아닌 경우
        const nextInputIndex = getNextInputIndex(inputRefs, index)
        changeInputIndex(nextInputIndex)
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
    const nextInputIndex = inputRefs.current.findIndex(
      (input, index) => input?.value === '' || index > currentInputIndex,
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
    const nextInputIndex = inputRefs.current.findLastIndex(
      (input: HTMLInputElement, index: number) => index > currentInputIndex,
    )

    return nextInputIndex
  }

  useEffect(() => {
    if (currenHintRef.current && currenHintRef.current.offsetWidth > 0) {
      setCurrentInputWidth(currenHintRef.current.offsetWidth)
    }

    if (hintRef.current && hintRef.current.offsetWidth > 0) {
      setInputWidth(hintRef.current.offsetWidth)
    }
  })

  return (
    <span
      className={`${style.reviewAnswer} ${
        currentIndex === inputIndex ? style.currentOrder : ''
      }`}
    >
      {currentIndex === inputIndex ? (
        <span>
          <span className={style.currentInput}>
            <input
              ref={(el: HTMLInputElement) =>
                (inputRefs.current[inputIndex] = el)
              }
              id="textFild"
              style={{ width: `${currentInputWidth + 4}px` }}
              type="text"
              value={value}
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
          </span>

          <div ref={currenHintRef} className={style.hintText}>
            {correctText}
          </div>
        </span>
      ) : (
        <>
          {value === correctText || penaltyState === 'success' ? (
            <span style={{ color: '#289EE4' }}>{correctText}</span>
          ) : (
            <>
              <span className={style.otherInput}>
                <input
                  ref={(el: HTMLInputElement) =>
                    (inputRefs.current[inputIndex] = el)
                  }
                  style={{ width: `${inputWidth + 4}px` }}
                  disabled
                />
              </span>
              <div ref={hintRef} className={style.hintText}>
                {correctText}
              </div>
            </>
          )}
        </>
      )}
    </span>
  )
}
