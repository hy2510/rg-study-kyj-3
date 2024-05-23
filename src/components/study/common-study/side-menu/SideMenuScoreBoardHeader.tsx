import { ReactNode } from 'react'

import sideMenuCSS from '@stylesheets/side-menu.module.scss'

type SideMenuScoreBoardHeaderProps = {
  maxAnswerCount: number
}

export default function SideMenuScoreBoardHeader({
  maxAnswerCount,
}: SideMenuScoreBoardHeaderProps) {
  const unit = ['1st', '2nd', '3rd', 'th']
  let headerArr: ReactNode[] = []

  for (let i = 0; i < maxAnswerCount; i++) {
    headerArr.push(
      <div
        key={`col-header-side-menu-${i}`}
        className={`${sideMenuCSS.score_col}`}
      >
        {unit[i]}
      </div>,
    )
  }

  return (
    <div className={`${sideMenuCSS.score_row} ${sideMenuCSS.header}`}>
      <div className={`${sideMenuCSS.score_col}`}>Q</div>
      {headerArr}
    </div>
  )
}
