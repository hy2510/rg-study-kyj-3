import React, { useEffect, useState } from 'react'
import { BookType, Mode } from '@interfaces/Types'
import { IStudyInfo } from '@interfaces/IStudyInfo'
import { BookInfo } from '@interfaces/IBookInfo'

import REFJSON from '@assets/sample-data/ref.json'
import { getStudyInfo, getBookInfo } from '@services/studyApi'

interface AppContextDataProps {
  studyInfo: IStudyInfo
  bookInfo: BookInfo
}

export interface AppContextProps extends AppContextDataProps {
  handler: {
    viewStudy: 'story' | 'speaking' | 'quiz'
    changeView: (view: 'story' | 'speaking' | 'quiz') => void
    finishStudy: { id: number; cause: string | undefined }
    actionFinishStudy: (
      finishStudyInfo: { id: number; cause: string | undefined },
      character: string,
    ) => void
    clearFinishStudyState: () => void
    isShowBookInfo: boolean
    setShowBookInfo: (isShow: boolean) => void
    isPreference: boolean
    isReadingComplete: boolean
    changeReadingComplete: () => void
    storyMode: 'Story' | 'ListenAndRepeat'
    changeStoryMode: (mode: 'Story' | 'ListenAndRepeat') => void
    isReTest: boolean
    changeReTest: (state: boolean) => void
  }
}

export const AppContext = React.createContext<AppContextProps | undefined>(
  undefined,
)

export default function AppContextProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | undefined>()
  const [contextInfo, setContextInfo] = useState<AppContextDataProps>()
  const [viewStudy, setViewStudy] = useState<'story' | 'speaking' | 'quiz'>(
    'story',
  )
  const [finishStudy, setFinishStudy] = useState<{
    id: number
    cause: string | undefined
  }>({
    id: 0,
    cause: undefined,
  })
  const [isShowBookInfo, setShowBookInfo] = useState(false)
  const [isPreference, setIsPreference] = useState(false)
  const [isReadingComplete, setReadingComplete] = useState(true)
  const [storyMode, setStoryMode] = useState<'Story' | 'ListenAndRepeat'>(
    'Story',
  )
  const [isReTest, setReTest] = useState(false)

  useEffect(() => {
    initialize()
      .then((response) => {
        setContextInfo(response)

        if (response.studyInfo.isStartSpeak) {
          // 스피킹 화면을 먼저 보여줄지
          setViewStudy('speaking')
        } else {
          // 스피킹 화면을 먼저 보여주는 상황이 아닌 경우
          if (response.studyInfo.isSubmitPreference) {
            // 별점을 이미 줬으면 퀴즈로
            setViewStudy('quiz')
            setIsPreference(true)
          } else {
            // 별점을 아직 주지 않은 경우
            if (response.bookInfo.ReadingCompletedEB === 'Y') {
              // 책을 이미 끝까지 읽은 경우
              setReadingComplete(true)
            } else {
              // 책을 이미 끝까지 읽었다면 Story모드와 다름없게 진행된다
              if (response.studyInfo.isListenAndRepeat) {
                // Listen & Repeat 모드가 활성화 된 경우
                setStoryMode('ListenAndRepeat')
              }
            }
          }
        }

        setLoading(false)
      })
      .catch((error) => {
        setError(error)
      })
  }, [])

  if (error) {
    return <div>Error: {error.message}</div>
  } else if (loading) {
    return <div>Loading ...</div>
  }

  const contextHandler = {
    viewStudy: viewStudy,
    changeView: (view: 'story' | 'speaking' | 'quiz') => {
      if (view === 'quiz') {
        contextHandler.isPreference = true
        setIsPreference(true)
      }

      setViewStudy(view)
    },
    finishStudy: { ...finishStudy },
    actionFinishStudy: (
      finishStudyInfo: { id: number; cause: string | undefined },
      character: string,
    ) => {
      try {
        window.onFinishStudyResult(
          finishStudyInfo.id,
          finishStudyInfo.cause,
          character,
        )
      } catch (e) {
        location.replace('/')
      }
    },
    clearFinishStudyState: () => {
      setFinishStudy({ id: 0, cause: undefined })
    },
    isShowBookInfo: isShowBookInfo,
    setShowBookInfo: (isShow: boolean) => {
      setShowBookInfo(isShow)
    },
    isPreference: isPreference,
    isReadingComplete: isReadingComplete,
    changeReadingComplete: () => {},
    storyMode: storyMode,
    changeStoryMode: (mode: 'Story' | 'ListenAndRepeat') => {
      setStoryMode(mode)
    },
    isReTest,
    changeReTest: (state: boolean) => {
      setReTest(state)
    },
  }

  const contextValue = {
    ...contextInfo!,
    handler: { ...contextHandler },
  }

  console.log(contextValue)
  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  )
}

function initialize(): Promise<AppContextDataProps> {
  return new Promise((resolve, reject) => {
    if (window) {
      // TODO -하드코딩: 서버에서 바인딩 해주어야 하는 항목
      if (import.meta.env.MODE === 'development') {
        ;(window as any).REF = { ...REFJSON }
      }

      const REF = (window as any).REF
      const studyId = REF.StudyId
      const studentHistoryId = REF.StudentHistoryId
      const bookType = REF.BookType as BookType
      const mode = REF.Mode as Mode
      const isStartSpeak = REF.isStartSpeak
      const levelRoundId = REF.LevelRoundId
      const token = REF.Token
      const isDev = REF.isDev === undefined ? false : true

      appContextData(
        studyId,
        studentHistoryId,
        bookType,
        mode,
        isStartSpeak,
        levelRoundId,
        token,
        isDev,
      )
        .then((response) => resolve(response))
        .catch((error) => {
          reject(new Error(error.message))
        })
    } else {
      reject(new Error('Null Data'))
    }
  })
}

async function appContextData(
  studyId: string,
  studentHistoryId: string,
  bookType: BookType,
  mode: Mode,
  isStartSpeak: boolean,
  levelRoundId: string,
  token: string,
  isDev: boolean,
): Promise<AppContextDataProps> {
  try {
    const responseStudyInfo = await requestStudyInfo(
      studyId,
      studentHistoryId,
      bookType as string,
    )

    if (responseStudyInfo) {
      const isSuper = mode === 'Super'
      const isReview = responseStudyInfo.isReview
      const isAvailableSpeaking = responseStudyInfo.isAvailableSpeaking
      const isListenAndRepeat = responseStudyInfo.isListenAndRepeat
      const isSubmitPreference = responseStudyInfo.isSubmitPreference
      const allSteps = responseStudyInfo.allSteps
      const openSteps = responseStudyInfo.openSteps
      const mappedStepActivity = responseStudyInfo.mappedStepActivity
      const isQuizLearning = responseStudyInfo.isQuizLearning
      const startStep = responseStudyInfo.startStep
      const isPassedVocabularyPractice =
        responseStudyInfo.isPassedVocabularyPractice
      const availableQuizStatus = responseStudyInfo.availableQuizStatus
      const isReTestYn = responseStudyInfo.isReTestYn

      const studyInfo = {
        studyId,
        studentHistoryId,
        bookType,
        mode,
        isSuper,
        isStartSpeak,
        isReview,
        isAvailableSpeaking,
        isListenAndRepeat,
        isSubmitPreference,
        allSteps: [...allSteps],
        openSteps: [...openSteps],
        mappedStepActivity: [...mappedStepActivity],
        isQuizLearning,
        startStep,
        isPassedVocabularyPractice,
        availableQuizStatus,
        isReTestYn,
        token,
        isDev,
      }

      const responseBookInfo = await requestBookInfo(
        studyId,
        studentHistoryId,
        levelRoundId,
      )
      const bookInfo = { ...responseBookInfo }
      return {
        studyInfo,
        bookInfo,
      }
    } else {
      throw new Error('Get Study Info Failed')
    }
  } catch (error: any) {
    throw new Error(error.message)
  }
}

/**
 * Study Info 받아오기
 * @param studyId
 * @param studentHistoryId
 * @param bookType
 * @returns
 */
async function requestStudyInfo(
  studyId: string,
  studentHistoryId: string,
  bookType: string,
) {
  const studyInfo = await getStudyInfo(studyId, studentHistoryId, bookType)

  return studyInfo
}

/**
 * Book Info 받아오기
 * @param studyId
 * @param studentHistoryId
 * @param levelRoundId
 * @returns
 */
async function requestBookInfo(
  studyId: string,
  studentHistoryId: string,
  levelRoundId: string,
) {
  const bookInfo = await getBookInfo(studyId, studentHistoryId, levelRoundId)

  return bookInfo
}
