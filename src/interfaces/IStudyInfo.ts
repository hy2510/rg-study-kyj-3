import { BookType, Mode } from './Types'

interface IStudyInfo {
  allSteps: number[]
  availableQuizStatus: 0 | 1 | 2
  isAvailableSpeaking: boolean
  isListenAndRepeat: boolean
  isSubmitPreference: boolean
  mappedStepActivity: string[]
  openSteps: number[]
  startStep: number
  isReTestYn?: boolean

  studyId: string
  studentHistoryId: string
  bookType: BookType
  mode: Mode
  isStartSpeak: boolean
  isSuper: boolean
  isReview: boolean
  isQuizLearning: boolean
  isPassedVocabularyPractice: boolean

  token: string
  isDev: boolean
}

export type { IStudyInfo }
