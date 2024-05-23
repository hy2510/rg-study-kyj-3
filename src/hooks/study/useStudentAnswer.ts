import { useState } from 'react'
import {
  IScoreBoardData,
  IRecordAnswerType,
  IUserAnswer,
  IUserAnswerPartial,
} from '@interfaces/Common'
import { map } from 'lodash'
import { BookType, Mobile } from '@interfaces/Types'

type UserAnswerDataProps = {
  mobile: Mobile
  studyId: string
  studentHistoryId: string
  bookType: BookType
  step: string | number
  quizId: string
  quizNo: number
  currentQuizNo: number
  correct: string
  selectedAnswer: string
  tryCount: number
  maxQuizCount: number
  quizLength: number
  isCorrect: boolean
  answerData: IScoreBoardData
  isEnabledPenalty?: boolean
  isFinishStudy?: boolean
}

type UserPartialAnswersDataProps = {
  mobile: Mobile
  studyId: string
  studentHistoryId: string
  bookType: BookType
  step: string | number
  quizId: string
  quizNo: number
  currentQuizNo: number
  correct: string
  selectedAnswer: string
  partialRecord: string
  tryCount: number
  maxQuizCount: number
  quizLength: number
  isCorrect: boolean
  answerData: IScoreBoardData
  isEnabledPenalty?: boolean
  isFinishStudy?: boolean
}

const useStudentAnswer = () => {
  const [scoreBoardData, setScoreBoardData] = useState<IScoreBoardData[]>([])

  /**
   * 과거 기록 세팅
   * @param recordedData
   * @param maxQuizCount
   */
  const setStudentAnswers = (
    recordedData: IRecordAnswerType[],
    maxQuizCount: number,
  ) => {
    const convertedData = convertRecordToScoreBoard(recordedData, maxQuizCount)

    setScoreBoardData(convertedData)
  }

  /**
   * 과거 기록 세팅 - 부분 점수
   * @param recordedData
   * @param maxQuizCount
   */
  const setStudentAnswersPartial = (
    recordedData: IRecordAnswerType[],
    maxQuizCount: number,
  ) => {
    // error - 과거에 풀었던 답에 대한 횟수가 카운팅되지 않음
    // 개발 서버에서 파악한 바로는 횟수 대신 정 / 오답만 체크함
    const convertedData = convertPartialRecordToScoreBoard(
      recordedData,
      maxQuizCount,
    )

    setScoreBoardData(convertedData)
  }

  // 기록에 추가
  const addStudentAnswers = (recordData: IScoreBoardData) => {
    let newRecordData: IScoreBoardData[] = []

    // 스코어 보드 기록이 있으면
    if (scoreBoardData.length > 0) {
      newRecordData = [...scoreBoardData]
    }

    // 기회를 확인 후
    if (recordData.maxCount > 1) {
      // 기존에 있던 답안 기록은 업데이트, 새로운 답안 기록은 추가한다.
      const isRecordIndex = scoreBoardData.find(
        (data) => data.quizNo === recordData.quizNo,
      )

      if (isRecordIndex) {
        newRecordData = map(scoreBoardData, (data) =>
          data.quizNo === recordData.quizNo &&
          data.answerCount < recordData.maxCount
            ? {
                ...data,
                quizNo: recordData.quizNo,
                maxCount: recordData.maxCount,
                answerCount: recordData.answerCount,
                ox: recordData.ox,
              }
            : data,
        )
      } else {
        // 기록된 퀴즈 번호가 없으면 새로 추가
        newRecordData.push(recordData)
      }
    } else {
      newRecordData.push(recordData)
    }

    setScoreBoardData(newRecordData)
  }

  /**
   * 마지막 문제 체크 후 점수를 가져오는 함수
   * @param lastScoreData 마지막 스코어 데이터
   * @param quizAnswerCount 퀴즈 기회
   * @returns score 점수
   */
  const getScore = (
    lastScoreData: IScoreBoardData,
    quizLength: number,
    quizAnswerCount: number,
  ): number => {
    const prevStuentAnswers: IScoreBoardData[] = [
      ...scoreBoardData,
      lastScoreData,
    ]

    const point = 100 / quizLength
    let score: number = 0
    let correctCount: number = 0
    let incorrectCount: number = 0

    prevStuentAnswers.map((el) => {
      if (el.ox) {
        correctCount++

        switch (el.answerCount) {
          case 1:
            score += 1 * point
            break

          case 2:
            score += 0.5 * point
            break

          case 3:
            score += 0.25 * point
            break
        }
      } else {
        if (el.answerCount === quizAnswerCount) incorrectCount++
      }
    })

    return Math.floor(score)
  }

  /**
   *
   * @param studentId
   * @param studentHistoryId
   * @param bookTye
   * @param step
   * @param quizId
   * @param quizNo
   * @param currentQuizNo
   * @param correct
   * @param selectedAnswer
   * @param tryCount
   * @param maxQuizCount
   * @param quizLength
   * @param isCorrect
   * @param answerData
   * @param isEnabledPenalty?
   * @param isFinishStudy?
   * @returns answerData Object
   */
  const makeUserAnswerData = ({
    mobile,
    studyId,
    studentHistoryId,
    bookType,
    step,
    quizId,
    quizNo,
    currentQuizNo,
    correct,
    selectedAnswer,
    tryCount,
    maxQuizCount,
    quizLength,
    isCorrect,
    answerData,
    isEnabledPenalty,
    isFinishStudy,
  }: UserAnswerDataProps): IUserAnswer => {
    let userAnswer: IUserAnswer

    if (currentQuizNo + 1 > quizLength) {
      // 다음 문제가 없는 경우
      if (isCorrect) {
        // 정답인 경우
        const score = getScore(answerData, quizLength, maxQuizCount)

        // 유저 답안
        userAnswer = {
          mobile: mobile,
          studyId: studyId,
          studentHistoryId: studentHistoryId,
          bookType: bookType,
          step: `${step}`,
          quizId: quizId,
          quizNo: quizNo,
          currentQuizNo: currentQuizNo,
          correct: correct,
          studentAnswer: selectedAnswer,
          answerCount: tryCount,
          isLastQuiz: true,
          score: score,
          isFinishStudy: isFinishStudy,
        }
      } else {
        // 오답인 경우
        if (tryCount >= maxQuizCount) {
          // 오답인데 기회를 다 소진한 경우
          const score = getScore(answerData, quizLength, maxQuizCount)

          // 유저 답안
          userAnswer = {
            mobile: mobile,
            studyId: studyId,
            studentHistoryId: studentHistoryId,
            bookType: bookType,
            step: `${step}`,
            quizId: quizId,
            quizNo: quizNo,
            currentQuizNo: currentQuizNo,
            correct: correct,
            studentAnswer: selectedAnswer,
            answerCount: tryCount,
            isLastQuiz: true,
            score: score,
            isEnabledPenalty: isEnabledPenalty,
            isFinishStudy: isFinishStudy,
          }
        } else {
          // 오답이지만 기회가 남아있는 경우
          // 유저 답안
          userAnswer = {
            mobile: mobile,
            studyId: studyId,
            studentHistoryId: studentHistoryId,
            bookType: bookType,
            step: `${step}`,
            quizId: quizId,
            quizNo: quizNo,
            currentQuizNo: currentQuizNo,
            correct: correct,
            studentAnswer: selectedAnswer,
            answerCount: tryCount,
          }
        }
      }
    } else {
      // 다음 문제가 있는 경우
      if (isEnabledPenalty) {
        // 패널티가 있는 학습
        // 유저 답안
        userAnswer = {
          mobile: mobile,
          studyId: studyId,
          studentHistoryId: studentHistoryId,
          bookType: bookType,
          step: `${step}`,
          quizId: quizId,
          quizNo: quizNo,
          currentQuizNo: currentQuizNo,
          correct: correct,
          studentAnswer: selectedAnswer,
          answerCount: tryCount,
          isEnabledPenalty: tryCount >= maxQuizCount ? true : undefined,
        }
      } else {
        // 패널티가 없는 학습
        // 유저 답안
        userAnswer = {
          mobile: mobile,
          studyId: studyId,
          studentHistoryId: studentHistoryId,
          bookType: bookType,
          step: `${step}`,
          quizId: quizId,
          quizNo: quizNo,
          currentQuizNo: currentQuizNo,
          correct: correct,
          studentAnswer: selectedAnswer,
          answerCount: tryCount,
        }
      }
    }

    return userAnswer
  }

  /**
   *
   * @param studentId
   * @param studentHistoryId
   * @param bookTye
   * @param step
   * @param quizNo
   * @param quizId
   * @param currentQuizNo
   * @param correct
   * @param selectedAnswer
   * @param tryCount
   * @param maxQuizCount
   * @param quizLength
   * @param isCorrect
   * @param answerData
   * @param isFinishStudy
   * @param isEnabledPenalty
   * @returns answerData Object
   */
  const makeUserPartialAnswerData = ({
    mobile,
    studyId,
    studentHistoryId,
    bookType,
    step,
    quizId,
    quizNo,
    currentQuizNo,
    correct,
    selectedAnswer,
    partialRecord,
    tryCount,
    maxQuizCount,
    quizLength,
    isCorrect,
    answerData,
    isEnabledPenalty,
    isFinishStudy,
  }: UserPartialAnswersDataProps): IUserAnswerPartial => {
    let userAnswer: IUserAnswerPartial

    if (currentQuizNo + 1 > quizLength) {
      // 다음 문제가 없는 경우
      if (isCorrect) {
        // 정답인 경우
        const score = getScore(answerData, quizLength, maxQuizCount)

        // 유저 답안
        userAnswer = {
          mobile: mobile,
          studyId: studyId,
          studentHistoryId: studentHistoryId,
          bookType: bookType,
          step: `${step}`,
          quizId: quizId,
          quizNo: quizNo,
          currentQuizNo: currentQuizNo,
          correct: correct,
          studentAnswer: selectedAnswer,
          partialRecord: partialRecord,
          answerCount: tryCount,
          isLastQuiz: true,
          score: score,
          isFinishStudy: isFinishStudy,
        }
      } else {
        // 오답인 경우
        if (tryCount >= maxQuizCount) {
          // 오답인데 기회를 다 소진한 경우
          const score = getScore(answerData, quizLength, maxQuizCount)

          // 유저 답안
          userAnswer = {
            mobile: mobile,
            studyId: studyId,
            studentHistoryId: studentHistoryId,
            bookType: bookType,
            step: `${step}`,
            quizId: quizId,
            quizNo: quizNo,
            currentQuizNo: currentQuizNo,
            correct: correct,
            studentAnswer: selectedAnswer,
            partialRecord: partialRecord,
            answerCount: tryCount,
            isLastQuiz: true,
            score: score,
            isEnabledPenalty: isEnabledPenalty,
            isFinishStudy: isFinishStudy,
          }
        } else {
          // 오답이지만 기회가 남아있는 경우
          // 유저 답안
          userAnswer = {
            mobile: mobile,
            studyId: studyId,
            studentHistoryId: studentHistoryId,
            bookType: bookType,
            step: `${step}`,
            quizId: quizId,
            quizNo: quizNo,
            currentQuizNo: currentQuizNo,
            correct: correct,
            studentAnswer: selectedAnswer,
            partialRecord: partialRecord,
            answerCount: tryCount,
          }
        }
      }
    } else {
      // 다음 문제가 있는 경우
      // 유저 답안
      userAnswer = {
        mobile: mobile,
        studyId: studyId,
        studentHistoryId: studentHistoryId,
        bookType: bookType,
        step: `${step}`,
        quizId: quizId,
        quizNo: quizNo,
        currentQuizNo: currentQuizNo,
        correct: correct,
        studentAnswer: selectedAnswer,
        partialRecord: partialRecord,
        answerCount: tryCount,
        isEnabledPenalty: tryCount >= maxQuizCount ? true : undefined,
      }
    }

    return userAnswer
  }

  const resetStudentAnswer = () => {
    setScoreBoardData([])
  }

  return {
    scoreBoardData,
    setStudentAnswers,
    setStudentAnswersPartial,
    addStudentAnswers,
    getScore,
    makeUserAnswerData,
    makeUserPartialAnswerData,
    resetStudentAnswer,
  }
}

const convertRecordToScoreBoard = (
  recordData: IRecordAnswerType[],
  maxQuizCount: number,
): IScoreBoardData[] => {
  let convertedData: IScoreBoardData[] = []

  recordData.map((data) => {
    convertedData.push({
      quizNo: data.CurrentQuizNo,
      maxCount: maxQuizCount,
      answerCount: data.AnswerCount,
      ox: data.OX === '1' ? true : false,
    })
  })

  return convertedData
}

const convertPartialRecordToScoreBoard = (
  recordData: IRecordAnswerType[],
  maxQuizCount: number,
): IScoreBoardData[] => {
  let convertedData: IScoreBoardData[] = []
  let quizNo = 1

  recordData.map((record) => {
    record.StudentAnswer.split(',').map((data) => {
      const lastAnswer = data.charAt(data.length - 1)

      convertedData.push({
        quizNo: quizNo++,
        maxCount: maxQuizCount,
        answerCount: data.split('').length,
        ox: lastAnswer === '1' ? true : false,
      })
    })
  })

  return convertedData
}

export {
  useStudentAnswer,
  convertRecordToScoreBoard,
  convertPartialRecordToScoreBoard,
}
