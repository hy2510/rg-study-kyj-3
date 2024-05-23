// 오디오 기능
interface AudioProps {
  playAudio: (pageNumber: number, seq: number) => void
  pauseAudio: () => void
  resumeAudio: () => void
  changePlaySpeed: (speed: number) => void
  changeDuration: (pageNumber: number, seq: number) => void
  changeVolume: (volume: number) => void
  changePageNumber: (pageNumber: number) => void
}

// 이미지 사이즈
interface ImgSize {
  width: number
  height: number
}

// eBook Story
interface StoryProps {
  isRatingShow: boolean
  isMovieShow: boolean
  storyData: PageProps[]
  imgSize: ImgSize
  pageScale: number
  changeRatingShow: (state: boolean) => void
  toggleMovieShow: (isShow: boolean) => void
}
interface StoryMobileProps {
  isRatingShow: boolean
  isMovieShow: boolean
  storyData: PageProps[]
  changeRatingShow: (state: boolean) => void
  toggleMovieShow: (isShow: boolean) => void
}

// 페이지 정보
type PageState = '' | 'play' | 'left' | 'right'
type PageProps = {
  BookId: string
  Page: number
  Css: string
  Contents: string
  FontColor: string
  ImagePath: string
  Sequence: number
  StartTime: number
  EndTime: number
  SoundPath: string
  SoundPath2: string
  MarginTop: number
}

// speak
interface SpeakProps {
  pageData: PageProps[]
  imgSize: ImgSize
  pageScale: number
}

type SpeakPageProps = {
  pageSeq: PageSequenceProps
  pageNumber: number
  pageScale: number
  pageData: PageProps[]
  currentTime: number
  clickSentence: (page: number, sequence: number) => void
}

type StoryPageProps = {
  isTextShow: boolean
  pageSeq: PageSequenceProps
  pageNumber: number
  storyData: PageProps[]
  currentTime: number
  readCnt: number
  isHighlight: boolean
  clickSentence: (page: number, sequence: number) => void
}

type PageSequenceProps = {
  playPage: number
  sequnce: number
}
// 페이지 정보 end

type StoryMenuItemProps = {
  name: string
  selected: '' | 'on'
}

type StoryMenuSpeedItemProps = {
  rate: number
  selected: '' | 'on'
}

// 오디오 상태
type PlayState = '' | 'play' | 'stop' | 'pause' | 'resume'

export type {
  ImgSize,
  StoryProps,
  StoryMobileProps,
  SpeakProps,
  PageProps,
  StoryPageProps,
  SpeakPageProps,
  PageSequenceProps,
  StoryMenuItemProps,
  StoryMenuSpeedItemProps,
  PlayState,
  PageState,
}
