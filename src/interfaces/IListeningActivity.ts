// ListeningActivity1
interface IListeningActivity1Quiz {
  QuizId: string
  QuizNo: number
  Question: {
    Text: string
    Sound: string
  }
}
interface IListeningActivity1Example {
  Text: string
  Image: string
  IsCorrected?: boolean
}
interface IListeningActivity1 {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  Quiz: IListeningActivity1Quiz[]
  Examples: IListeningActivity1Example[]
}
// ListeningActivity1 end

// ListeningActivity2
interface IListeningActivity2Quiz {
  QuizId: string
  QuizNo: number
  Question: {
    Text: string
    Sound: string
  }
}
interface IListeningActivity2Example {
  Text: string
  IsCorrected?: boolean
}
interface IListeningActivity2 {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  Quiz: IListeningActivity2Quiz[]
  Examples: IListeningActivity2Example[]
}
// ListeningActivity2 end

// ListeningActivity3
interface IListeningActivity3Quiz {
  QuizId: string
  QuizNo: number
  Question: {
    Text: string
    Sound: string
  }
  Examples: IListeningActivity3Example[]
}
interface IListeningActivity3Example {
  Text: string
  Image: string
}
interface IListeningActivity3 {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  Quiz: IListeningActivity3Quiz[]
}
// ListeningActivity3 end

// ListeningActivity4
interface IListeningActivity4Quiz {
  QuizId: string
  QuizNo: number
  Question: {
    Text: string
    Image: string
  }
  Examples: IListeningActivity4Example[]
}
interface IListeningActivity4Example {
  Text: string
  Sound: string
}
interface IListeningActivity4 {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  Quiz: IListeningActivity4Quiz[]
}
// ListeningActivity4 end

export type {
  IListeningActivity1Quiz,
  IListeningActivity1,
  IListeningActivity1Example,
  IListeningActivity2Quiz,
  IListeningActivity2,
  IListeningActivity2Example,
  IListeningActivity3Quiz,
  IListeningActivity3,
  IListeningActivity3Example,
  IListeningActivity4Quiz,
  IListeningActivity4,
  IListeningActivity4Example,
}
