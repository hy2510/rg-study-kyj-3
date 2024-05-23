import { useContext, useEffect, useState } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'

import '@stylesheets/fonts/font.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

const isMobile = useDeviceDetection()

export default function SpeakContainer() {
  const { handler, studyInfo, bookInfo } = useContext(
    AppContext,
  ) as AppContextProps

  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [windowHeight, setWindowHeight] = useState(window.innerHeight)

  // 창 크기가 변경되거나 가로/세로가 변경되는 등의 행위가 일어나면
  useEffect(() => {
    const resizeHandler = () => {
      setWindowWidth(window.innerWidth)
      setWindowHeight(window.innerHeight)
    }

    resizeHandler()

    // resize시 넓이 / 높이 조절
    window.addEventListener('resize', resizeHandler)

    return () => {
      window.removeEventListener('resize', resizeHandler)
    }
  }, [isMobile, windowHeight])

  // 디폴트 화면
  return (
    <iframe
      src={`./static/speak/index.html?studyId=${studyInfo.studyId}&studentHistoryId=${studyInfo.studentHistoryId}&token=${studyInfo.token}&isMobile=${isMobile}&bookLevel=${bookInfo.BookLevel}&isDev=${studyInfo.isDev}`}
      style={{ border: 'none', width: windowWidth, height: windowHeight }}
      sandbox="allow-scripts allow-same-origin allow-popups allow-modals"
    ></iframe>
  )
}
