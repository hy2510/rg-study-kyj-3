import { useEffect, useState } from 'react'
import { IRecordAnswerType, IStudyData } from '@interfaces/Common'

import { loadRecordedData } from '@services/studyApi'

const useFetch = <T>(
  getData: (study: IStudyData) => Promise<T>,
  props: IStudyData,
  step: number | string,
  isReTestYn?: boolean,
): [T | undefined, IRecordAnswerType[]] => {
  const [quizData, setQuizData] = useState<T>()
  const [recordedData, setRecordedData] = useState<IRecordAnswerType[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const data = await getData(props)

      if (!data) throw new Error('No StudyData Error')

      let recordData

      if (isReTestYn) {
        recordData = await loadRecordedData('R', props)
      } else {
        recordData = await loadRecordedData(step, props)
      }

      setQuizData(data)
      setRecordedData(recordData)
    }

    fetchData()
  }, [getData])

  return [quizData, recordedData]
}

export { useFetch }
