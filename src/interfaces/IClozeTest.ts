// ClozeTest1
interface IClozeTest1Quiz {
  QuizId: string
  QuizNo: number
  Question: {
    Text: string
    Sound: string
  }
  Examples: IClozeTest1Example[]
}
interface IClozeTest1Example {
  Text: string
}
interface IClozeTest1 {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  Quiz: IClozeTest1Quiz[]
}
// ClozeTest1 end

// ClozeTest2
interface IClozeTest2 {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  readonly IsEnablePenaltyReview: boolean
  Quiz: IClozeTest2Quiz[]
}
interface IClozeTest2Example {
  Text: string
}
interface IClozeTest2Quiz {
  QuizId: string
  QuizNo: number
  Question: {
    Text: string
    Sound: string
  }
  Examples: IClozeTest2Example[]
}
// ClozeTest2 end

// ClozeTest3
interface IClozeTest3 {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  readonly IsEnablePenaltyReview: boolean
  Quiz: IClozeTest3Quiz[]
}
interface IClozeTest3Example {
  Text: string
}
interface IClozeTest3Quiz {
  QuizId: string
  QuizNo: number
  Question: {
    Text: string
    Sound: string
  }
  Examples: IClozeTest3Example[]
}
// ClozeTest3 end

export type {
  IClozeTest1Quiz,
  IClozeTest1,
  IClozeTest1Example,
  IClozeTest2,
  IClozeTest2Quiz,
  IClozeTest2Example,
  IClozeTest3,
  IClozeTest3Quiz,
  IClozeTest3Example,
}
