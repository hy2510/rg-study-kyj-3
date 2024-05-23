import { useEffect, useRef, useState } from 'react'
import useInterval from './useInterval'

export interface QuizTimer {
  time: {
    timeMin: number
    timeSec: number
  }
  setup: (time: number, isAutoStart?: boolean) => void
  start: () => void
  stop: () => void
  isFinish: boolean
}
export function useQuizTimer(cb?: () => void): QuizTimer {
  /// Timeout Callback
  const timeoutCallback = useRef<() => void>()

  /// Timer 관련 기능
  const [baseTime, setBaseTime] = useState(-1)
  const [currentTime, setCurrentTime] = useState(-1)
  const [startedDateTime, setStartedDateTime] = useState(0)
  const [isTimeHold, setTimeHold] = useState(true)
  const [quizTimeInfo, setQuizTimeInfo] = useState<{
    timeMin: number
    timeSec: number
  }>({ timeMin: 0, timeSec: 0 })

  const onTimerStart = () => {
    setStartedDateTime(Date.now())
    setTimeHold(false)
  }
  const onTimerStop = () => {
    setBaseTime(currentTime)
    setTimeHold(true)
  }
  const onTimerReset = (time: number, isAutoStart?: boolean) => {
    const timeSec = time % 60
    const timeMin = (time - timeSec) / 60
    setQuizTimeInfo({ timeMin, timeSec })
    setBaseTime(time)
    if (isAutoStart) {
      onTimerStart()
    } else {
      setTimeHold(true)
    }
  }

  useEffect(() => {
    timeoutCallback.current = cb
  }, [cb])

  useInterval(() => {
    if (!isTimeHold) {
      const delta = Math.floor((Date.now() - startedDateTime) / 1000)
      const time = baseTime - delta

      const timeSec = time >= 0 ? time % 60 : 0
      const timeMin = time >= 0 ? (time - timeSec) / 60 : 0
      if (time <= 0) {
        onTimerStop()
        timeoutCallback.current && timeoutCallback.current()
      }
      setQuizTimeInfo({ timeMin, timeSec })
      setCurrentTime(time)
    }
  }, 1000)

  return {
    time: quizTimeInfo,
    setup: onTimerReset,
    start: onTimerStart,
    stop: onTimerStop,
    isFinish: quizTimeInfo.timeMin + quizTimeInfo.timeSec <= 0,
  }
}
