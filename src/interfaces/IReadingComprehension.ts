// ReadingComprehension1
interface IReadingComprehension1Quiz {
  QuizId: string
  QuizNo: number
  Question: {
    Text: string
    Sound: string
  }
  Examples: IReadingComprehension1Example[]
}
interface IReadingComprehension1Example {
  Text: string
  Image: string
}
interface IReadingComprehension1 {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  Quiz: IReadingComprehension1Quiz[]
}
// ReadingComprehension1 end

// ReadingComprehension2
interface IReadingComprehension2Quiz {
  QuizId: string
  QuizNo: number
  Question: {
    Text: string
    Image: string
  }
  Examples: IReadingComprehension2Example[]
}
interface IReadingComprehension2Example {
  Text: string
  Sound: string
}
interface IReadingComprehension2 {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  Quiz: IReadingComprehension2Quiz[]
}
// ReadingComprehension2 end

// ReadingComprehension3
interface IReadingComprehension3Quiz {
  QuizId: string
  QuizNo: number
  Question: {
    Text: string
    Image: string
    Sound: string
  }
  Examples: IReadingComprehension3Example[]
}
interface IReadingComprehension3Example {
  Text: string
  Sound: string
}
interface IReadingComprehension3 {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  Quiz: IReadingComprehension3Quiz[]
}
// ReadingComprehension3 end

// ReadingComprehension4
interface IReadingComprehension4Quiz {
  QuizId: string
  QuizNo: number
  Question: {
    Text: string
    Sound?: string
  }
  Examples: IReadingComprehension4Example[]
}
interface IReadingComprehension4Example {
  Text: string
}
interface IReadingComprehension4 {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  readonly IsModeRetest: boolean
  readonly PassMark: number
  readonly IsHideQuestionText: boolean
  Quiz: IReadingComprehension4Quiz[]
}
// ReadingComprehension4 end

export type {
  IReadingComprehension1,
  IReadingComprehension1Quiz,
  IReadingComprehension1Example,
  IReadingComprehension2,
  IReadingComprehension2Quiz,
  IReadingComprehension2Example,
  IReadingComprehension3,
  IReadingComprehension3Quiz,
  IReadingComprehension3Example,
  IReadingComprehension4,
  IReadingComprehension4Quiz,
  IReadingComprehension4Example,
}
