import { IStudyData } from '@interfaces/Common'
import { getQuizData } from '@services/studyApi'
import {
  IWritingActivity1,
  IWritingActivity1Quiz,
  IWritingActivity1Example,
  IWritingActivity2,
  IWritingActivity2Writing,
  IWritingActivity2ReWriting,
} from '@interfaces/IWritingActivity'

// writing activity 1
async function getWritingActivity1(
  study: IStudyData,
): Promise<IWritingActivity1> {
  const { bookType, studyId, studentHistoryId } = study
  const typeName = 'writing-activity-1'
  const path = `study/quiz/${typeName}?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<IWritingActivity1> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      Quiz: raw.Quiz.map((q: any): IWritingActivity1Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Sound: q.Question.Sound,
          },
          Examples: q.Examples.map((e: any): IWritingActivity1Example => {
            return {
              Text: e.Text,
            }
          }),
        }
      }),
    }
  }
  return getQuizData<IWritingActivity1>(path, transformObject)
}

// writing activity 2
async function getWritingActivity2(
  study: IStudyData,
): Promise<IWritingActivity2> {
  const { bookType, studyId, studentHistoryId } = study
  const typeName = 'writing-activity-2'
  const path = `study/quiz/${typeName}?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<IWritingActivity2> => {
    return {
      QuizTime: raw.QuizTime,
      Title: raw.Title,
      Author: raw.Author,
      Writing: raw.Writing,
      ReWriting: raw.ReWriting,
    }
  }
  return getQuizData<IWritingActivity2>(path, transformObject)
}

export { getWritingActivity1, getWritingActivity2 }
