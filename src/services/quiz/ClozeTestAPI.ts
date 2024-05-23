import { IStudyData } from '@interfaces/Common'
import { getQuizData } from '@services/studyApi'
import {
  IClozeTest1,
  IClozeTest1Quiz,
  IClozeTest1Example,
  IClozeTest2,
  IClozeTest2Example,
  IClozeTest2Quiz,
  IClozeTest3,
  IClozeTest3Example,
  IClozeTest3Quiz,
} from '@interfaces/IClozeTest'

// cloze test 1
async function getClozeTest1(study: IStudyData): Promise<IClozeTest1> {
  const { bookType, studyId, studentHistoryId } = study
  const typeName = 'cloze-test-1'
  const path = `study/quiz/${typeName}?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<IClozeTest1> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      Quiz: raw.Quiz.map((q: any): IClozeTest1Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Sound: q.Question.Sound,
          },
          Examples: q.Examples.map((e: any): IClozeTest1Example => {
            return {
              Text: e.Text,
            }
          }),
        }
      }),
    }
  }
  return getQuizData<IClozeTest1>(path, transformObject)
}

// cloze test 2
async function getClozeTest2(study: IStudyData): Promise<IClozeTest2> {
  const { bookType, studyId, studentHistoryId } = study
  const typeName = 'cloze-test-2'
  const path = `study/quiz/${typeName}?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<IClozeTest2> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      IsEnablePenaltyReview: Boolean(raw.IsEnablePenaltyReview),
      Quiz: raw.Quiz.map((q: any): IClozeTest2Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Sound: q.Question.Sound,
          },
          Examples: q.Examples.map((e: any): IClozeTest2Example => {
            return { Text: e.Text }
          }),
        }
      }),
    }
  }
  return getQuizData<IClozeTest2>(path, transformObject)
}

// cloze test 3
async function getClozeTest3(study: IStudyData): Promise<IClozeTest3> {
  const { bookType, studyId, studentHistoryId } = study
  const typeName = 'cloze-test-3'
  const path = `study/quiz/${typeName}?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<IClozeTest3> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      IsEnablePenaltyReview: Boolean(raw.IsEnablePenaltyReview),
      Quiz: raw.Quiz.map((q: any): IClozeTest3Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Sound: q.Question.Sound,
          },
          Examples: q.Examples.map((e: any): IClozeTest3Example => {
            return { Text: e.Text }
          }),
        }
      }),
    }
  }
  return getQuizData<IClozeTest3>(path, transformObject)
}

export { getClozeTest1, getClozeTest2, getClozeTest3 }
