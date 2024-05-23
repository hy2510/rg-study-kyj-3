import { Mode } from '@interfaces/Types'
import { filter, shuffle } from 'lodash'

const useExample = () => {
  const exampleManager = {
    /** [ quizNo에 따라 예제 데이터들을 가져오기 ]
     * @quizzes 예제 데이터
     * @quizNo 퀴즈 번호
     * @mode 학생, 관리자, 리뷰
     */
    getExamplesByQuizNo: <T>(
      quizzes: T[],
      quizNo: number,
      mode: Mode | boolean = 'Quiz',
    ): T[] => {
      const quizData: T[] = filter(
        quizzes,
        (quiz, index) => index >= quizNo - 1,
      )

      if (mode === 'Quiz') {
        return shuffle(quizData)
      } else {
        return quizData
      }
    },

    /** [ quizNo에 따라 예제 데이터 "하나" 가져오기 ]
     * @quizzes 예제 데이터
     * @quizNo 퀴즈 번호
     * @mode 학생, 관리자, 리뷰
     */
    // getExampleByQuizNo: <T extends R, R>(
    //   quizzes: T[],
    //   quizNo: number,
    //   mode: Mode = 'quiz',
    // ): R | Error => {
    //   const quizData: T[] = filter(
    //     quizzes,
    //     (quiz, index) => index >= quizNo - 1,
    //   )

    //   if (quizData.length > 0) {
    //     const example: R = quizData[0]
    //     return example
    //   } else {
    //     return new Error('No Example Data Error')
    //   }
    // },
  }

  return { exampleManager }
}

export { useExample }
