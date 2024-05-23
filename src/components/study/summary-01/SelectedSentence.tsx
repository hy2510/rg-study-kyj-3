import summaryCSS from '@stylesheets/summary.module.scss'
import summaryCSSMobile from '@stylesheets/mobile/summary.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import { ISummary1Quiz } from '@interfaces/ISummary'
import { IScoreBoardData } from '@interfaces/Common'
import { MultiPlayStateProps } from '@pages/study/Summary1'

type WrapperSentenceTopProps = {
  multiPlayState: MultiPlayStateProps
  index: number
  sentenceData: ISummary1Quiz
  selectedData: IScoreBoardData
  playSentence: (index: number) => void
}

const isMobile = useDeviceDetection()

const style = isMobile ? summaryCSSMobile : summaryCSS

export default function SelectedSentence({
  multiPlayState,
  index,
  sentenceData,
  selectedData,
  playSentence,
}: WrapperSentenceTopProps) {
  return (
    <div className={`${style.correctTextCard}`}>
      {selectedData.ox ? (
        <>
          {/* 정답인 경우 */}
          <div className={style.correctAnswer}>
            <span className={style.playIcon}></span>
            <span
              onClick={() => playSentence(index)}
              className={`${
                multiPlayState.playState === 'playing' &&
                multiPlayState.seq === index
                  ? style.highlight
                  : ''
              }`}
            >
              {sentenceData.Question.Text}
            </span>
          </div>
        </>
      ) : (
        <>
          {/* 오답인 경우 */}
          {selectedData.answerCount === selectedData.maxCount ? (
            <div className={style.incorrectAnswer}>
              <span className={style.playIcon}></span>
              <span
                onClick={() => playSentence(index)}
                className={`sentence ${
                  multiPlayState.playState === 'playing' &&
                  multiPlayState.seq === index
                    ? style.highlight
                    : ''
                }`}
                dangerouslySetInnerHTML={{ __html: sentenceData.Question.Text }}
              ></span>
            </div>
          ) : (
            <>{/* 기회는 사용했으나 전부 소진하지 않은 경우 */}</>
          )}
        </>
      )}
    </div>
  )
}
