// 학습에 관련된 api
import axios from 'axios'
import { API_VERSION } from '@constants/constant'
import {
  IResultType,
  IUserAnswer,
  IRecordAnswerType,
  IUserAnswerPartial,
  IStudyData,
  IUserAnswerWriting,
  IDeletePenaltyType,
  IResultPreference,
} from '@interfaces/Common'
import { IStudyInfo } from '@interfaces/IStudyInfo'
import { BookInfo } from '@interfaces/IBookInfo'
import { PageProps } from '@interfaces/IStory'

const HOST = import.meta.env.VITE_HOST

/** 유저가 선택한 답안을 서버에 저장한 후 오류가 없다면 결과값을 반환한다.
 * @param userAnswer 유저의 답안 정보
 * */
const saveUserAnswer = async (
  userAnswerData: IUserAnswer,
): Promise<IResultType> => {
  const path = 'study/save'

  const result: IResultType = await axios
    .post(`${HOST}/${API_VERSION}/${path}`, userAnswerData, {
      headers: {
        Authorization: getToken(),
      },
    })
    .then((res) => res.data)

  return result
}

/** 유저가 선택한 답안을 서버에 저장한 후 오류가 없다면 결과값을 반환한다.
 * @param userAnswer 유저의 답안 정보
 * */
const saveUserAnswerPartial = async (
  userAnswerData: IUserAnswerPartial,
): Promise<IResultType> => {
  const path = 'study/save-partial-record'

  const result: IResultType = await axios
    .post(`${HOST}/${API_VERSION}/${path}`, userAnswerData, {
      headers: {
        Authorization: getToken(),
      },
    })
    .then((res) => res.data)

  return result
}

/**
 * Vocabulary Practice 저장
 */
const saveVocaPractice = async () => {
  const path = 'study/save-vocabulary-practice'

  // const result: IResultType = await axios
  //   .post(`${HOST}/${API_VERSION}/${path}`, userAnswerData, {
  //     headers: {
  //       Authorization: getToken(),
  //     },
  //   })
  //   .then((res) => res.data)

  // console.log(result)

  // return result
}

/**
 * Writing Activity2 저장
 * save type에 의하여 동작이 결정된다.
 * S:첨삭용 제출, E:첨삭안하고 글 제출, R:글 안쓰고 마침, X:임시저장
 */
const saveWritingActivity = async (
  userAnswerData: IUserAnswerWriting,
): Promise<IResultType> => {
  const path = 'study/save-writing'

  const result: IResultType = await axios
    .post(`${HOST}/${API_VERSION}/${path}`, userAnswerData, {
      headers: {
        Authorization: getToken(),
      },
    })
    .then((res) => res.data)

  return result
}

/** [ 기록된 학습 데이터를 가지고오는 함수 ]
 * @param path api 서버로 보낼 path값
 * return
 * recordedData 학습 정보가 담긴 데이터
 * */
const loadRecordedData = async (
  step: number | string,
  props: IStudyData,
): Promise<any> => {
  const recordedData: IRecordAnswerType[] = await axios
    .get(
      `${HOST}/${API_VERSION}/study/record/${step}?studyId=${props.studyId}&studentHistoryId=${props.studentHistoryId}`,
      {
        headers: {
          Authorization: getToken(),
        },
      },
    )
    .then((res) => res.data)

  return recordedData
}

/** [ 패널티 완료 후 결과 저장 ]
 *
 */
const deletePenalty = async (userInfo: IDeletePenaltyType) => {
  const penaltyState: IResultType = await axios
    .post(`${HOST}/${API_VERSION}/study/clear-penalty`, userInfo, {
      headers: {
        Authorization: getToken(),
      },
    })
    .then((res) => res.data)

  return penaltyState
}

/** [ 학습 완료 후 저장 ]
 * @param resultData api 서버로 보낼 data
 * @param path api 서버로 보낼 path값
 *
 * return  통신 완료 후 상태
 * */
const saveStudyData = async (path: string): Promise<IResultType> => {
  // study/save
  const result: IResultType = await axios
    .get(`${HOST}/${API_VERSION}/${path}`, {
      headers: {
        Authorization: getToken(),
      },
    })
    .then((res) => res.data)

  return result
}

/** [ 패널티 저장 ]
 *
 * return
 * 통신 완료 후 상태
 */
const savePenalty = async (penaltyData: object): Promise<number> => {
  // todo 데이터에 따라 로직 개발

  return 200
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Quiz 데이터 조회
 * @param path
 * @param transformType JSON 객체를 Quiz 객체로 전환하는 함수
 * @returns 변환된 Quiz 객체
 */
async function getQuizData<T>(
  path: string,
  transformType: (rawData: any) => Promise<T>,
): Promise<T> {
  const requestUrl = `${HOST}/${API_VERSION}/${path}`
  let quiz: T

  try {
    const response = await axios.get(requestUrl, {
      headers: {
        Authorization: getToken(),
      },
    })

    if (response.status >= 200 && response.status < 300) {
      const responseData: any = response.data
      quiz = await transformType(responseData)
    } else {
      throw new Error('QuizData Load Failed 1')
    }
  } catch (error: any) {
    console.log(error)
    throw new Error('QuizData Load Failed 2')
  }
  return quiz
}

// 힌트
async function getHint<T>(
  path: string,
  transformType: (rawData: any) => Promise<T>,
): Promise<T> {
  const requestUrl = `${HOST}/${API_VERSION}/${path}`
  let quiz: T
  try {
    const response = await axios.get(requestUrl, {
      headers: {
        Authorization: getToken(),
      },
    })
    if (response.status >= 200 && response.status < 300) {
      const responseData: any = response.data
      quiz = await transformType(responseData)
    } else {
      throw new Error('API Load Failed 1')
    }
  } catch (error: any) {
    console.log(error)
    throw new Error('API Load Failed 2')
  }
  return quiz
}

// study info 가져오기
async function getStudyInfo(
  studyId: string,
  studentHistoryId: string,
  bookType: string,
): Promise<IStudyInfo> {
  const requestUrl = `${HOST}/${API_VERSION}/study/${bookType}?studentHistoryId=${studentHistoryId}&studyId=${studyId}`
  let studyInfo: IStudyInfo

  try {
    const res = await axios.get(requestUrl, {
      headers: {
        Authorization: getToken(),
      },
    })

    if (res.status >= 200 && res.status < 300) {
      const response = res.data

      studyInfo = await response
    } else {
      throw new Error('API Load Failed 1')
    }
  } catch (err) {
    console.log(err)
    throw new Error('API Load Failed 2')
  }

  return studyInfo
}

// book info 가져오기
async function getBookInfo(
  studyId: string,
  studentHistoryId: string,
  levelRoundId: string,
): Promise<BookInfo> {
  const requestUrl = `${HOST}/${API_VERSION}/library/book-info?studentHistoryId=${studentHistoryId}&studyId=${studyId}&levelRoundId=${levelRoundId}`

  let bookInfo: BookInfo

  try {
    const res = await axios.get(requestUrl, {
      headers: {
        Authorization: getToken(),
      },
    })

    if (res.status >= 200 && res.status < 300) {
      const response = res.data

      bookInfo = await response
    } else {
      throw new Error('API Load Failed 1')
    }
  } catch (err) {
    console.log(err)
    throw new Error('API Load Failed 2')
  }

  return bookInfo
}

/**
 * story 정보 가져오기
 * @param studyId
 * @param studentHistoryId
 * @returns
 */
async function getStoryInfo(
  studyId: string,
  studentHistoryId: string,
): Promise<PageProps[]> {
  const requestUrl = `${HOST}/${API_VERSION}/study/quiz/ebook-story?studentHistoryId=${studentHistoryId}&studyId=${studyId}`
  let storyInfo: PageProps[]

  try {
    const res = await axios.get(requestUrl, {
      headers: {
        Authorization: getToken(),
      },
    })

    if (res.status >= 200 && res.status < 300) {
      const response = res.data

      storyInfo = await response
    } else {
      throw new Error('Get Story Data Failed 1')
    }
  } catch (e) {
    console.log(e)
    throw new Error('Get Story Data Failed 2')
  }

  return storyInfo
}

/**
 * 별점 주기
 * @param studyId
 * @param studentHistoryId
 * @param preference
 */
async function submitPreference(
  studyId: string,
  studentHistoryId: string,
  preference: number,
): Promise<IResultPreference> {
  const requestUrl = `${HOST}/${API_VERSION}/study/preference`
  let result: IResultPreference = { success: false }

  try {
    const res = await axios.post(
      requestUrl,
      {
        studyId: studyId,
        studentHistoryId: studentHistoryId,
        preference: preference,
      },
      {
        headers: {
          Authorization: getToken(),
          'Content-Type': 'application/json',
        },
      },
    )

    if (res.status >= 200 && res.status < 300) {
      const response = await res.data

      if (response.success) {
        result = response
      } else {
        throw new Error('Post Preference Failed 1')
      }
    } else {
      throw new Error('Post Preference Failed 1')
    }
  } catch (e) {
    console.log(e)
  }

  return result
}

/**
 * 책을 끝까지 읽은 후 디비에 저장하는 함수
 */
async function submitReadingCompleted() {}

/**
 * 무비북을 시청한 후 디비에 저장하는 함수
 */
async function submitMovieWatched() {}

/**
 * @returns 토큰
 */
const getToken = () => {
  const token: string = `Bearer ` + (window as any).REF.Token

  return token
}

export {
  loadRecordedData,
  saveUserAnswer,
  saveUserAnswerPartial,
  saveStudyData,
  saveVocaPractice,
  deletePenalty,
  saveWritingActivity,
  savePenalty,
  getQuizData,
  getHint,
  getStudyInfo,
  getBookInfo,
  getStoryInfo,
  submitPreference,
}
