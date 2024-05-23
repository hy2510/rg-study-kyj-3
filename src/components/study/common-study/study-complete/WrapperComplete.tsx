import { useContext, useEffect, useState } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'
import REFJSON from '@assets/sample-data/ref.json'

import { getBookInfo } from '@services/studyApi'

import CompleteSuccess from './CompleteSuccess'
import CompleteFail from './CompleteFail'

export default function WrapperComplete() {
  const { studyInfo } = useContext(AppContext) as AppContextProps
  const [average, setAverage] = useState(0)

  useEffect(() => {
    if (window) {
      if (import.meta.env.MODE === 'development') {
        ;(window as any).REF = { ...REFJSON }
      }

      const REF = (window as any).REF

      const getAverage = async () => {
        const result = await getBookInfo(
          studyInfo.studyId,
          studyInfo.studentHistoryId,
          REF.LevelRoundId,
        )

        if (typeof result.Average === 'number') {
          setAverage(result.Average)
        } else {
          setAverage(0)
        }
      }

      getAverage()
    }
  }, [])

  return (
    <>
      {average < 70 ? (
        <CompleteFail average={average} />
      ) : (
        <CompleteSuccess average={average} />
      )}
    </>
  )
}
