const DOMAINS = '../speak/'

// 중요) 파일 대소문자 구별
const fileList = [
  'STT_EDU_ENG_DB/SELVY_STT_ENG2014_01.bin',
  'STT_EDU_ENG_DB/SELVY_STT_ENG2014_02.bin',
  'STT_EDU_ENG_DB/SELVY_STT_ENG2014_03.bin',
  'STT_EDU_ENG_DB/SELVY_STT_ENG_M0.BIN',
  'STT_EDU_ENG_DB/SELVY_STT_ENG_M1.BIN',
  'STT_EDU_ENG_DB/SELVY_STT_ENG_M2.BIN',
  'STT_EDU_ENG_DB/SELVY_STT_ENG_M3.BIN',
  'STT_EDU_ENG_DB/SELVY_STT_ENG_M4.BIN',
  'STT_EDU_ENG_DB/SELVY_STT_ENG_M5.BIN',
  'STT_EDU_ENG_DB/SELVY_STT_ENG_M6.BIN',
  'STT_EDU_ENG_DB/SELVY_STT_ENG_M7.BIN',
  'STT_EDU_ENG_DB/PEF_DB.bin',
  'STT_EDU_ENG_DB/g2p.dat',
  'STT_EDU_ENG_DB/selvy_grade.dat',
]

const url = new URL(document.location.href)
const search = new URLSearchParams(url.search)

const studyId = search.get('studyId')
const studentHistoryId = search.get('studentHistoryId')
const token = search.get('token')
const isMobile = JSON.parse(search.get('isMobile'))
const bookLevel = search.get('bookLevel').includes('K')
  ? 'k'
  : search.get('bookLevel').includes('1')
  ? '1'
  : '2'
const isDev = JSON.parse(search.get('isDev'))

const PASS_SCORE = 70

let userrcg
let refrcg
let recordBuffer
let userBuffer

const sentenceAudio = new Audio()
const userAudio = new Audio()
const scoreAudio = new Audio()
const resultAudio = new Audio()

let speakData = []
let quizNo = 0
let quizIndex = 0
let sentenceAudioPath
let sentence = ''

let isLoading = true
let isSentencePlaying = false
let isRecording = false
let isVoicePlaying = false

let cntSpeakLouder = 0

// 점수
let scoreOverall = 0,
  scoreWord = 0,
  scorePronunciation = 0,
  scoreProsody = 0,
  scoreIntonation = 0,
  scoreTiming = 0,
  scoreLoudness = 0

let resultMessage

$(document).ready(() => {
  if (isMobile) $('.ebook-viewer').addClass('mobile')

  // 이북 뷰어 리사이즈 (PC)
  const onResizeHandler = () => {
    if (isMobile) {
      const windowWidth = window.innerWidth
      const eBookSizeW = bookLevel === 'k' ? 480 : 525
      const eBookViewerScale = windowWidth / eBookSizeW
      const mobilePositionTopSubtractValue =
        ((windowWidth / eBookSizeW) * 750) / 2

      $('.ebook-viewer').css({
        transform: `scale(${eBookViewerScale})`,
        top: `calc(50% - ${mobilePositionTopSubtractValue + 4}px)`,
      })
    } else {
      const windowHeight = window.innerHeight
      const eBookViewerScale = (windowHeight - 92) / 750 || 1

      $('.ebook-viewer').css('transform', `scale(${eBookViewerScale})`)
    }
  }

  onResizeHandler()

  window.addEventListener('resize', function () {
    onResizeHandler()
  })
})

/**
 * 셀바스 DB install
 */
const installSelvyDB = () => {
  let idx = 0
  let fileblob = []

  const addData = function () {
    let db
    const tstamp = new Date()
    const request = window.indexedDB.open('/STT_EDU_ENG_DB', 21)

    request.onerror = function (event) {}

    request.onsuccess = function (event) {
      db = request.result
      db.close()
    }

    request.onupgradeneeded = function (event) {
      db = event.target.result
      const objectStore = db.createObjectStore('FILE_DATA')

      objectStore.createIndex('timestamp', 'timestamp', { unique: false })

      const transaction = event.target.transaction

      for (let i = 0; i < fileList.length; ++i) {
        transaction
          .objectStore('FILE_DATA')
          .put(
            { timestamp: tstamp, mode: 33206, contents: fileblob[i] },
            fileList[i],
          )
      }

      localStorage.setItem('install', 1)

      SelvySTT_Edu_ENG_Init()

      selvySetting()

      initAudio(onInitAudioSucc)
    }
  }

  const get_bin_fromFile = function (index) {
    var bin_data
    const xhr = new XMLHttpRequest()
    const addr = DOMAINS.concat(fileList[index])

    xhr.open('GET', addr, true)
    xhr.responseType = 'arraybuffer'

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status == 404) {
        }

        if (xhr.status === 200 || xhr.status == 0) {
          fileblob.push(new Uint8Array(xhr.response))
          index++

          if (index < fileList.length) {
            get_bin_fromFile(index)
          } else {
            addData()
          }
        }
      }
    }

    xhr.onerror = (e) => {
      console.log(e)
    }

    xhr.send(null)
  }

  get_bin_fromFile(idx)
}

/**
 * 셀바스 DB load
 */
const loadDB = () => {
  const DBDeleteRequest = window.indexedDB.deleteDatabase('/STT_EDU_ENG_DB')

  DBDeleteRequest.onsuccess = function (event) {
    localStorage.removeItem('install')

    installSelvyDB()
  }
}

/**
 * 셀바스 세팅
 */
const selvySetting = () => {
  SelvySTT_Edu_ENG_Check_IndexedDB()
}

const selvySetGrade = () => {
  // 난이도 : 0: Reference Data, 1:Beginner, 2: Intermediate, 3: Advanced, 4: Expert
  SelvySTT_Edu_ENG_Set_Level(Number(speakData[quizIndex].EvaluationLevel))

  //North American English: 0(Male), 1(Female), 2(Child), 3(All voice)
  //Korean English: 4(Male), 5(Female), 6(Child), 7(All voice)
  SelvySTT_Edu_ENG_Set_VoiceProfile(
    Number(speakData[quizIndex].EvaluationModel),
  )
}

const loadReference = (dataPath) => {
  // 문제별 평가 기준 세팅
  selvySetGrade()

  if (refrcg) {
    refrcg.delete()
    refrcg = null
  }

  refrcg = Recognition_Result_ENG()

  const xhr = new XMLHttpRequest()

  xhr.open('GET', dataPath)
  xhr.responseType = 'blob'

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200 || xhr.status == 0) {
        const fileBlob = xhr.response
        const reader = new FileReader()

        reader.onloadend = function (e) {
          SelvySTT_Edu_ENG_Load_From_Bytes(reader.result, refrcg, function () {
            if (refrcg.word_cnt > 0) {
              setPageData()
            }
          })
        }

        reader.readAsArrayBuffer(fileBlob)
      }
    }
  }

  xhr.send(null)
}

// 셀바스 준비가 완료되면
const onInitAudioSucc = () => {
  getQuizData(studyId, studentHistoryId)
}

/**
 * speak 문제 데이터 가져오기
 */
const getQuizData = (studyId, studentHistoryId) => {
  try {
    // 실버서 적용시 dev로 변경
    let requestUrl

    if (isDev) {
      requestUrl = `http://localhost:4000/v1/study/quiz/ebook-speak-legacy?studyId=${studyId}&studentHistoryId=${studentHistoryId}`
    } else {
      requestUrl = `https://dev.readinggate.com:54000/v1/study/quiz/ebook-speak-legacy?studyId=${studyId}&studentHistoryId=${studentHistoryId}`
    }

    fetch(requestUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Access-Control-Allow-Origin': '*',
        Authorization: getToken(),
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.length > 0) {
          speakData = data

          getQuizDataOnSucc()
        } else {
          throw new Error('No Quiz Data Error')
        }
      })
  } catch (e) {
    alert(e)
  }
}

/**
 * 퀴즈 데이터를 성공적으로 가져온 후
 */
const getQuizDataOnSucc = () => {
  for (let i = 0; i < speakData.length - 1; i++) {
    const img = new Image()
    img.src = speakData[i].ImagePath
  }

  getRecordData(studyId, studentHistoryId)
}

/**
 * speak 유저의 답안 데이터 가져오기
 */
const getRecordData = (studyId, studentHistoryId) => {
  let requestUrl

  if (isDev) {
    requestUrl = `http://localhost:4000/v1/study/speak/record?studyId=${studyId}&studentHistoryId=${studentHistoryId}`
  } else {
    requestUrl = `https://dev.readinggate.com:54000/v1/study/speak/record?studyId=${studyId}&studentHistoryId=${studentHistoryId}`
  }

  fetch(requestUrl, {
    method: 'GET',
    mode: 'cors',
    headers: {
      'Access-Control-Allow-Origin': '*',
      Authorization: getToken(),
    },
  })
    .then((response) => response.json())
    .then((recordData) => {
      let nextIndex = 0

      if (recordData.length > 0) {
        // 기록이 있는 경우
        const laseRecordedData = recordData[recordData.length - 1]

        const lastIndex = speakData.findIndex(
          (data) =>
            data.Page === laseRecordedData.Page &&
            data.Sequence === laseRecordedData.Sequence &&
            data.DataPath !== '',
        )

        nextIndex = lastIndex + 1
      }

      while (true) {
        if (
          speakData[nextIndex].Sentence !== '' &&
          speakData[nextIndex].DataPath !== ''
        ) {
          break
        }

        nextIndex++
      }

      quizIndex = nextIndex

      // 문제 평가 레퍼런스 세팅
      loadReference(speakData[quizIndex].DataPath)
    })
}

/**
 * 페이지 데이터 세팅
 */
const setPageData = () => {
  cntSpeakLouder = 0
  $('.ebook-viewer').empty()

  // 기기에 따라 보여주는 페이지의 수가 다르게 결정됨
  if (isMobile) {
    const pageInfo = getPageInfo(speakData[quizIndex].Page)

    $('.ebook-viewer').append(pageInfo.css)
    $('.ebook-viewer').append(
      `<div class="speak-ebook-page level-${bookLevel}" style="background-image: url(${pageInfo.img})">${pageInfo.sentenceHTML}</div>`,
    )
  } else {
    const infoPageLeft = getPageInfo(
      speakData[quizIndex].Page % 2 === 0
        ? speakData[quizIndex].Page - 1
        : speakData[quizIndex].Page,
    )
    const infoPageRight = getPageInfo(
      speakData[quizIndex].Page % 2 === 0
        ? speakData[quizIndex].Page
        : speakData[quizIndex].Page + 1,
    )

    $('.ebook-viewer').append(
      infoPageLeft.css +
        `<div class="speak-ebook-page level-${bookLevel}" style="background-image: url(${infoPageLeft.img})">${infoPageLeft.sentenceHTML}</div>`,
    )
    $('.ebook-viewer').append(
      infoPageRight.css +
        `<div class="speak-ebook-page level-${bookLevel}" style="background-image: url(${infoPageRight.img})">${infoPageRight.sentenceHTML}</div>`,
    )
  }

  $('.progress-bar').css('width', `${(quizIndex / speakData.length) * 100}%`)

  setCurrentSentence()
}

/**
 * 문장 밑 스타일
 * @param  pageNumber
 * @returns 문장, 스타일
 */
const getPageInfo = (pageNumber) => {
  const sentenceData = speakData.find(
    (data) => data.Page === pageNumber && data.Sequence === 1,
  )

  // image
  const img = sentenceData.ImagePath

  // css
  const cssIDReg = /\#t/g
  const pageCss = sentenceData.Css
  const css = pageCss.replace(cssIDReg, `#t_${sentenceData.Page - 2}_`)

  // sentence
  const sentenceIDReg = /id=\"t/g
  const stnReg = /stn_/g

  let sentenceHTML = sentenceData.Contents

  if (sentence.MarginTop > 0) {
    sentenceHTML = sentenceHTML.replace(
      sentenceIDReg,
      `style="margin-top:${sentence.MarginTop}px;" id="t_${
        sentenceData.Page - 2
      }_`,
    )
  } else {
    sentenceHTML = sentenceHTML.replace(
      sentenceIDReg,
      `id="t_${sentenceData.Page - 2}_`,
    )
  }
  console.log(sentenceData)
  console.log(sentenceHTML)
  //style='margin-top: ${sentence.MarginTop};'
  if (sentenceData.MarginTop) {
    sentenceHTML = sentenceHTML.replace(stnReg, `stn_${pageNumber}_`)
  } else {
    sentenceHTML = sentenceHTML.replace(stnReg, `stn_${pageNumber}_`)
  }

  return { img, css, sentenceHTML }
}

/**
 * 녹음해야 할 문장 표시
 */
const setCurrentSentence = () => {
  cntSpeakLouder = 0

  const sentenceData = speakData.find(
    (data) =>
      data.QuizNo === speakData[quizIndex].QuizNo &&
      data.Sentence !== '' &&
      data.DataPath !== '',
  )
  sentence = sentenceData.Sentence

  console.log(sentenceData)
  $('.t').css('background-color', 'transparent')

  $(`#stn_${speakData[quizIndex].Page}_${speakData[quizIndex].Sequence}`).css(
    'cursor',
    'pointer',
  )
  $(`#stn_${speakData[quizIndex].Page}_${speakData[quizIndex].Sequence}`)
    .children('.t')
    .css('background-color', sentenceData.FontColor)

  setSentenceAudio()
}

/**
 * 문장 음원 세팅
 */
const setSentenceAudio = () => {
  // 이벤트 핸들러 [
  const canPlaythroughHandler = () => {
    isLoading = false

    // 문장을 클릭하면 음원 재생
    $(`#stn_${speakData[quizIndex].Page}_${speakData[quizIndex].Sequence}`).on(
      'click',
      () => {
        if (!isRecording && !isSentencePlaying && !isVoicePlaying)
          playSentence()
      },
    )

    playSentence()

    sentenceAudio.removeEventListener('canplaythrough', canPlaythroughHandler)
  }

  const onAudioEndedHandler = () => {
    afterPlaySentence()
  }
  // ] 이벤트 핸들러 end

  // 기존 핸들러 제거
  sentenceAudio.removeEventListener('ended', onAudioEndedHandler)

  // 음원 데이터
  sentenceAudio.src = speakData[quizIndex].SoundPath

  // 핸들러 주입
  sentenceAudio.addEventListener('canplaythrough', canPlaythroughHandler)
  sentenceAudio.addEventListener('ended', onAudioEndedHandler)
}

/**
 * 문장 재생
 */
const playSentence = () => {
  if (isSentencePlaying) {
    return false
  } else {
    isSentencePlaying = true
    $('.wrapper-anims').append(getPlayBarComponent('play-sentence'))

    sentenceAudio.play()
  }
}

/**
 * 문장 재생 완료 후
 */
const afterPlaySentence = () => {
  $('.wrapper-anims').append(getPlayBarComponent('default'))
}

/**
 * 녹음 시작
 */
const startRecord = () => {
  if (isRecording) return false

  $('.wrapper-anims').append(getPlayBarComponent('recording'))

  const additionSec = sentenceAudio.duration >= 5 ? 1.4 : 1.2
  const recordDuration = Math.ceil(sentenceAudio.duration * 1000 * additionSec)

  startRecording()

  setTimeout(function () {
    stopRecord()
  }, recordDuration)
}

/**
 * 녹음 중지
 */
const stopRecord = () => {
  const practiceStart = (buffer) => {
    recordBuffer = buffer

    //Practice mode must settext with Chunk mode.
    let inputText = sentence.split(' ').join(';') + ';'
    let ret = SelvySTT_Edu_ENG_SetText(F_ENG_CHUNK, inputText)

    if (ret == R_ENG_SUCCESS) {
      ret = SelvySTT_Edu_ENG_Recognition_Batch(buffer)

      if (ret == R_ENG_SUCCESS) {
        if (userrcg != null) {
          userrcg.delete()
          userrcg = null
        }

        userrcg = Recognition_Result_ENG()
        SelvySTT_Edu_ENG_Get_Score(userrcg)

        const userEPD = SelvySTT_Edu_ENG_Get_Score_EPD_Buffer(userrcg)

        ret = SelvySTT_Edu_ENG_Assessment(
          refrcg,
          window.m_rec_buffer_ref,
          userrcg,
          userEPD,
        )

        if (ret == R_ENG_SUCCESS) {
          v = Assessment_Result_ENG()
          SelvySTT_Edu_ENG_Get_Assessment_Result(v)

          let wordTotal = 0

          for (let i = 0; i < userrcg.word_score.length; ++i) {
            wordTotal += userrcg.word_score[i]
          }

          scoreOverall = v.overall
          scoreWord = Math.round(wordTotal / userrcg.word_score.length)
          scorePronunciation = v.pronunciation_score
          scoreProsody = v.prosody_score
          scoreIntonation = v.intonation_score
          scoreTiming = v.timing_score
          scoreLoudness = v.loudness_score

          // 점수 확인 후 동작
          if (v.overall >= PASS_SCORE) {
            saveSpeakResult()
          } else {
            cntSpeakLouder++

            if (cntSpeakLouder < 3) {
              playRecord(false)
            } else {
              scoreOverall = '50'
              saveSpeakResult()
            }
          }
        } else {
          if (ret == R_ENG_ERROR_INIT) {
            // 초기화 되지 않았거나 실패
            $('.wrapper-anims').append(getPlayBarComponent('try-again'))

            playScoreSound(false, () => {
              playSentence()
            })
          } else {
            cntSpeakLouder++

            if (cntSpeakLouder < 3) {
              $('.wrapper-anims').append(getPlayBarComponent('try-again'))

              playScoreSound(false, () => {
                playSentence()
              })
            } else {
              // 3번 실패시 50점(총점)
              scoreOverall = '50'

              saveSpeakResult()
            }
          }
        }
      } else {
        if (ret == R_ENG_ERROR_INIT) {
          // 초기화 되지 않았거나 실패
          $('.wrapper-anims').append(getPlayBarComponent('try-again'))

          playScoreSound(false, () => {
            playSentence()
          })
        } else {
          cntSpeakLouder++

          if (cntSpeakLouder < 3) {
            $('.wrapper-anims').append(getPlayBarComponent('try-again'))

            playScoreSound(false, () => {
              playSentence()
            })
          } else {
            // 3번 실패시 50점(총점)
            scoreOverall = '50'

            saveSpeakResult()
          }
        }
      }
    } else {
      if (ret == R_ENG_ERROR_INIT) {
        // 초기화 되지 않았거나 실패
        $('.wrapper-anims').append(getPlayBarComponent('try-again'))

        playScoreSound(false, () => {
          playSentence()
        })
      } else {
        cntSpeakLouder++

        if (cntSpeakLouder < 3) {
          $('.wrapper-anims').append(getPlayBarComponent('try-again'))

          playScoreSound(false, () => {
            playSentence()
          })
        } else {
          // 3번 실패시 50점(총점)
          scoreOverall = '50'

          saveSpeakResult()
        }
      }
    }
  }

  stopRecording(practiceStart)
}

const saveSpeakResult = () => {
  let requestUrl

  if (isDev) {
    requestUrl = `http://localhost:4000/v1/study/speak/save`
  } else {
    requestUrl = `https://dev.readinggate.com:54000/v1/study/speak/save`
  }

  const sentenceAfterReplace = sentence.replace(/'/g, "''").replace(/"/g, '\\"')
  const isLastQuiz = speakData.findIndex(
    (data) =>
      data.QuizNo > speakData[quizIndex].QuizNo &&
      data.DataPath !== '' &&
      data.Sentence !== '',
  )

  fetch(requestUrl, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Access-Control-Allow-Origin': '*',
      Authorization: getToken(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      studyId: studyId,
      studentHistoryId: studentHistoryId,
      challengeNumber: Number(speakData[0].ChallengeNumber),
      page: speakData[quizIndex].Page,
      sequence: speakData[quizIndex].Sequence,
      quizNo: speakData[quizIndex].QuizNo,
      sentence: sentenceAfterReplace,
      scoreOverall: scoreOverall,
      scoreWord: scoreWord,
      scorePronunciation: scorePronunciation,
      scoreProsody: scoreProsody,
      scoreIntonation: scoreIntonation,
      scoreTiming: scoreTiming,
      scoreLoudness: scoreLoudness,
      isLastQuiz: isLastQuiz < 0 ? true : false,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.result === 0) {
        if (cntSpeakLouder < 3) {
          playRecord(true)
        } else {
          playRecord(false)
        }

        if (data.resultMessage) {
          resultMessage = data.resultMessage
        }
      } else {
        throw new Error(data)
      }
    })
}

/**
 * 녹음 파일 재생
 */
const playRecord = (isCorrect) => {
  if (recordBuffer) {
    // 녹음 성공
    $('.wrapper-anims').append(getPlayBarComponent('playing-user-sound'))

    userBuffer = playBuffer(recordBuffer, () => {
      if (isCorrect || cntSpeakLouder >= 3) {
        $('.wrapper-anims').append(getPlayBarComponent('good-job'))

        playScoreSound(true, () => afterPlayRecord())
      } else {
        $('.wrapper-anims').append(getPlayBarComponent('try-again'))

        playScoreSound(false, () => {
          playSentence()
        })
      }
    })
  } else {
    // 녹음 실패
    if (isCorrect || cntSpeakLouder >= 3) {
      $('.wrapper-anims').append(getPlayBarComponent('good-job'))

      playScoreSound(true, () => afterPlayRecord())
    } else {
      $('.wrapper-anims').append(getPlayBarComponent('try-again'))

      playScoreSound(false, () => {
        playSentence()
      })
    }
  }
}

/**
 * 녹음된 음원을 재생한 후
 */
const afterPlayRecord = () => {
  const nextQuizIndex = speakData.findIndex(
    (data) =>
      data.QuizNo > speakData[quizIndex].QuizNo &&
      data.Sentence !== '' &&
      data.DataPath !== '',
  )

  if (nextQuizIndex > -1) {
    quizIndex = nextQuizIndex

    setPageData()
  } else {
    // 학습 완료
    $('.wrapper-anims').append(getPlayBarComponent('default'))

    let result
    let lottieStyle = ''

    if (resultMessage === 'PASS') {
      result = 'excellent'
      lottieStyle = `width: ${isMobile ? 320 : 500}px; height: ${
        isMobile ? 160 : 350
      }px`
    } else {
      result = 'good-effort'
      lottieStyle = `width: ${isMobile ? 300 : 450}px; height: ${
        isMobile ? 300 : 450
      }px`
    }

    let resultHTML = `
    <div class='result'>
      <dvi class=group-result-mark>      
        <lottie-player
          src="./anims/${result}.json"
          autoplay="true"
          loop="true"
          style="${lottieStyle}"
        >
        </lottie-player>

        <div class='txt'>${
          result === 'excellent' ? 'Excellent' : 'Good Effort'
        }</div>

        <button class="btn-exit" onclick="window.parent.onExitStudy()"></button>
      </div>
    </div>`

    playResultSound(resultMessage)
    $('.wrapper-header').append(resultHTML)
  }
}

const playScoreSound = (isCorrect, cb) => {
  if (isCorrect) {
    scoreAudio.src = './sounds/correct.mp3'
  } else {
    scoreAudio.src = './sounds/incorrect.mp3'
  }

  const handlerCanPlayThrough = () => {
    scoreAudio.removeEventListener('canplaythrough', handlerCanPlayThrough)

    scoreAudio.play()
  }

  const handlerEnded = () => {
    scoreAudio.removeEventListener('ended', handlerEnded)

    if (cb) {
      setTimeout(() => {
        cb()
      }, 1500)
    }
  }

  scoreAudio.addEventListener('canplaythrough', handlerCanPlayThrough)
  scoreAudio.addEventListener('ended', handlerEnded)
}

const playResultSound = (passState) => {
  if (passState === 'PASS') {
    resultAudio.src = './sounds/aud_pass.mp3'
  } else {
    resultAudio.src = './sounds/aud_fail.mp3'
  }

  const handlerCanPlayThrough = () => {
    resultAudio.removeEventListener('canplaythrough', handlerCanPlayThrough)

    resultAudio.play()
  }
  resultAudio.addEventListener('canplaythrough', handlerCanPlayThrough)
}

/**
 * 하단 Play bar에 들어갈 아이콘들
 * @param playBarState
 * @returns
 */
const getPlayBarComponent = (playBarState) => {
  $('.wrapper-anims').empty()
  let htmlStr = ''

  switch (playBarState) {
    case 'default':
      // 기본
      isRecording = false
      isSentencePlaying = false
      isVoicePlaying = false

      htmlStr = `
        <div class="run-ready animate__animated animate__slideInUp">
          <button class="btn-speak-play" onclick="playSentence()">
            <div class="icon icon-play"></div>
            <div class="txt-word">Listen</div>
          </button>

          <div class="txt-some">&</div>

          <button class="btn-speak-play" onclick="startRecord()">
            <div class="icon icon-record"></div>
            <div class="txt-word">Record</div>
          </button>
        </div>`
      break

    case 'play-sentence':
      // 음원 재생
      isSentencePlaying = true

      htmlStr = `
        <div
          class="run-ebook-audio-play animate__animated animate__slideInUp"
        >
          <lottie-player
            src="./anims/audio-play.json"
            autoplay="true"
            loop="true"
            style="width: 40px; height: 40px; background: transparent"
          >
          </lottie-player>
        </div>`
      break

    case 'recording':
      // 녹음 진행
      isRecording = true

      htmlStr = `
        <div class="run-voice-record animate__animated animate__slideInUp">
          <lottie-player
            src="./anims/record.json"
            autoplay="true"
            loop="true"
            style="width: 40px; height: 40px; background: transparent"
          >
          </lottie-player>
          <div class="txt_label">REC</div>
        </div>`

      break

    case 'playing-user-sound':
      // 녹음 완료 후 유저의 목소리 재생
      isVoicePlaying = true

      htmlStr = `
        <div class="run-voice-play animate__animated animate__slideInUp">
          <div class="lottie-voice-play">
            <lottie-player
              src="./anims/user-say.json"
              autoplay="true"
              loop="true"
              style="width: 100px; height: 100px; background: transparent"
            >
            </lottie-player>
          </div>
        </div>`

      break

    case 'good-job':
      // 녹음 완료 후 유저의 목소리 재생
      htmlStr = `
        <div class="run-correct-sign animate__animated animate__slideInUp">
        Good Job!
      </div>`
      break

    case 'try-again':
      // 녹음 완료 후 유저의 목소리 재생
      htmlStr = `
      <div class="run-incorrect-sign animate__animated animate__slideInUp">
      Try Again
    </div>
    `
      break
  }

  return htmlStr
}

/**
 * @returns 토큰
 */
const getToken = () => {
  return `Bearer ` + token
}
