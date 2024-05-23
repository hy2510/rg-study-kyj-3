type MeanLanguage =
  | 'korean'
  | 'chinese'
  | 'japanese'
  | 'vietnamese'
  | 'indonesian'
  | 'english'
  | ''

// VocabulraryPractice1
interface IVocabulary1Quiz {
  QuizId: string
  QuizNo: number
  Question: {
    Text: string
    Sound: string
    Image: string
    SpeechPart: string
    Korean: string
    Chinese: string
    Japanese: string
    Vietnamese: string
    Indonesian: string
    English: string
    Britannica: string
  }
  Examples: IVocabulary1Example[]
}

interface IVocabulary1Example {
  Text: string
}

interface IVocabulary1Practice {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  readonly MainMeanLanguage: MeanLanguage
  readonly SubMeanLanguage: MeanLanguage
  Quiz: IVocabulary1Quiz[]
}
interface IVocabulary1Test {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  readonly MainMeanLanguage: MeanLanguage
  readonly SubMeanLanguage: MeanLanguage
  Quiz: IVocabulary1Quiz[]
}
// VocabulraryPractice1 / Test1 end

// VocabulraryPractice2
interface IVocabulary2Quiz {
  QuizId: string
  QuizNo: number
  Question: {
    Text: string
    Image: string
    Sound: string
    Word: string
    WordSound: string
    SpeechPart: string
    Korean: string
    Chinese: string
    Japanese: string
    Vietnamese: string
    Indonesian: string
    English: string
    Britannica: string
  }
  Examples: IVocabulary2Example[]
}

interface IVocabulary2Example {
  Text: string
}

interface IVocabulary2Practice {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  readonly MainMeanLanguage: MeanLanguage
  readonly SubMeanLanguage: MeanLanguage
  Quiz: IVocabulary2Quiz[]
}

interface IVocabulary2Test {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  readonly MainMeanLanguage: MeanLanguage
  readonly SubMeanLanguage: MeanLanguage
  Quiz: IVocabulary2Quiz[]
}
// VocabulraryPractice2 / Test2 end

// VocabulraryPractice3 / Test3
interface IVocabulary3Quiz {
  QuizId: string
  QuizNo: number
  Question: {
    Text: string
    Sound: string
    SpeechPart: string
    Korean: string
    Chinese: string
    Japanese: string
    Vietnamese: string
    Indonesian: string
    English: string
    Britannica: string
  }
}

interface IVocabulary3Hint {
  IsEnabled: boolean
  Max?: number
  Try?: number
}

// Hint
interface IHint {
  Type: number
  Hint: string
  TryHint: number
  ErrorNo: number
}
// Hint end

interface IVocabulary3Practice {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  readonly IsEnabledTyping: boolean
  readonly IsSkipAvailable: boolean
  readonly MainMeanLanguage: MeanLanguage
  readonly SubMeanLanguage: MeanLanguage
  Quiz: IVocabulary3Quiz[]
}

interface IVocabulary3Test {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  readonly IsEnablePenaltyReview: boolean
  readonly MainMeanLanguage: MeanLanguage
  readonly SubMeanLanguage: MeanLanguage
  Hint: IVocabulary3Hint
  Quiz: IVocabulary3Quiz[]
}
// VocabulraryPractice3 / Test3 end

interface IVocabulary4Quiz {
  QuizId: string
  QuizNo: number
  Question: {
    Text: string
    Sound: string
    SpeechPart: string
    Korean: string
    Chinese: string
    Japanese: string
    Vietnamese: string
    Indonesian: string
    English: string
    Britannica: string
  }
  Examples: IVocabulary4Example[]
}

interface IVocabulary4Example {
  Text: string
}

interface IVocabulary4 {
  readonly ContentsId: number
  readonly IsQuizTimeoutIncorrect: boolean
  readonly QuizAnswerCount: number
  readonly QuizTime: number
  readonly MainMeanLanguage: MeanLanguage
  readonly SubMeanLanguage: MeanLanguage
  Quiz: IVocabulary4Quiz[]
}
// VocabulraryPractice4 / Test4 end

export type {
  IVocabulary1Quiz,
  IVocabulary1Example,
  IVocabulary1Practice,
  IVocabulary1Test,
  IVocabulary2Quiz,
  IVocabulary2Example,
  IVocabulary2Practice,
  IVocabulary2Test,
  IVocabulary3Quiz,
  IVocabulary3Hint,
  IVocabulary3Practice,
  IVocabulary3Test,
  IHint,
  IVocabulary4Quiz,
  IVocabulary4Example,
  IVocabulary4,
  MeanLanguage,
}
