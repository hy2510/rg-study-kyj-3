import React, { Suspense } from 'react'

import AppContextProvider from '@contexts/AppContext'
// 스타일
import './stylesheets/App.scss'
import 'animate.css'

export default function App() {
  const StudyContainer = React.lazy(
    () => import('@pages/containers/StudyContainer'),
  )
  return (
    <AppContextProvider>
      <Suspense fallback={<div></div>}>
        <StudyContainer />
      </Suspense>
    </AppContextProvider>
  )
}
