interface BookInfo {
  BookId: number
  Title: string
  Author: string
  Publisher: string
  Genre: string
  Theme: string
  PreferenceAverage: number
  BookLevel: string
  RgPoint: number
  ReadCount: number
  Pages: number
  WordCount: number
  SurfaceImage: string
  Keywords: string
  Grade: string
  ReaderLevel: string
  Synopsis: string
  BookCode: string
  StudentId: string
  StudyId: string
  StudentHistoryId: string
  StudyStatus: string
  GetRgPoint: number
  ScoreStep1: unknown | null
  ScoreStep2: unknown | null
  ScoreStep3: unknown | null
  ScoreStep4: unknown | null
  ScoreStep5: unknown | null
  ScoreStep6: unknown | null
  Average: unknown | null
  RegistDate: string
  EndDate: unknown | null
  FullEasyCode: string
  RecentlyEndDate: string
  RecentlyFullEasyCode: string
  PassCount: number
  TotalCompleteCount: number
  ClassName: string
  FullEasyYn: string
  RecommendedAge: string
  SeriesName: string
  OldBookCode: string
  OpenDate: string
  StudyStartedYn: string
  ClassId: string
  SampleYn: string
  ModifyedRgPoint: number
  AddStudyCount: number
  TodayStudyYn: string
  AssignedYn: string
  FirstFullEasyCode: string
  SecondFullEasyCode: string
  AnimationPath: unknown | null
  BookMarkYn: string
  StudentWorkSheetYn: string
  BackgroundImage: unknown | null
  WritingStatusCode: string
  RevisionStatusCode: string
  DeleteYn: string
  Price: number
  PriceCd: number
  GameLandRoundOpenYn: string
  ReadingCompletedEB: string
  SpeakPassYn: string
  HighlightDataYn: string
  WorkSheetPath: string
  VocabularyPath: string
  ReportPath: string
  InfoType: string
  StudyMode: string
  StudyTypeFullEasyYn: boolean
  SecondRgPoint: number
  UserRgPoint: number
  SpeakContentYn: boolean
  LevelRoundId: string
}

export type { BookInfo }
