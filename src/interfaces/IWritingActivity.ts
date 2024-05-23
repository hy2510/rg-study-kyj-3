// WritingActivity1
interface IWritingActivity1Quiz {
  QuizId: string
  QuizNo: number
  Question: {
    Text: string
    Sound: string
  }
  Examples: IWritingActivity1Example[]
}
interface IWritingActivity1Example {
  Text: string
}
interface IWritingActivity1 {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  Quiz: IWritingActivity1Quiz[]
}
// WritingActivity1 end

// WritingActivity2
interface IWritingActivity2Writing {
  IsWritingOn: boolean
  Activity: string
  Type: 'In School' | 'Overseas' | 'No Revision'
  Mode: 'Free' | 'All' | 'Limit'
  MaxSubmitCount: number
  CurrentSubmitCount: number
  WordMinCount: number
  WordMaxCount: number
  Question: string[]
}

interface IWritingActivity2ReWriting {
  IsReWritingOn: boolean
  ReWritingImage1: string
  ReWritingImage2: string
  ReWritingComment: string
  ReWritingReason: string
}

interface IWritingActivity2 {
  readonly QuizTime: number
  readonly Title: string
  readonly Author: string
  Writing: IWritingActivity2Writing
  ReWriting: IWritingActivity2ReWriting
}
// WritingActivity2 end

export type {
  IWritingActivity1Quiz,
  IWritingActivity1Example,
  IWritingActivity1,
  IWritingActivity2,
  IWritingActivity2Writing,
  IWritingActivity2ReWriting,
}
