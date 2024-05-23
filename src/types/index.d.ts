export {}

declare global {
  interface Window {
    onFinishStudyResult: (
      id: number,
      cause: string | undefined,
      character: string,
    ) => void

    onExitStudy: () => void

    LevelRoundId: string
  }
}
