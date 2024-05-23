import { useState } from 'react'

import vocabularyCSS from '@stylesheets/vocabulary-test.module.scss'
import vocabularyCSSMobile from '@stylesheets/mobile/vocabulary-test.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type TextPenaltyProps = {
  inputRefs: React.MutableRefObject<HTMLInputElement[]>
  correctAnswer: string
  inputIndex: number
  currentInputIndex: number
  changeInputIndex: (index: number) => void
  playPenalty: (cb: any) => void
  changeNextButton: () => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? vocabularyCSSMobile : vocabularyCSS

export default function TextPenalty({
  inputRefs,
  correctAnswer,
  inputIndex,
  currentInputIndex,
  changeInputIndex,
  playPenalty,
  changeNextButton,
}: TextPenaltyProps) {
  const [inputVal, setInputVal] = useState<string>('')

  /**
   * 키보드 타이핑 이벤트
   * @param e
   */
  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()

    const regex = /^[ㄱ-ㅎa-zA-Z-' ]+(?:'){0,1}[a-zA-Z]?$/g
    let text: string = e.currentTarget.value

    if (!regex.test(text)) {
      text = text.slice(0, text.length - 1)
    }

    if (text === correctAnswer) {
      setInputVal(text)
      changeInputIndex(currentInputIndex + 1)

      if (currentInputIndex + 1 > 2) {
        const cbAfterPlayPenalty = () => {
          changeNextButton()
        }

        playPenalty(cbAfterPlayPenalty)
      }
    } else {
      setInputVal(text)
    }
  }

  return (
    <>
      {/* input이 현재 input index보다 크면 */}
      {inputIndex > currentInputIndex && (
        <span
          className={`${style.reviewAnswer} ${
            inputIndex === currentInputIndex ? style.currentOrder : ''
          }`}
        >
          <span className={style.otherInput}>
            <input disabled />
          </span>
          <div className={style.hintText}>{correctAnswer}</div>
        </span>
      )}

      {/* input이 현재 input index와 같으면 */}
      {inputIndex === currentInputIndex && (
        <span
          className={`${style.reviewAnswer} ${
            inputIndex === currentInputIndex ? style.currentOrder : ''
          }`}
        >
          <span className={style.currentInput}>
            <input
              ref={(el: HTMLInputElement) =>
                (inputRefs.current[inputIndex] = el)
              }
              type="text"
              value={inputVal}
              onChange={(e) => onChangeHandler(e)}
              onCopy={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              inputMode="search"
              tabIndex={-1}
            />
          </span>
          <div className={style.hintText}>{correctAnswer}</div>
        </span>
      )}

      {/* input이 현재 input index보다 작으면 */}
      {inputIndex < currentInputIndex && (
        <span
          className={`${style.reviewAnswer} ${style.correctAnswer} animate__animated animate__flipInX`}
        >
          {correctAnswer}
        </span>
      )}
    </>
  )
}
