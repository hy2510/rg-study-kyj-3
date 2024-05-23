import { ACTIVITY, API_VERSION } from '@constants/constant'
import { IStudyData } from '@interfaces/Common'

const getStudyInfoPath = (
  studyId: string,
  studentHistoryId: string,
  bookType: string,
): string => {
  const params = `studentHistoryId=${studentHistoryId}&studyId=${studyId}`
  return `${API_VERSION}/study/${bookType}?${params}`
}

const getQuizPath = (activityName: string, study: IStudyData): string => {
  let typeName = ''
  switch (activityName) {
    case ACTIVITY.LISTENING_1:
      typeName = 'listening-activity-1'
      break
    case ACTIVITY.LISTENING_2:
      typeName = 'listening-activity-2'
      break
    case ACTIVITY.LISTENING_3:
      typeName = 'listening-activity-3'
      break
    case ACTIVITY.LISTENING_4:
      typeName = 'listening-activity-4'
      break
    case ACTIVITY.VOCABULARY_PRACTICE_1:
      typeName = 'vocabulary-1-practice'
      break
    case ACTIVITY.VOCABULARY_PRACTICE_2:
      typeName = 'vocabulary-2-practice'
      break
    case ACTIVITY.VOCABULARY_PRACTICE_3:
      typeName = 'vocabulary-3-practice'
      break
    case ACTIVITY.VOCABULARY_PRACTICE_4:
      typeName = 'vocabulary-4-practice'
      break
    case ACTIVITY.VOCABULARY_TEST_1:
      typeName = 'vocabulary-1'
      break
    case ACTIVITY.VOCABULARY_TEST_2:
      typeName = 'vocabulary-2'
      break
    case ACTIVITY.VOCABULARY_TEST_3:
      typeName = 'vocabulary-3'
      break
    case ACTIVITY.VOCABULARY_TEST_4:
      typeName = 'vocabulary-4'
      break
    case ACTIVITY.READING_COMP_1:
      typeName = 'reading-comprehension-1'
      break
    case ACTIVITY.READING_COMP_2:
      typeName = 'reading-comprehension-2'
      break
    case ACTIVITY.READING_COMP_3:
      typeName = 'reading-comprehension-3'
      break
    case ACTIVITY.READING_COMP_4:
      typeName = 'reading-comprehension-4'
      break
    case ACTIVITY.SUMMARY_1:
      typeName = 'summary-1'
      break
    case ACTIVITY.SUMMARY_2:
      typeName = 'summary-2'
      break
    case ACTIVITY.TRUE_OR_FALSE:
      typeName = 'true-or-false'
      break
    case ACTIVITY.CLOZE_1:
      typeName = 'cloze-test-1'
      break
    case ACTIVITY.CLOZE_2:
      typeName = 'cloze-test-2'
      break
    case ACTIVITY.CLOZE_3:
      typeName = 'cloze-test-3'
      break
    case ACTIVITY.WRITING_1:
      typeName = 'writing-activity-1'
      break
    case ACTIVITY.WRITING_2:
      typeName = 'writing-activity-2'
      break
  }
  const { bookType, studyId, studentHistoryId } = study
  const params = `studentHistoryId=${studentHistoryId}&studyId=${studyId}&bookType=${bookType}`
  return `${API_VERSION}/study/quiz/${typeName}?${params}`
}

const getRecordPath = (step: string, study: IStudyData): string => {
  const { studyId, studentHistoryId } = study
  const params = `studentHistoryId=${studentHistoryId}&studyId=${studyId}`
  return `${API_VERSION}/study/record/${step}?${params}`
}
export { getStudyInfoPath, getQuizPath, getRecordPath }
