import { ReactElement, useContext, useState } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'
import QuizContainer from '../containers/QuizContainer'

type ViewName = 'quiz' | 'wait'
type RatingStatus = 'complete' | 'show'

const PBookIntro: React.FC<{}> = (s) => {
  const { studyInfo } = useContext(AppContext) as AppContextProps

  // 당일 재학습 불가
  const onStartQuizFailed = () => {
    if (studyInfo.availableQuizStatus === 1) {
      alert('ReTest 정책으로 당일 재학습 불가')
      //TODO - 학습 종료
    } else if (studyInfo.availableQuizStatus === 2) {
      alert('일일 획득 가능 포인트 초과')
      //TODO - 학습 종료
    }
  }

  // 시작화면 및 평점주기
  let initViewName: ViewName
  let initRatingStatus: RatingStatus
  if (studyInfo.isSuper) {
    initViewName = 'wait'
    initRatingStatus = 'show'
  } else if (studyInfo.isReview) {
    initViewName = 'quiz'
    initRatingStatus = 'complete'
  } else {
    if (studyInfo.isSubmitPreference) {
      initViewName = 'quiz'
      initRatingStatus = 'complete'
    } else if (studyInfo.availableQuizStatus === 0) {
      initViewName = 'quiz'
      initRatingStatus = 'show'
    } else {
      initViewName = 'wait'
      initRatingStatus = 'complete'
      onStartQuizFailed()
    }
  }

  const [viewName, setViewName] = useState<ViewName>(initViewName)
  const [ratingStatus, setRatingStatus] =
    useState<RatingStatus>(initRatingStatus)

  // 평점 주기
  const onUpdateBookPreference = (score: number) => {
    // 평점을 서버로 전송
    setRatingStatus('complete')
    onStartQuiz()
  }

  // 퀴즈 학습 시작
  const onStartQuiz = () => {
    if (
      studyInfo.isSuper ||
      studyInfo.isReview ||
      studyInfo.availableQuizStatus === 0
    ) {
      setViewName('quiz')
    } else {
      onStartQuizFailed()
    }
  }

  // 컴포넌트 생성
  let component: ReactElement
  if (viewName === 'wait') {
    component = <DefaultViewUI />
  } else {
    // 퀴즈 학습으로 이동
    component = <QuizContainer />
  }

  return (
    <div>
      {ratingStatus === 'show' && (
        <div>
          <div>PBookContainer</div>
          <RatingPopup onUpdateBookPreference={onUpdateBookPreference} />
        </div>
      )}
      {ratingStatus === 'complete' && component}
    </div>
  )
}
export default PBookIntro

function DefaultViewUI() {
  return <div> Default </div>
}

function RatingPopup({
  onUpdateBookPreference,
}: {
  onUpdateBookPreference: (score: number) => void
}) {
  return (
    <div>
      Show 도서 별점 주기 팝업!{' '}
      <button
        onClick={() => {
          onUpdateBookPreference(20)
        }}
      >
        Set Evalation
      </button>
    </div>
  )
}
