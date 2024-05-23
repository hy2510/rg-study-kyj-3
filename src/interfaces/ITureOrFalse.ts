// True or False
interface ITrueOrFalseQuiz {
  QuizId: string
  QuizNo: number
  Question: {
    Text: string
    Sound: string
  }
  Examples: ITrueOrFalseExample[]
}
interface ITrueOrFalseExample {
  Text: string
  Sound: string
}
interface ITrueOrFalse {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  Quiz: ITrueOrFalseQuiz[]
}
// True or False end

export type { ITrueOrFalse, ITrueOrFalseQuiz, ITrueOrFalseExample }
