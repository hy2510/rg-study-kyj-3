// 학습 기기
export type Mobile = '' | 'A' | 'B' | 'I' | 'J'

// 학습 모드
export type Mode = 'Super' | 'Review' | 'Quiz'

// 책 종류
export type BookType = 'PB' | 'EB'

// 학습 코드
export type StudyTypeCode = '001001' | '001006'

// 첨삭 저장 타입
export type WritingActivity2SaveType = 'S' | 'E' | 'R' | 'X'

// 저장 여부?
export type RecordOX = 'O' | 'X' | 'Nothing'

// themes
export type Theme =
  | 'theme-zoo-2'
  | 'theme-jungle'
  | 'theme-antarctica'
  | 'theme-zoo-1'
  | 'theme-farm'
  | 'theme-forest'
  | 'theme-kids-room'
  | 'theme-space'
  | 'theme-camping'
  | 'theme-season-spring'
  | 'theme-season-summer'
  | 'theme-season-autumn'
  | 'theme-season-winter'
  | 'theme-playground'
