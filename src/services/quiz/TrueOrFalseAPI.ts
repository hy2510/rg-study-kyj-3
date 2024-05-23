import { IStudyData } from '@interfaces/Common'
import {
  ITrueOrFalse,
  ITrueOrFalseExample,
  ITrueOrFalseQuiz,
} from '@interfaces/ITureOrFalse'
import { getQuizData } from '@services/studyApi'

async function getTrueOrFalse(study: IStudyData): Promise<ITrueOrFalse> {
  const { bookType, studyId, studentHistoryId } = study
  const typeName = 'true-or-false'
  const path = `study/quiz/${typeName}?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<ITrueOrFalse> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      Quiz: raw.Quiz.map((q: any): ITrueOrFalseQuiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Sound: q.Question.Sound,
          },
          Examples: q.Examples.map((e: any): ITrueOrFalseExample => {
            return {
              Text: e.Text,
              Sound: e.Sound,
            }
          }),
        }
      }),
    }
  }
  return getQuizData<ITrueOrFalse>(path, transformObject)
}

export { getTrueOrFalse }
