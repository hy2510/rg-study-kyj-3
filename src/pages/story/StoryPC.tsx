import { useContext, useEffect, useState } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'

import { StoryProps, PageState } from '@interfaces/IStory'

import { useStoryAudioPC } from '@hooks/story/useStoryAudioPC'

import StoryHeader from '@components/story/StoryHeader'
import StoryBody from '@components/story/StoryBody'
import StoryPage from '@components/story/common/StoryPage'
import StoryPageController from '@components/story/StoryPageController'
import StoryBottomMenu from '@components/story/StoryBottomMenu'
import StorySideMenu from '@components/story/common/StorySideMenu'
import EBookVocaNote from '@components/story/EBookVocaNote'

export default function StoryPC({
  isRatingShow,
  isMovieShow,
  storyData,
  imgSize,
  pageScale,
  changeRatingShow,
  toggleMovieShow,
}: StoryProps) {
  const { handler } = useContext(AppContext) as AppContextProps

  /**
   * 헤더 메뉴 클릭하는 기능
   */
  const changeSideMenu = (state: boolean) => {
    setSideOpen(state)
  }

  // audio
  const {
    pageNumber,
    playState,
    pageSeq,
    currentTime,
    readCnt,
    playAudio,
    pauseAudio,
    pauseAudioByWord,
    resumeAudio,
    changePlaySpeed,
    changeDuration,
    changeVolume,
    changePageNumber,
    changeAutoNextPage,
  } = useStoryAudioPC({
    pageData: storyData,
    storyMode: handler.storyMode,
    changeSideMenu: changeSideMenu,
    changeStoryMode: handler.changeStoryMode,
  })

  const [pageState, setPageState] = useState<PageState>('')

  // 우상단 3줄 메뉴
  const [isSideOpen, setSideOpen] = useState<boolean>(false)

  // 좌측 하단 드랍다운 메뉴
  const [isTextShow, setIsText] = useState<boolean>(true)
  const [isMute, setIsMute] = useState<boolean>(false)
  const [isHighlight, setIsHighlight] = useState<boolean>(true)

  // 우측 하단 전체 화면 메뉴
  const [isVocaOpen, setVocaOpen] = useState<boolean>(false)
  const [isFullScreen, setFullScreen] = useState<boolean>(false)

  const progressWidth =
    ((pageNumber + 1) / storyData[storyData.length - 1].Page) * 100

  useEffect(() => {
    if (isRatingShow || isMovieShow) pauseAudio()

    if (!isRatingShow && playState === 'pause') resumeAudio()
  }, [isRatingShow, isMovieShow])

  // 페이지 넘버가 바뀌면
  useEffect(() => {
    setPageState('')
  }, [pageNumber])

  // 좌우 화살표 클릭시
  useEffect(() => {
    if (storyData) {
      switch (pageState) {
        case 'play':
          break

        case 'left':
          if (handler.storyMode === 'Story') {
            changePageNumber(pageNumber - 2)
          }
          break

        case 'right':
          if (handler.storyMode === 'Story') {
            changePageNumber(pageNumber + 2)
          }
          break
      }
    }
  }, [pageState])

  // 오디오 음소거
  useEffect(() => {
    changeVolume(isMute ? 0 : 1)
  }, [isMute])

  // 전체 화면
  useEffect(() => {
    const onFullscreenHandler = () => {
      if (document.fullscreenElement) {
        setFullScreen(true)
      } else {
        setFullScreen(false)
      }
    }

    document.body.addEventListener('fullscreenchange', onFullscreenHandler)

    return () => {
      document.body.removeEventListener('fullscreenchange', onFullscreenHandler)
    }
  }, [document.fullscreenElement])

  // eBook 페이지 넘기기 기능
  const turnPageLeft = () => {
    if (pageNumber > 1 && pageState === '' && handler.storyMode === 'Story') {
      setPageState('left')
    }
  }

  const turnPageRight = () => {
    if (
      pageNumber + 2 <= storyData[storyData.length - 1].Page &&
      pageState === '' &&
      handler.storyMode === 'Story'
    ) {
      setPageState('right')
    }
  }
  // eBook 페이지 넘기기 기능 end

  /**
   * 문장 클릭한 경우
   * @param pageNumber 페이지 번호
   * @param sequence  재생 중인 문장
   */
  const clickSentence = (pageNumber: number, sequence: number) => {
    if (handler.storyMode === 'Story') changeDuration(pageNumber, sequence)
  }

  // 좌측 하단 읽기 모드
  const changeTextShow = (isShow: boolean) => {
    setIsText(isShow)
  }

  const changeMuteAudio = (isMute: boolean) => {
    setIsMute(isMute)
  }

  const changeHighlight = (isHighlight: boolean) => {
    setIsHighlight(isHighlight)
  }
  // 좌측 하단 읽기 모드 메뉴 end

  /**
   * 단어장
   */
  const changeVocaOpen = (state: boolean) => {
    setVocaOpen(state)
  }

  return (
    <>
      {/* header */}
      <StoryHeader changeSideMenu={changeSideMenu} />

      {/* body */}
      <StoryBody>
        {/* 좌측 페이지 */}
        <StoryPage
          key={'page-1'}
          isTextShow={isTextShow}
          pageSeq={pageSeq}
          pageNumber={pageNumber}
          storyData={storyData}
          currentTime={currentTime}
          readCnt={readCnt}
          isHighlight={isHighlight}
          clickSentence={clickSentence}
        />

        {/* 우측 페이지 */}
        <StoryPage
          key={'page-2'}
          isTextShow={isTextShow}
          pageSeq={pageSeq}
          pageNumber={pageNumber + 1}
          storyData={storyData}
          currentTime={currentTime}
          readCnt={readCnt}
          isHighlight={isHighlight}
          clickSentence={clickSentence}
        />
      </StoryBody>

      {/* 화살표 */}
      {handler.storyMode === 'Story' && (
        <StoryPageController
          turnPageLeft={turnPageLeft}
          turnPageRight={turnPageRight}
        />
      )}

      {/* 하단 메뉴바 */}
      <StoryBottomMenu
        progressWidth={progressWidth}
        pageSeq={pageSeq}
        playState={playState}
        isFullScreen={isFullScreen}
        turnPageLeft={turnPageLeft}
        turnPageRight={turnPageRight}
        changeTextShow={changeTextShow}
        changeMuteAudio={changeMuteAudio}
        changeHighlight={changeHighlight}
        changePlaySpeed={changePlaySpeed}
        changeAutoNextPage={changeAutoNextPage}
        playAudio={playAudio}
        pauseAudio={pauseAudio}
        resumeAudio={resumeAudio}
        changeVocaOpen={changeVocaOpen}
      />

      {/* 사이드 메뉴 */}
      <StorySideMenu
        isSideOpen={isSideOpen}
        changeSideMenu={changeSideMenu}
        changeRatingShow={changeRatingShow}
        toggleMovieShow={toggleMovieShow}
      />

      {/* 단어장 */}
      <EBookVocaNote
        isVocaOpen={isVocaOpen}
        playState={playState}
        changeVocaOpen={changeVocaOpen}
        pauseStoryAudio={pauseAudioByWord}
        resumeStoryAudio={resumeAudio}
      />
    </>
  )
}
