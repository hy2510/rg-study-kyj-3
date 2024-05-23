import { ReactElement, useContext, useEffect } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'

import QuizContainer from './QuizContainer'
import StoryContainer from './StoryContainer'
import SpeakContainer from './SpeakContainer'

const EBookContainer: React.FC<{}> = () => {
  const { studyInfo, handler } = useContext(AppContext) as AppContextProps

  useEffect(() => {
    console.log(handler.viewStudy)
  }, [handler.viewStudy])

  // 컴포넌트 생성
  let component: ReactElement

  switch (handler.viewStudy) {
    case 'story':
      component = <StoryContainer />
      break

    case 'speaking':
      component = <SpeakContainer />
      break

    case 'quiz':
      component = <QuizContainer />
      break

    default:
      component = <StoryContainer />
  }

  return component
}
export default EBookContainer
