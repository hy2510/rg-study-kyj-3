// Summary1
interface ISummary1Quiz {
  QuizId: string
  QuizNo: number
  Question: {
    Text: string
    Sound: string
  }
}
interface ISummary1Hint {
  IsEnabled: boolean
  Max?: number
  Try?: number
}
interface ISummary1 {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  readonly IsEnablePenaltyReview: boolean
  Hint: ISummary1Hint
  Quiz: ISummary1Quiz[]
}
// Summary1 end

// Summary2

interface ISummary2Sentence {
  Texts: string[]
  Sounds: string[]
}

interface ISummary2Example {
  Text: string
}

interface ISummary2Quiz {
  QuizId: string
  QuizNo: number
  Examples: ISummary2Example[]
}

interface ISummary2 {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  Sentence: ISummary2Sentence
  Quiz: ISummary2Quiz[]
}
// Summary1 end

export type {
  ISummary1Quiz,
  ISummary1,
  ISummary1Hint,
  ISummary2,
  ISummary2Quiz,
  ISummary2Example,
  ISummary2Sentence,
}
