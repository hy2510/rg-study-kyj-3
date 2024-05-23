import { useState } from 'react'

type QuizState = 'loading' | 'studying' | 'checking'

const useQuiz = () => {
  const [quizState, setQuizState] = useState<QuizState>('loading')

  const changeQuizState = (state: QuizState) => {
    if (quizState === 'checking' && state !== 'studying') return false

    setQuizState(state)
  }

  return { quizState, changeQuizState }
}

export type { QuizState }

export { useQuiz }
