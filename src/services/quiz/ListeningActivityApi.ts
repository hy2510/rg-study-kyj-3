import { IStudyData } from '@interfaces/Common'
import { getQuizData } from '@services/studyApi'
import {
  IListeningActivity1,
  IListeningActivity1Example,
  IListeningActivity1Quiz,
  IListeningActivity2,
  IListeningActivity2Example,
  IListeningActivity2Quiz,
  IListeningActivity3,
  IListeningActivity3Example,
  IListeningActivity3Quiz,
  IListeningActivity4,
  IListeningActivity4Example,
  IListeningActivity4Quiz,
} from '@interfaces/IListeningActivity'

// listening activity 1
async function getListeningActivity1(
  study: IStudyData,
): Promise<IListeningActivity1> {
  const { bookType, studyId, studentHistoryId } = study
  const typeName = 'listening-activity-1'
  const path = `study/quiz/${typeName}?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<IListeningActivity1> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      Quiz: raw.Quiz.map((q: any): IListeningActivity1Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Sound: q.Question.Sound,
          },
        }
      }),
      Examples: raw.Examples.map((e: any): IListeningActivity1Example => {
        return {
          Text: e.Text,
          Image: e.Image,
        }
      }),
    }
  }
  return getQuizData<IListeningActivity1>(path, transformObject)
}

// listening activity 2
async function getListeningActivity2(
  study: IStudyData,
): Promise<IListeningActivity2> {
  const { bookType, studyId, studentHistoryId } = study
  const typeName = 'listening-activity-2'
  const path = `study/quiz/${typeName}?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<IListeningActivity2> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      Quiz: raw.Quiz.map((q: any): IListeningActivity2Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Sound: q.Question.Sound,
          },
        }
      }),
      Examples: raw.Examples.map((e: any): IListeningActivity2Example => {
        return {
          Text: e.Text,
        }
      }),
    }
  }
  return getQuizData<IListeningActivity2>(path, transformObject)
}

// listening activity 3
async function getListeningActivity3(
  study: IStudyData,
): Promise<IListeningActivity3> {
  const { bookType, studyId, studentHistoryId } = study
  const typeName = 'listening-activity-3'
  const path = `study/quiz/${typeName}?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<IListeningActivity3> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      Quiz: raw.Quiz.map((q: any): IListeningActivity3Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Sound: q.Question.Sound,
          },
          Examples: q.Examples.map((e: any): IListeningActivity3Example => {
            return {
              Text: e.Text,
              Image: e.Image,
            }
          }),
        }
      }),
    }
  }
  return getQuizData<IListeningActivity3>(path, transformObject)
}

// listening acrivity 4
async function getListeningActivity4(
  study: IStudyData,
): Promise<IListeningActivity4> {
  const { bookType, studyId, studentHistoryId } = study
  const typeName = 'listening-activity-4'
  const path = `study/quiz/${typeName}?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<IListeningActivity4> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      Quiz: raw.Quiz.map((q: any): IListeningActivity4Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Image: q.Question.Image,
          },
          Examples: q.Examples.map((e: any): IListeningActivity4Example => {
            return {
              Text: e.Text,
              Sound: e.Sound,
            }
          }),
        }
      }),
    }
  }
  return getQuizData<IListeningActivity4>(path, transformObject)
}

export {
  getListeningActivity1,
  getListeningActivity2,
  getListeningActivity3,
  getListeningActivity4,
}
