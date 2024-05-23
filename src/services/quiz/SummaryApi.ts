import { IStudyData } from '@interfaces/Common'
import { getHint, getQuizData } from '@services/studyApi'
import {
  ISummary1,
  ISummary1Quiz,
  ISummary2,
  ISummary2Example,
  ISummary2Quiz,
  ISummary2Sentence,
} from '@interfaces/ISummary'
import { IHint } from '@interfaces/IVocabulary'

// summary1
async function getSummary1(study: IStudyData): Promise<ISummary1> {
  const { bookType, studyId, studentHistoryId } = study
  const typeName = 'summary-1'
  const path = `study/quiz/${typeName}?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<ISummary1> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      IsEnablePenaltyReview: Boolean(raw.IsEnablePenaltyReview),
      Hint: {
        IsEnabled: raw.Hint.IsEnabled,
        Max: raw.Hint.Max,
        Try: raw.Hint.Try,
      },
      Quiz: raw.Quiz.map((q: any): ISummary1Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Question: {
            Text: q.Question.Text,
            Sound: q.Question.Sound,
          },
        }
      }),
    }
  }
  return getQuizData<ISummary1>(path, transformObject)
}
// summary1 end

// summary2
async function getSummary2(study: IStudyData): Promise<ISummary2> {
  const { bookType, studyId, studentHistoryId } = study
  const typeName = 'summary-2'
  const path = `study/quiz/${typeName}?studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`

  const transformObject = async (raw: any): Promise<ISummary2> => {
    return {
      ContentsId: Number(raw.ContentsId),
      IsQuizTimeoutIncorrect: Boolean(raw.isQuizTimeoutIncorrect),
      QuizAnswerCount: Number(raw.QuizAnswerCount),
      QuizTime: Number(raw.QuizTime),
      Sentence: {
        Texts: raw.Sentence.Texts,
        Sounds: raw.Sentence.Sounds,
      },
      Quiz: raw.Quiz.map((q: any): ISummary2Quiz => {
        return {
          QuizId: q.QuizId.toString(),
          QuizNo: Number(q.QuizNo),
          Examples: q.Examples.map(
            (e: any): ISummary2Example => ({ Text: e.Text }),
          ),
        }
      }),
    }
  }
  return getQuizData<ISummary2>(path, transformObject)
}

// hint
async function getSummaryHint(
  studyId: string,
  studentHistoryId: string,
  quizNo?: number,
  step?: string,
) {
  const path = `study/hint/Summary?studentHistoryId=${studentHistoryId}&studyId=${studyId}&quizNo=${quizNo}&step=${step}`
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

export { getSummary1, getSummary2, getSummaryHint }
