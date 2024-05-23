import { ReactElement, useContext, useState } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'

import QuizContainer from './QuizContainer'
import PopupPBookRating from '@components/story/PopupPBookRating'

const PBookContainer: React.FC<{}> = (s) => {
  const { studyInfo, handler } = useContext(AppContext) as AppContextProps

  // 당일 재학습 불가
  const onStartQuizFailed = () => {
    if (studyInfo.availableQuizStatus === 1) {
      alert('ReTest 정책으로 당일 재학습 불가')
      //TODO - 학습 종료
    } else if (studyInfo.availableQuizStatus === 2) {
      alert('일일 획득 가능 포인트 초과')
      //TODO - 학습 종료
    }
  }

  // 컴포넌트 생성
  let component: ReactElement

  if (handler.isPreference) {
    component = <QuizContainer />
  } else {
    component = <PopupPBookRating />
  }

  return component
}
export default PBookContainer
