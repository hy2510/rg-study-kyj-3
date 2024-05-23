import { IRecordAnswerType } from '@interfaces/Common'

const useCurrentQuizNo = (
  recordedQuizData: IRecordAnswerType[],
  maxQuizCount: number,
): number[] => {
  let currentQuizNo: number = 1
  let tryCnt: number = 0

  // 기록된 데이터에 따라서 로직이 필요.
  if (recordedQuizData && recordedQuizData.length > 0) {
    // 마지막 기록 데이터
    const lastRecordedData: IRecordAnswerType =
      recordedQuizData[recordedQuizData.length - 1]

    if (lastRecordedData.AnswerCount === maxQuizCount) {
      // 다음 문제 번호
      currentQuizNo = lastRecordedData.CurrentQuizNo + 1
    } else {
      // 문제 번호
      if (lastRecordedData.OX === '1') {
        currentQuizNo = lastRecordedData.CurrentQuizNo + 1
      } else {
        currentQuizNo = lastRecordedData.CurrentQuizNo
        tryCnt = lastRecordedData.AnswerCount
      }
    }
  }

  return [currentQuizNo, tryCnt]
}

const useCurrentQuizNoPartial = (
  recordedQuizData: IRecordAnswerType[],
  requireQuizCount: number,
  maxQuizCount: number,
): number[] => {
  let currentQuizNo: number = 1
  let lastQuizNo: number = 1
  let tryCnt: number = 0

  // 기록된 데이터에 따라서 로직이 필요.
  if (recordedQuizData && recordedQuizData.length > 0) {
    // 마지막 기록 데이터
    const lastRecordedData: IRecordAnswerType =
      recordedQuizData[recordedQuizData.length - 1]
    const userAnswers = lastRecordedData.StudentAnswer.split(',')
    const lastAnswer = userAnswers[userAnswers.length - 1].slice(-1)
    const lastAnswerLength = userAnswers[userAnswers.length - 1].length

    if (lastAnswerLength === maxQuizCount || lastAnswer === '1') {
      if (userAnswers.length === requireQuizCount) {
        lastQuizNo = lastRecordedData.QuizNo + 1
      } else {
        lastQuizNo = lastRecordedData.QuizNo
      }
      currentQuizNo = lastRecordedData.CurrentQuizNo + 1
    } else {
      currentQuizNo = lastRecordedData.CurrentQuizNo
      lastQuizNo = lastRecordedData.QuizNo
      tryCnt = lastAnswerLength
    }
  }

  return [currentQuizNo, lastQuizNo, tryCnt]
}

const useCurrentQuizNoVocaPractice = (
  recordedQuizData: IRecordAnswerType[],
  maxQuizCount: number,
): number[] => {
  let currentQuizNo: number = 1
  let tryCnt: number = 0

  // 기록된 데이터에 따라서 로직이 필요.
  if (recordedQuizData && recordedQuizData.length > 0) {
    // 마지막 기록 데이터
    const lastRecordedData: IRecordAnswerType =
      recordedQuizData[recordedQuizData.length - 1]

    if (lastRecordedData.AnswerCount === maxQuizCount) {
      // 다음 문제 번호
      currentQuizNo = lastRecordedData.CurrentQuizNo + 1
    } else {
      // 문제 번호
      currentQuizNo = lastRecordedData.CurrentQuizNo
      tryCnt = lastRecordedData.AnswerCount
    }
  }

  return [currentQuizNo, tryCnt]
}

export {
  useCurrentQuizNo,
  useCurrentQuizNoPartial,
  useCurrentQuizNoVocaPractice,
}
