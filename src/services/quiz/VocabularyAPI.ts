import { IStudyData } from '@interfaces/Common'
import { getHint, getQuizData } from '@services/studyApi'
import {
  IVocabulary1Practice,
  IVocabulary1Test,
  IVocabulary1Quiz,
  IVocabulary1Example,
  IVocabulary2Practice,
  IVocabulary2Test,
  IVocabulary2Quiz,
  IVocabulary2Example,
  IVocabulary3Practice,
  IVocabulary3Test,
  IVocabulary3Quiz,
  IHint,
  IVocabulary4,
  IVocabulary4Quiz,
  IVocabulary4Example,
} from '@interfaces/IVocabulary'

//////////////////////////////////////////////////////////////
// vocabulary 1
//////////////////////////////////////////////////////////////
async function getVocabularyPractice1(
  study: IStudyData,
): Promise<IVocabulary1Practice> {
  const { bookType, studyId, studentHistoryId } = study
  const path = `study/quiz/vocabulary-1-practice?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<IVocabulary1Practice> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      MainMeanLanguage: raw.MainMeanLanguage,
      SubMeanLanguage: raw.SubMeanLanguage,
      Quiz: raw.Quiz.map((q: any): IVocabulary1Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Image: q.Question.Image,
            Sound: q.Question.Sound,
            SpeechPart: q.Question.SpeechPart,
            Korean: q.Question.Korean,
            Chinese: q.Question.Chinese,
            Japanese: q.Question.Japanese,
            Vietnamese: q.Question.Vietnamese,
            Indonesian: q.Question.Indonesian,
            English: q.Question.English,
            Britannica: q.Question.Britannica,
          },
          Examples: q.Examples.map((e: any): IVocabulary1Example => {
            return {
              Text: e.Text,
            }
          }),
        }
      }),
    }
  }
  return getQuizData<IVocabulary1Practice>(path, transformObject)
}

async function getVocabularyTest1(
  study: IStudyData,
): Promise<IVocabulary1Test> {
  const { bookType, studyId, studentHistoryId } = study
  const path = `study/quiz/vocabulary-1?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<IVocabulary1Test> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      MainMeanLanguage: raw.MainMeanLanguage,
      SubMeanLanguage: raw.SubMeanLanguage,
      Quiz: raw.Quiz.map((q: any): IVocabulary1Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Image: q.Question.Image,
            Sound: q.Question.Sound,
            SpeechPart: q.Question.SpeechPart,
            Korean: q.Question.Korean,
            Chinese: q.Question.Chinese,
            Japanese: q.Question.Japanese,
            Vietnamese: q.Question.Vietnamese,
            Indonesian: q.Question.Indonesian,
            English: q.Question.English,
            Britannica: q.Question.Britannica,
          },
          Examples: q.Examples.map((e: any): IVocabulary1Example => {
            return {
              Text: e.Text,
            }
          }),
        }
      }),
    }
  }
  return getQuizData<IVocabulary1Test>(path, transformObject)
}
// vocabulary 1 end

//////////////////////////////////////////////////////////////
// vocabulary 2
//////////////////////////////////////////////////////////////
async function getVocabularyPractice2(
  study: IStudyData,
): Promise<IVocabulary2Practice> {
  const { bookType, studyId, studentHistoryId } = study
  const path = `study/quiz/vocabulary-2-practice?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<IVocabulary2Practice> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      MainMeanLanguage: raw.MainMeanLanguage,
      SubMeanLanguage: raw.SubMeanLanguage,
      Quiz: raw.Quiz.map((q: any): IVocabulary2Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Image: q.Question.Image,
            Sound: q.Question.Sound,
            Word: q.Question.Word,
            WordSound: q.Question.WordSound,
            SpeechPart: q.Question.SpeechPart,
            Korean: q.Question.Korean,
            Chinese: q.Question.Chinese,
            Japanese: q.Question.Japanese,
            Vietnamese: q.Question.Vietnamese,
            Indonesian: q.Question.Indonesian,
            English: q.Question.English,
            Britannica: q.Question.Britannica,
          },
          Examples: q.Examples.map((e: any): IVocabulary2Example => {
            return {
              Text: e.Text,
            }
          }),
        }
      }),
    }
  }
  return getQuizData<IVocabulary2Test>(path, transformObject)
}

async function getVocabularyTest2(
  study: IStudyData,
): Promise<IVocabulary2Test> {
  const { bookType, studyId, studentHistoryId } = study
  const path = `study/quiz/vocabulary-2?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<IVocabulary2Test> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      MainMeanLanguage: raw.MainMeanLanguage,
      SubMeanLanguage: raw.SubMeanLanguage,
      Quiz: raw.Quiz.map((q: any): IVocabulary2Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Image: q.Question.Image,
            Sound: q.Question.Sound,
            Word: q.Question.Word,
            WordSound: q.Question.WordSound,
            SpeechPart: q.Question.SpeechPart,
            Korean: q.Question.Korean,
            Chinese: q.Question.Chinese,
            Japanese: q.Question.Japanese,
            Vietnamese: q.Question.Vietnamese,
            Indonesian: q.Question.Indonesian,
            English: q.Question.English,
            Britannica: q.Question.Britannica,
          },
          Examples: q.Examples.map((e: any): IVocabulary2Example => {
            return {
              Text: e.Text,
            }
          }),
        }
      }),
    }
  }
  return getQuizData<IVocabulary2Test>(path, transformObject)
}
// vocabulary 2 end

//////////////////////////////////////////////////////////////
// vocabulary 3
//////////////////////////////////////////////////////////////
async function getVocabularyPractice3(
  study: IStudyData,
): Promise<IVocabulary3Practice> {
  const { bookType, studyId, studentHistoryId } = study
  const path = `study/quiz/vocabulary-3-practice?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<IVocabulary3Practice> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      IsEnabledTyping: raw.IsEnabledTyping,
      IsSkipAvailable: raw.IsSkipAvailable,
      MainMeanLanguage: raw.MainMeanLanguage,
      SubMeanLanguage: raw.SubMeanLanguage,
      Quiz: raw.Quiz.map((q: any): IVocabulary3Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Sound: q.Question.Sound,
            SpeechPart: q.Question.SpeechPart,
            Korean: q.Question.Korean,
            Chinese: q.Question.Chinese,
            Japanese: q.Question.Japanese,
            Vietnamese: q.Question.Vietnamese,
            Indonesian: q.Question.Indonesian,
            English: q.Question.English,
            Britannica: q.Question.Britannica,
          },
        }
      }),
    }
  }
  return getQuizData<IVocabulary3Practice>(path, transformObject)
}

async function getVocabularyTest3(
  study: IStudyData,
): Promise<IVocabulary3Test> {
  const { bookType, studyId, studentHistoryId } = study
  const path = `study/quiz/vocabulary-3?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<IVocabulary3Test> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      MainMeanLanguage: raw.MainMeanLanguage,
      SubMeanLanguage: raw.SubMeanLanguage,
      IsEnablePenaltyReview: Boolean(raw.IsEnablePenaltyReview),
      Hint: {
        IsEnabled: raw.Hint.IsEnabled,
        Max: raw.Hint.Max,
        Try: raw.Hint.Try,
      },
      Quiz: raw.Quiz.map((q: any): IVocabulary3Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Sound: q.Question.Sound,
            SpeechPart: q.Question.SpeechPart,
            Korean: q.Question.Korean,
            Chinese: q.Question.Chinese,
            Japanese: q.Question.Japanese,
            Vietnamese: q.Question.Vietnamese,
            Indonesian: q.Question.Indonesian,
            English: q.Question.English,
            Britannica: q.Question.Britannica,
          },
        }
      }),
    }
  }
  return getQuizData<IVocabulary3Test>(path, transformObject)
}

async function getVocabularyHint(
  studyId: string,
  studentHistoryId: string,
  quizNo: number,
) {
  const path = `study/hint/Vocabulary?studentHistoryId=${studentHistoryId}&studyId=${studyId}&quizNo=${quizNo}`
  const transformType = async (raw: any): Promise<IHint> => {
    return {
      Type: raw.Type,
      Hint: raw.Hint,
      TryHint: raw.TryHint,
      ErrorNo: raw.ErrorNo,
    }
  }
  return getHint<IHint>(path, transformType)
}
// vocabulary 3 end

//////////////////////////////////////////////////////////////
// vocabulary 4
//////////////////////////////////////////////////////////////
async function getVocabularyPractice4(
  study: IStudyData,
): Promise<IVocabulary4> {
  const { bookType, studyId, studentHistoryId } = study
  const path = `study/quiz/vocabulary-4-practice?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<IVocabulary4> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      MainMeanLanguage: raw.MainMeanLanguage,
      SubMeanLanguage: raw.SubMeanLanguage,
      Quiz: raw.Quiz.map((q: any): IVocabulary4Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Sound: q.Question.Sound,
            SpeechPart: q.Question.SpeechPart,
            Korean: q.Question.Korean,
            Chinese: q.Question.Chinese,
            Japanese: q.Question.Japanese,
            Vietnamese: q.Question.Vietnamese,
            Indonesian: q.Question.Indonesian,
            English: q.Question.English,
            Britannica: q.Question.Britannica,
          },
          Examples: q.Examples.map((e: any): IVocabulary4Example => {
            return {
              Text: e.Text,
            }
          }),
        }
      }),
    }
  }
  return getQuizData<IVocabulary4>(path, transformObject)
}

async function getVocabularyTest4(study: IStudyData): Promise<IVocabulary4> {
  const { bookType, studyId, studentHistoryId } = study
  const path = `study/quiz/vocabulary-4?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<IVocabulary4> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      MainMeanLanguage: raw.MainMeanLanguage,
      SubMeanLanguage: raw.SubMeanLanguage,
      Quiz: raw.Quiz.map((q: any): IVocabulary4Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Sound: q.Question.Sound,
            SpeechPart: q.Question.SpeechPart,
            Korean: q.Question.Korean,
            Chinese: q.Question.Chinese,
            Japanese: q.Question.Japanese,
            Vietnamese: q.Question.Vietnamese,
            Indonesian: q.Question.Indonesian,
            English: q.Question.English,
            Britannica: q.Question.Britannica,
          },
          Examples: q.Examples.map((e: any): IVocabulary4Example => {
            return {
              Text: e.Text,
            }
          }),
        }
      }),
    }
  }
  return getQuizData<IVocabulary4>(path, transformObject)
}

export {
  getVocabularyPractice1,
  getVocabularyTest1,
  getVocabularyPractice2,
  getVocabularyTest2,
  getVocabularyPractice3,
  getVocabularyTest3,
  getVocabularyHint,
  getVocabularyPractice4,
  getVocabularyTest4,
}
