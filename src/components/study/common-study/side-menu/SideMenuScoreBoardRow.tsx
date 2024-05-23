import { ReactNode } from 'react'

import sideMenuCSS from '@stylesheets/side-menu.module.scss'

import iconScoreItemCorrect from '@assets/images/icons/icon_score_item_correct.svg'
import iconScoreItemIncorrect from '@assets/images/icons/icon_score_item_incorrect.svg'

import { IScoreBoardData } from '@interfaces/Common'

type SideMenuScoreBoardRowProps = {
  quizLength: number
  maxAnswerCount: number
  scoreBoardData: IScoreBoardData[]
}

type SideColProps = {
  maxAnswerCount: number
  scoreBoardData: IScoreBoardData
}

const SideCol = ({ maxAnswerCount, scoreBoardData }: SideColProps): any => {
  let colArr: ReactNode[] = []

  if (scoreBoardData) {
    for (let i = 1; i <= maxAnswerCount; i++) {
      if (i < scoreBoardData.answerCount) {
        colArr.push(
          <div className={`${sideMenuCSS.score_col}`}>
            <img src={iconScoreItemIncorrect} alt="" />
          </div>,
        )
      } else if (i === scoreBoardData.answerCount) {
        if (scoreBoardData.ox) {
          colArr.push(
            <div className={`${sideMenuCSS.score_col}`}>
              <img src={iconScoreItemCorrect} alt="" />
            </div>,
          )
        } else {
          colArr.push(
            <div className={`${sideMenuCSS.score_col}`}>
              <img src={iconScoreItemIncorrect} alt="" />
            </div>,
          )
        }
      } else {
        colArr.push(<div className={`${sideMenuCSS.score_col}`}></div>)
      }
    }
    return colArr
  } else {
    for (let i = 0; i < maxAnswerCount; i++) {
      colArr.push(<div className={`${sideMenuCSS.score_col}`}></div>)
    }
    return colArr
  }
}

export default function SideMenuScoreBoardRow({
  quizLength,
  maxAnswerCount,
  scoreBoardData,
}: SideMenuScoreBoardRowProps) {
  let rowArr: ReactNode[] = []

  for (let i = 0; i < quizLength; i++) {
    rowArr.push(
      <div key={`smsbr-${i}`} className={`${sideMenuCSS.score_row}`}>
        <div className={`${sideMenuCSS.score_col}`}>{i + 1}</div>
        <SideCol
          maxAnswerCount={maxAnswerCount}
          scoreBoardData={scoreBoardData[i]}
        />
      </div>,
    )
  }

  return <>{rowArr}</>
}
