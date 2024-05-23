import { ReactNode } from 'react'

import testResultCSS from '@stylesheets/test-result.module.scss'
import testResultCSSMobile from '@stylesheets/mobile/test-result.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

type TableHeaderProps = {
  quizAnswerCount: number
}

const isMobile = useDeviceDetection()

const style = isMobile ? testResultCSSMobile : testResultCSS

export default function TableHeader({ quizAnswerCount }: TableHeaderProps) {
  const unit = ['1st', '2nd', '3rd', 'th']
  let headerArr: ReactNode[] = []

  for (let i = 0; i < quizAnswerCount; i++) {
    headerArr.push(<div key={`col-header-test-result-${i}`}>{unit[i]}</div>)
  }

  return (
    <div
      className={`${style.row} ${
        quizAnswerCount === 3
          ? style.count3
          : quizAnswerCount === 1
          ? style.count1
          : ''
      }`}
    >
      <div>Q</div>
      {headerArr}
    </div>
  )
}
