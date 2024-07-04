import { useContext, useState, useEffect } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'
import { getStoryInfo } from '@services/studyApi'

import { PageProps } from '@interfaces/IStory'

import useStoryImagePreload from '@hooks/story/useImagePreload'

import '@stylesheets/fonts/font.scss'
import EBCSS from '@stylesheets/e-book.module.scss'

import useDeviceDetection from '@hooks/common/useDeviceDetection'

import StoryPC from '@pages/story/StoryPC'
import StoryMoblie from '@pages/story/StoryMobile'

import PopupEBookRating from '@components/story/PopupEBookRating'
import MovieBook from '@components/story/MovieBook'
import MobileDetect from 'mobile-detect'

const md = new MobileDetect(navigator.userAgent)
const isMobile = useDeviceDetection()

export default function EBook() {
  const { bookInfo, studyInfo } = useContext(AppContext) as AppContextProps
  const [storyData, setStoryData] = useState<PageProps[]>()
  const [isRatingShow, setRatingShow] = useState(false)
  const [isMovieShow, setMovieShow] = useState(false)

  // img preload
  const { imgSize, preloadImage } = useStoryImagePreload()

  // 화면 사이즈
  const [windowHeight, setWindowHeight] = useState(window.innerHeight)
  const [pageScale, setPageScale] = useState<number>(1)

  useEffect(() => {
    const getStoryData = async () => {
      const data = await getStoryInfo(
        studyInfo.studyId,
        studyInfo.studentHistoryId,
      )

      if (data) {
        setStoryData(data)
        preloadImage(data)
      }
    }

    if (!storyData) getStoryData()
  }, [storyData])

  // 창 크기가 변경되거나 가로/세로가 변경되는 등의 행위가 일어나면
  useEffect(() => {
    // console.log(isMobile)
    const resizeHandler = () => {
      if (md.phone()) {
        setWindowHeight(window.innerHeight)
        setPageScale(screen.width / imgSize.width)
      } else {
        setWindowHeight(window.innerHeight)
        setPageScale((window.innerHeight / imgSize.height) * 0.9)
      }
    }

    resizeHandler()

    // resize시 넓이 / 높이 조절
    window.addEventListener('resize', resizeHandler)

    return () => {
      window.removeEventListener('resize', resizeHandler)
    }
  }, [isMobile, imgSize, windowHeight])

  /**
   * 별점 주기
   * @param isShow
   */
  const changeRatingShow = (state: boolean) => {
    setRatingShow(state)
  }

  /**
   * movie book
   * @param isShow
   */
  const toggleMovieShow = (isShow: boolean) => {
    setMovieShow(isShow)
  }

  if (!storyData) return <>Loading...</>

  // 디폴트 화면
  return (
    <>
      {/* 배경 이미지는 해당 eBook의 추천 도서에서 사용되는 배경 이미지가 나와야 함 */}
      <div
        className={EBCSS.ebook}
        style={{
          backgroundImage: `url('${bookInfo.BackgroundImage}')`,
          height: windowHeight,
        }}
      >
        {/* 웹인지 모바일인지 */}
        {!md.phone() ? (
          <StoryPC
            isRatingShow={isRatingShow}
            isMovieShow={isMovieShow}
            storyData={storyData}
            imgSize={imgSize}
            pageScale={pageScale}
            changeRatingShow={changeRatingShow}
            toggleMovieShow={toggleMovieShow}
          />
        ) : (
          <StoryMoblie
            isRatingShow={isRatingShow}
            isMovieShow={isMovieShow}
            storyData={storyData}
            changeRatingShow={changeRatingShow}
            toggleMovieShow={toggleMovieShow}
          />
        )}
      </div>

      {/* rating */}
      {isRatingShow && <PopupEBookRating changeRatingShow={changeRatingShow} />}

      {/* movie */}
      {isMovieShow && <MovieBook toggleMovieShow={toggleMovieShow} />}
    </>
  )
}
