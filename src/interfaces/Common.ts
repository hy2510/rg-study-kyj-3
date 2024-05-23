import {
  Mobile,
  BookType,
  Mode,
  StudyTypeCode,
  Theme,
  WritingActivity2SaveType,
} from './Types'

// 유저에 관련된 데이터 인터페이스
interface IUserData {
  readonly mode: Mode
  readonly studentHistoryId: string
}

// 학습에 관련된 인터페이스
interface IStudyData extends IUserData {
  readonly studyId: string
  readonly currentStep: number
  readonly bookType: BookType
  readonly studyTypeCode: StudyTypeCode
  readonly theme: Theme
  readonly lastStep: number
  isEnabledPractice: boolean
  isReTestYn: boolean | undefined
  onFinishActivity: () => void
  changeVocaState: (isOn: boolean) => void
}

// 답안지
interface IScoreBoardData {
  readonly quizNo: number
  readonly maxCount: number
  readonly answerCount: number
  readonly ox: boolean
}

// 유저 답안 정보 - 일반
interface IUserAnswer {
  readonly mobile: Mobile
  readonly bookType: BookType
  readonly studyId: string
  readonly studentHistoryId: string
  readonly step: string
  quizId: string
  quizNo: number
  currentQuizNo: number
  correct: string
  studentAnswer: string
  answerCount: number
  isEnabledPenalty?: boolean
  isLastQuiz?: boolean
  isFinishStudy?: boolean
  score?: number
}

// 유저 답안 정보 - 단어
interface IUserAnswerWord {
  readonly bookType: BookType
  readonly studyId: string
  readonly studentHistoryId: string
  readonly step: string
  quizId: string
  quizNo: number
  currentQuizNo: number
  correct: string
  studentAnswer: string
  answerCount: number
}

// 유저 답안 정보 - 부분 점수
interface IUserAnswerPartial {
  readonly mobile: Mobile
  readonly bookType: BookType
  readonly studyId: string
  readonly studentHistoryId: string
  readonly step: string
  quizId: string
  quizNo: number
  currentQuizNo: number
  correct: string
  studentAnswer: string
  partialRecord: string
  answerCount: number
  isEnabledPenalty?: boolean
  isLastQuiz?: boolean
  isFinishStudy?: boolean
  score?: number
}

// 유저 답안 정보 - Writing Activity 2
interface IUserAnswerWriting {
  readonly bookType: BookType
  readonly studyId: string
  readonly studentHistoryId: string
  readonly step: string
  saveType: WritingActivity2SaveType
  writeText: string
  isFinishStudy?: boolean
}

interface IVocabularyPractice {
  readonly mobile: Mobile
  readonly bookType: BookType
  readonly studyId: string
  readonly studentHistoryId: string
  readonly step: string
  quizId: string
  quizNo: number
  currentQuizNo: number
  correct: string
  studentAnswer: string
  answerCount: number
}

// checkAnswer 후 돌아오는 값들
interface IResultType {
  readonly result: string
  readonly resultMessage: '' | string
}

// 학습 완료 후 날아오는 메세지
interface IResultMessage {
  readonly average: number
  readonly rgpoint: number
  readonly totalpoint: number
  readonly levelup: string
  readonly levelmaster: string
  readonly newreadingunit: string
  readonly dailybook: string // 목표 권수
  readonly dailypoint: string // 목표 포인트
  readonly dailytype: string // 설정된 목표 타입 (포인트 or 권수)
  readonly dailygoal: string // 목표 달성 유무
  readonly prizetitle: string // 독서왕 수상 정보
}

// 과거 기록
interface IRecordAnswerType {
  readonly QuizId: string
  readonly QuizNo: number
  readonly CurrentQuizNo: number
  readonly OX: string
  readonly TempText: string
  readonly PenaltyWord: string
  readonly Correct: string
  readonly StudentAnswer: string
  readonly AnswerCount: number
}

// 패널티
interface IDeletePenaltyType {
  readonly mobile: Mobile
  readonly bookType: BookType
  readonly studyId: string
  readonly studentHistoryId: string
  readonly step: string
  quizId: string
  isLastQuiz?: boolean
  isFinishStudy?: boolean
  score?: number
}

// 별점
interface IResultPreference {
  success: boolean
}

export type {
  IStudyData,
  IScoreBoardData,
  IUserAnswer,
  IUserAnswerWord,
  IUserAnswerPartial,
  IUserAnswerWriting,
  IResultType,
  IRecordAnswerType,
  IDeletePenaltyType,
  IResultPreference,
}
