import { useContext } from 'react'

import sideMenuCSS from '@stylesheets/side-menu.module.scss'

import { AppContext, AppContextProps } from '@contexts/AppContext'

type SideMenuScoreBoardStepInfoProps = {
  currentStep: number | string
}

export default function SideMenuScoreBoardStepInfo({
  currentStep,
}: SideMenuScoreBoardStepInfoProps) {
  const { studyInfo } = useContext(AppContext) as AppContextProps

  return (
    <>
      {studyInfo.allSteps.map((step, i) => {
        return (
          <div
            key={`step-header-${i}`}
            className={`${sideMenuCSS.step} ${
              currentStep === step ? sideMenuCSS.on : ''
            }`}
          >
            {currentStep === step ? 'Step' : ''}
            {step}
          </div>
        )
      })}
    </>
  )
}
