import sideMenuCSS from '@stylesheets/side-menu.module.scss'

import { IScoreBoardData } from '@interfaces/Common'

import SideMenuScoreBoardStepInfo from './SideMenuScoreBoardStepInfo'
import SideMenuScoreBoardHeader from './SideMenuScoreBoardHeader'
import SideMenuScoreBoardRow from './SideMenuScoreBoardRow'

type SideMenuScoreBoardProps = {
  currentStep: number | string
  currentStepType: string
  quizLength: number
  maxAnswerCount: number
  scoreBoardData: IScoreBoardData[]
}

export default function SideMenuScoreBoard({
  currentStep,
  currentStepType,
  quizLength,
  maxAnswerCount,
  scoreBoardData,
}: SideMenuScoreBoardProps) {
  return (
    <div className={sideMenuCSS.study_side_menu_quiz_scoreboard}>
      <div className={sideMenuCSS.step_info}>
        <SideMenuScoreBoardStepInfo currentStep={currentStep} />
      </div>

      <div className={sideMenuCSS.score_info}>
        <div className={sideMenuCSS.quiz_type}>{currentStepType}</div>
        {currentStepType !== 'Vocabulary Practice' && (
          <>
            <SideMenuScoreBoardHeader maxAnswerCount={maxAnswerCount} />

            <div>
              <SideMenuScoreBoardRow
                quizLength={quizLength}
                maxAnswerCount={maxAnswerCount}
                scoreBoardData={scoreBoardData}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
