import { useContext, useEffect, useState } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'
import EBookContainer from './EBookContainer'
import PBookContainer from './PBookContainer'

type ViewName = 'ebook' | 'pbook' | 'error'

const StudyContainer: React.FC<{}> = () => {
  const { studyInfo } = useContext(AppContext) as AppContextProps

  // 초기 Conatainer 설정 (EB / PB / error)
  let initViewName: ViewName = 'error'

  if (studyInfo.bookType === 'EB') {
    initViewName = 'ebook'
  } else if (studyInfo.bookType === 'PB') {
    initViewName = 'pbook'
  }

  const viewName = initViewName

  // 리뷰모드 알림 팝업
  const [reviewInformSee, setReviewInformSee] = useState<boolean>(false)

  // 리뷰 팝업 닫기
  const onCloseReviewInform = () => {
    setReviewInformSee(true)
  }

  // EBook / PBook 분기처리
  let component: React.ReactElement | undefined = undefined

  if (viewName === 'ebook') {
    component = <EBookContainer />
  } else if (viewName === 'pbook') {
    component = <PBookContainer />
  }

  return (
    <div>
      {!studyInfo.isSuper && studyInfo.isReview && !reviewInformSee ? (
        <ReviewPopup onUpdateReviewInform={onCloseReviewInform} />
      ) : (
        component
      )}
    </div>
  )
}
export default StudyContainer

function ReviewPopup({
  onUpdateReviewInform,
}: {
  onUpdateReviewInform: () => void
}) {
  return (
    <div
      style={{
        backgroundColor: 'skyblue',
        height: '40vh',
        textAlign: 'center',
        paddingTop: '45vh',
      }}
    >
      <span>리뷰 모드 팝업</span>
      <div>
        <button onClick={() => onUpdateReviewInform()}>확인</button>
      </div>
    </div>
  )
}
