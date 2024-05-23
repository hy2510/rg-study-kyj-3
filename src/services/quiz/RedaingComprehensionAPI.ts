import { IStudyData } from '@interfaces/Common'
import { getQuizData } from '@services/studyApi'
import {
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
} from '@interfaces/IReadingComprehension'

// reading comprehension 1
async function getReadingComprehension1(
  study: IStudyData,
): Promise<IReadingComprehension1> {
  const { bookType, studyId, studentHistoryId } = study
  const typeName = 'reading-comprehension-1'
  const path = `study/quiz/${typeName}?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<IReadingComprehension1> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      Quiz: raw.Quiz.map((q: any): IReadingComprehension1Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Sound: q.Question.Sound,
          },
          Examples: q.Examples.map((e: any): IReadingComprehension1Example => {
            return {
              Text: e.Text,
              Image: e.Image,
            }
          }),
        }
      }),
    }
  }
  return getQuizData<IReadingComprehension1>(path, transformObject)
}

// reading comprehension 2
async function getReadingComprehension2(
  study: IStudyData,
): Promise<IReadingComprehension2> {
  const { bookType, studyId, studentHistoryId } = study
  const typeName = 'reading-comprehension-2'
  const path = `study/quiz/${typeName}?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<IReadingComprehension2> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      Quiz: raw.Quiz.map((q: any): IReadingComprehension2Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Image: q.Question.Image,
          },
          Examples: q.Examples.map((e: any): IReadingComprehension2Example => {
            return {
              Text: e.Text,
              Sound: e.Sound,
            }
          }),
        }
      }),
    }
  }
  return getQuizData<IReadingComprehension2>(path, transformObject)
}

// reading comprehension 3
async function getReadingComprehension3(
  study: IStudyData,
): Promise<IReadingComprehension3> {
  const { bookType, studyId, studentHistoryId } = study
  const typeName = 'reading-comprehension-3'
  const path = `study/quiz/${typeName}?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<IReadingComprehension3> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      Quiz: raw.Quiz.map((q: any): IReadingComprehension3Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Image: q.Question.Image,
            Sound: q.Question.Sound,
          },
          Examples: q.Examples.map((e: any): IReadingComprehension3Example => {
            return {
              Text: e.Text,
              Sound: e.Sound,
            }
          }),
        }
      }),
    }
  }
  return getQuizData<IReadingComprehension3>(path, transformObject)
}

// reading comprehension 4
async function getReadingComprehension4(
  study: IStudyData,
): Promise<IReadingComprehension4> {
  const { bookType, studyId, studentHistoryId } = study
  const typeName = 'reading-comprehension-4'
  const path = `study/quiz/${typeName}?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<IReadingComprehension4> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      IsModeRetest: Boolean(raw.IsModeRetest),
      PassMark: Number(raw.PassMark),
      IsHideQuestionText: Boolean(raw.IsHideQuestionText),
      Quiz: raw.Quiz.map((q: any): IReadingComprehension4Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Sound: q.Question.Sound,
          },
          Examples: q.Examples.map((e: any): IReadingComprehension4Example => {
            return { Text: e.Text }
          }),
        }
      }),
    }
  }
  return getQuizData<IReadingComprehension4>(path, transformObject)
}

export {
  getReadingComprehension1,
  getReadingComprehension2,
  getReadingComprehension3,
  getReadingComprehension4,
}
