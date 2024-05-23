var nChannel = 1
var DBFolder = '/STT_EDU_ENG_DB/'

var LICENSE_TYPE_KEYLOCK = 0
var LICENSE_TYPE_KEYFILE = 1
var LICENSE_TYPE_KEYSTRING = 2

var PRODUCT_TYPE_STT_SERVER = 0
var PRODUCT_TYPE_STT_EMBEDDED = 1

var F_ENG_LIST = 0 // 리스트 형식
var F_ENG_CHUNK = 1 // 발화 청크 기준
var F_ENG_CHUNK_SKIP = 2 // 발화 청크 에서 skip 가능한 형식
var F_ENG_CHUNK_MP = 3 // Minimal_Pair 기능을 지원하는 형식
var F_ENG_CHUNK_SERIAL = 4 // 발화 청크 단위에서 어느단어까지 발성했는지 체크할 경우

var R_ENG_SUCCESS = 1 // Success;
var R_ENG_FAIL = 0 // 다른 동작 수행중
var R_ENG_ERROR_LICENSE = -1 // 라이선스체크 실패
var R_ENG_ERROR_INIT = -2 // 초기화 되지 않았거나 실패
var R_ENG_ERROR_SETTEXT = -3 // hci 포맷이 아닐때 settext 에러
var R_ENG_ERROR_LIMITS = -4 // ~frame 에서 800 이 아닌경우 등 제약사항 확인
var R_ENG_ERROR_TEXT = -5 // input text 가 잘못되어 있음.
var R_ENG_FAIL_ASSESSMENT = -6 //평가 실패

var RT_NORMALIZE_OPTION_1 = 1
var RT_NORMALIZE_OPTION_2 = 2
var RT_NORMALIZE_OPTION_3 = 3
var RT_NORMALIZE_OPTION_4 = 4

var stt
var gradescore

var sample1 = undefined

function SelvySTT_Edu_ENG_Init() {
  libSelvySTT().then(function (Module) {
    stt = Module
    stt.Load_IndexedDB_And_Create()
  })

  sessionStorage.setItem('returnsize', 0)
}

function SelvySTT_Edu_ENG_Check_IndexedDB() {
  //do nothing;
}

function SelvySTT_Edu_ENG_Destroy() {
  stt.SelvySTT_Edu_ENG_Destroy_Web()
  stt.delete()
  stt = null
}
function SelvySTT_Edu_ENG_SetText(mode, sentence) {
  return stt.SelvySTT_Edu_ENG_SetText_Web(mode, sentence)
}

function SelvySTT_Edu_ENG_Get_VoiceProfile() {
  return stt.SelvySTT_Edu_ENG_Get_VoiceProfile()
}
function SelvySTT_Edu_ENG_Set_VoiceProfile(parameter) {
  return stt.SelvySTT_Edu_ENG_Set_VoiceProfile(Number(parameter))
}
function SelvySTT_Edu_ENG_Get_Level() {
  return stt.SelvySTT_Edu_ENG_Get_Level()
}
function SelvySTT_Edu_ENG_Set_Level(parameter) {
  return stt.SelvySTT_Edu_ENG_Set_Level(Number(parameter))
}
function SelvySTT_Edu_ENG_Get_PauseThreshold() {
  return stt.SelvySTT_Edu_ENG_Get_PauseThreshold()
}
function SelvySTT_Edu_ENG_Set_PauseThreshold(threshold) {
  return stt.SelvySTT_Edu_ENG_Set_PauseThreshold(Number(threshold))
}
function SelvySTT_Edu_ENG_Get_TimeLimit() {
  return stt.SelvySTT_Edu_ENG_Get_TimeLimit()
}
function SelvySTT_Edu_ENG_Set_TimeLimit(timelimit) {
  return stt.SelvySTT_Edu_ENG_Set_TimeLimit(Number(timelimit))
}
function SelvySTT_Edu_ENG_Recognition_Frame(buffer, nsample, bEOS) {
  var ret = -1
  frame_proc = stt.cwrap('SelvySTT_Edu_ENG_Recognition_Frame_Web', 'number', [
    'number',
    'number',
    'number',
  ])
  var parr = stt._malloc(buffer.byteLength)
  var arr = new Uint8Array(stt.HEAP16.buffer, parr, buffer.byteLength)
  stt.HEAPU8.set(buffer, parr)
  ret = frame_proc(parr, nsample, bEOS)
  stt._free(parr)
  return ret
}

function SelvySTT_Edu_ENG_Recognition_Batch(buffer) {
  recog_batch = stt.cwrap('SelvySTT_Edu_ENG_Recognition_Batch_Web', 'number', [
    'number',
    'number',
    'number',
  ])
  var buf = new Uint8Array(buffer)
  var parr = stt._malloc(buf.byteLength)
  var arr = new Uint8Array(stt.HEAP16.buffer, parr, buf.byteLength)
  stt.HEAPU8.set(buf, parr)
  var ret = recog_batch(parr, arr.length / 2)
  stt._free(parr)
  switch (ret) {
    case 1:
      window.frame_msg = 'success'
      break
    case 2:
      window.frame_msg = 'reject'
      break
    case 3:
      window.frame_msg = 'epd_fail'
      break
    default:
      window.frame_msg = 'recognition_not_success'
  }
  return ret
}

function SelvySTT_Edu_ENG_Get_Score(rcg) {
  var ret = stt.SelvySTT_Edu_ENG_Get_Score_Web(rcg)
  if (ret != 1) {
    alert('결과를 확인할 수 없습니다.')
    return false
  } else {
    rcg.szInputText = rcg.get_szInputText()
    var result_wav = rcg['get_result_score']()
    rcg.result_score = []
    for (var i = 0; i < result_wav.size(); ++i) {
      rcg.result_score.push(result_wav.get(i))
    }
    result_wav.delete()
    var result_wav = rcg['get_result_string']()
    rcg.result_string = []
    for (var i = 0; i < result_wav.size(); ++i) {
      rcg.result_string.push(result_wav.get(i))
    }
    result_wav.delete()
    var word_wav = rcg['get_word_score']()
    rcg.word_score = []
    for (var i = 0; i < word_wav.size(); ++i) {
      rcg.word_score.push(word_wav.get(i))
    }
    word_wav.delete()
    word_wav = rcg['get_word']()
    rcg.word = []
    for (var i = 0; i < word_wav.size(); ++i) {
      rcg.word.push(word_wav.get(i))
    }
    word_wav.delete()
    word_wav = rcg['get_phoneme_cnt_in_word']()
    rcg.phoneme_cnt_in_word = []
    for (var i = 0; i < word_wav.size(); ++i) {
      rcg.phoneme_cnt_in_word.push(word_wav.get(i))
    }
    word_wav.delete()
    var phoneme_word = rcg['get_phoneme_in_word']()
    rcg.phoneme_in_word = []
    for (var i = 0; i < phoneme_word.size(); ++i) {
      rcg.phoneme_in_word.push(phoneme_word.get(i))
    }
    phoneme_word.delete()
    var phoneme_word = rcg['get_phoneme_score_in_word']()
    rcg.phoneme_score_in_word = []
    for (var i = 0; i < phoneme_word.size(); ++i) {
      var arr = phoneme_word
        .get(i)
        .slice(0, phoneme_word.get(i).length - 1)
        .split(';')
        .map((x) => Number(x))
      rcg.phoneme_score_in_word.push(arr)
    }
    phoneme_word.delete()
    var phoneme_word = rcg['get_phoneme_position_in_word']()
    rcg.phoneme_position_in_word = []
    for (var i = 0; i < phoneme_word.size(); ++i) {
      var arr = phoneme_word
        .get(i)
        .slice(0, phoneme_word.get(i).length - 1)
        .split(';')
        .map((x) => Number(x))
      rcg.phoneme_position_in_word.push(arr)
    }
    phoneme_word.delete()
    var word_wav = rcg['get_word_position']()
    rcg.word_position = []
    for (var i = 0; i < word_wav.size(); ++i) {
      var arr = word_wav
        .get(i)
        .slice(0, word_wav.get(i).length - 1)
        .split(';')
        .map((x) => Number(x))
      rcg.word_position.push(arr)
    }
    word_wav.delete()
    word_wav = rcg['get_word_stress']()
    rcg.word_stress = []
    for (var i = 0; i < word_wav.size(); ++i) {
      rcg.word_stress.push(word_wav.get(i))
    }
    word_wav.delete()
    var epd_wav = rcg['get_EPD_position']()
    rcg.EPD_position = []
    for (var i = 0; i < epd_wav.size(); ++i) {
      rcg.EPD_position.push(epd_wav.get(i))
    }
    epd_wav.delete()
    if (gradescore == undefined) {
      SelvySTT_Edu_ENG_Init_Grade()
    }
    if (rcg.total_score < gradescore[gradescore.length - 1].score) {
      grade_val = 'reject'
    }
    if (rcg.total_score >= gradescore[0].score) {
      grade_val = gradescore[0].grade
    }
    for (var i = 0; i < gradescore.length - 1; ++i) {
      if (
        rcg.total_score < gradescore[i].score &&
        rcg.total_score >= gradescore[i + 1].score
      ) {
        grade_val = gradescore[i + 1].grade
        break
      }
    }

    rcg.score_grade = grade_val
  }
  return ret
}
function SelvySTT_Edu_ENG_Get_Score_EPD_Buffer(rcg) {
  var wv = stt.SelvySTT_Edu_ENG_Get_Score_EPD_Buffer_Web(rcg)
  var buf = []
  for (var i = 0; i < wv.size(); ++i) {
    buf.push(wv.get(i))
  }
  wv.delete()
  return new Int16Array(buf).buffer
}
function SelvySTT_Edu_ENG_Assessment(refrcg, refEPD, userrcg, userEPD) {
  var inputref = new Int16Array(refEPD)
  var inputuser = new Int16Array(userEPD)
  var ret = stt.SelvySTT_Edu_ENG_Assessment_Web(
    refrcg,
    inputref.join(';'),
    userrcg,
    inputuser.join(';'),
  )
  inputref = ''
  inputuser = ''
  return ret
}

function SelvySTT_Edu_ENG_Get_Assessment_Result(result) {
  var ret = stt.SelvySTT_Edu_ENG_Get_Assessment_Result_Web(result)
  if (ret == 1) {
    var result_wav = result['get_pWord_pronunciation']()
    result.pronunciation = []
    for (var i = 0; i < result_wav.size(); ++i) {
      result.pronunciation.push(result_wav.get(i))
    }
    result_wav.delete()
    result_wav = result['get_pWord_intonation']()
    result.intonation = []
    for (var i = 0; i < result_wav.size(); ++i) {
      result.intonation.push(result_wav.get(i))
    }
    result_wav.delete()
    result_wav = result['get_pWord_timing']()
    result.timing = []
    for (var i = 0; i < result_wav.size(); ++i) {
      result.timing.push(result_wav.get(i))
    }
    result_wav.delete()
    result_wav = result['get_pWord_loudness']()
    result.loudness = []
    for (var i = 0; i < result_wav.size(); ++i) {
      result.loudness.push(result_wav.get(i))
    }
    result_wav.delete()
  }
  return ret
}

function SelvySTT_Edu_ENG_Recognition_Batch_Paragraph(txt, buffer) {
  recog_batch_para = stt.cwrap(
    'SelvySTT_Edu_ENG_Recognition_Batch_Paragraph_web',
    'number',
    ['string', 'number', 'number'],
  )
  var state = -1
  var buf = new Uint8Array(buffer)
  var parr = stt._malloc(buf.byteLength)
  var arr = new Uint8Array(stt.HEAPU8.buffer, parr, buf.byteLength)
  stt.HEAP8.set(buf, parr)
  var ret = recog_batch_para(txt, parr, arr.length / 2)
  stt._free(parr)
  return ret
}
function SelvySTT_Edu_ENG_Recognition_Batch_Paragraph_Get_ReturnSize() {
  return sessionStorage.getItem('returnsize')
}
function SelvySTT_Edu_ENG_Get_Batch_Paragraph_Result(rcg) {
  var ret = stt.SelvySTT_Edu_ENG_Get_Batch_Paragraph_Result_Web(rcg)
  var paragraph_wav = rcg['get_WordScore']()
  rcg.WordScore = []
  for (var i = 0; i < paragraph_wav.size(); ++i) {
    rcg.WordScore.push(paragraph_wav.get(i))
  }
  paragraph_wav.delete()
  paragraph_wav = rcg['get_WordPosition']()
  rcg.WordPosition = []
  for (var i = 0; i < paragraph_wav.size(); ++i) {
    var arr = paragraph_wav
      .get(i)
      .slice(0, paragraph_wav.get(i).length - 1)
      .split(';')
      .map((x) => Number(x))
    rcg.WordPosition.push(arr)
  }
  paragraph_wav.delete()
  rcg.OutString = rcg.get_OutString()
  return ret
}

function SelvySTT_Edu_ENG_OTF_Init(txtToRecog) {
  var ret = stt.SelvySTT_Edu_ENG_OTF_Init_Web(txtToRecog)
  sessionStorage.setItem('updatedFrom', 0)
  sessionStorage.setItem('ret', 0)
  return ret
}

function SelvySTT_Edu_ENG_OTF_RecogFrames(
  buffer,
  nsample,
  sampleoffsetdiff,
  bEOS,
) {
  var ret = -1
  otf_frame_proc = stt.cwrap('SelvySTT_Edu_ENG_OTF_RecogFrames_Web', 'number', [
    'number',
    'number',
    'number',
    'number',
  ])
  if (buffer == null) {
    ret = otf_frame_proc(null, nsample, sampleoffsetdiff, bEOS)
  } else {
    var parr = stt._malloc(buffer.byteLength)
    var arr = new Uint8Array(stt.HEAP16.buffer, parr, buffer.byteLength)
    stt.HEAPU8.set(buffer, parr)
    ret = otf_frame_proc(parr, nsample, sampleoffsetdiff, bEOS)
    stt._free(parr)
  }
  return ret
}

function SelvySTT_Edu_ENG_OTF_GetResult(batchrcg) {
  var ret = stt.SelvySTT_Edu_ENG_OTF_GetResult_Web(batchrcg)

  var result_wav = stt['SelvySTT_Edu_ENG_OTF_GetWordScore_Web']()
  batchrcg.WordScore = []
  for (var i = 0; i < result_wav.size(); ++i) {
    batchrcg.WordScore.push(result_wav.get(i))
  }
  result_wav.delete()
  var result_wav = stt['SelvySTT_Edu_ENG_OTF_GetWordPosition_Web']()
  batchrcg.WordPosition = []
  tmp = []
  for (var i = 0; i < result_wav.size(); ++i) {
    tmp.push(result_wav.get(i))
  }
  result_wav.delete()
  for (var i = 0; i < batchrcg.WordCount; i++) {
    tmparr = []
    tmparr.push(tmp[2 * i])
    tmparr.push(tmp[2 * i + 1])
    batchrcg.WordPosition.push(tmparr)
  }
  return ret
}

function SelvySTT_Edu_ENG_OTF_Destroy() {
  var ret = stt.SelvySTT_Edu_ENG_OTF_Destroy_Web()
  return ret
}

function SelvySTT_Edu_ENG_FX_Init(samplingrate, buffer, nsample) {
  fx_extract = stt.cwrap('SelvySTT_Edu_ENG_FX_Init_Web', 'number', [
    'number',
    'number',
    'number',
  ])
  var buf = new Uint8Array(buffer)
  var parr = stt._malloc(buf.byteLength)
  var arr = new Uint8Array(stt.HEAP16.buffer, parr, buf.byteLength)
  stt.HEAPU8.set(buf, parr)
  var ret = fx_extract(samplingrate, parr, arr.length / 2)
  stt._free(parr)
  return ret
}
function SelvySTT_Edu_ENG_FX_Extract() {
  var ret = stt.SelvySTT_Edu_ENG_FX_Extract_Web()
  return ret
}
function SelvySTT_Edu_ENG_FX_Get_Pitch(size) {
  var float_wav = stt['SelvySTT_Edu_ENG_FX_Get_Pitch_Web'](size)
  var pitch_wav = []
  for (var i = 0; i < float_wav.size(); ++i) {
    pitch_wav.push(float_wav.get(i))
  }
  float_wav.delete()
  return pitch_wav
}
function SelvySTT_Edu_ENG_FX_Get_Energy(size) {
  var float_wav = stt['SelvySTT_Edu_ENG_FX_Get_Energy_Web'](size)
  var energy_wav = []
  for (var i = 0; i < float_wav.size(); ++i) {
    energy_wav.push(float_wav.get(i))
  }
  float_wav.delete()
  return energy_wav
}
function SelvySTT_Edu_ENG_FX_Destroy() {
  var ret = stt.SelvySTT_Edu_ENG_FX_Destroy()
  return ret
}

function SelvySTT_Edu_ENG_Init_Grade() {
  var vp = SelvySTT_Edu_ENG_Get_VoiceProfile()
  gradescore = []
  gradescore.push({
    grade: 'A',
    score: SelvySTT_Edu_ENG_Get_Grade_Score(vp, 10),
  })
  gradescore.push({
    grade: 'B',
    score: SelvySTT_Edu_ENG_Get_Grade_Score(vp, 30),
  })
  gradescore.push({
    grade: 'C',
    score: SelvySTT_Edu_ENG_Get_Grade_Score(vp, 60),
  })
  gradescore.push({
    grade: 'D',
    score: SelvySTT_Edu_ENG_Get_Grade_Score(vp, 100),
  })
}

function SelvySTT_Edu_ENG_Get_Grade_Score(_nprofile, _percent) {
  if (gradescore == undefined) {
    SelvySTT_Edu_ENG_Init_Grade()
  }
  return stt.SelvySTT_Edu_ENG_Get_Grade_Score_Web(_nprofile, _percent)
}
function SelvySTT_Edu_ENG_Set_Grade(gradestring) {
  gradescore = []
  var percent = 0
  var vp = SelvySTT_Edu_ENG_Get_VoiceProfile()
  while (gradestring.length > 0) {
    var elem = gradestring.substring(0, 4)
    var grade = elem.substring(0, 2).replace(/^\s+|\s+$/gm, '')
    var number = Number(elem.substring(2))
    if (isNaN(number)) {
      SelvySTT_Edu_ENG_Init_Grade()
      break
    }
    percent += number
    if (percent > 100) {
      SelvySTT_Edu_ENG_Init_Grade()
      break
    }
    gradescore.push({
      grade: grade,
      score: SelvySTT_Edu_ENG_Get_Grade_Score(vp, percent),
    })
    gradestring = gradestring.slice(4)
  }
  if (percent != 100) {
    SelvySTT_Edu_ENG_Init_Grade()
  }
}

function Recognition_Result_ENG() {
  return new stt.Recognition_Result_ENG()
}

function Assessment_Result_ENG() {
  return new stt.Assessment_Result_ENG()
}

function Batch_Paragraph_Result_ENG() {
  return new stt.Batch_Paragraph_Result_ENG()
}

var convert_bin_to_value = function (bytes) {
  if (bytes.length == 0) {
    return null
  }
  var hexstr = ''
  for (var i = 3; i >= 0; --i) {
    tmp = bytes[i].toString(16)
    if (tmp.length == 1) {
      hexstr += '0'
    }
    hexstr += bytes[i].toString(16)
  }
  ans = parseInt(hexstr, 16)
  if (ans > 2147483647) {
    ans -= 2147483647
  } else if (ans < -2147483648) {
    ans += 2147483648
  }
  return ans
}

function dat_version_check(bytes) {
  var tmpBytes = new Uint8Array(bytes)
  var tmpLength = tmpBytes.length - 4
  var endianbytes = convert_bin_to_value(tmpBytes.slice(tmpLength))
  return endianbytes
}

function save_from_bytes(bytes, refrcg, callbackfunc) {
  var current_version = dat_version_check(bytes)
  console.log(current_version)
  console.log(bytes)
  var bytesArray = new Uint8Array(bytes)

  var offset = 0
  var bytelen = 4

  refrcg.nInputLevel = convert_bin_to_value(
    bytesArray.slice(offset, offset + bytelen),
  )
  offset += bytelen

  refrcg.nInputProfile = convert_bin_to_value(
    bytesArray.slice(offset, offset + bytelen),
  )
  offset += bytelen

  refrcg.nInputPauseThreshold = convert_bin_to_value(
    bytesArray.slice(offset, offset + bytelen),
  )
  offset += bytelen

  refrcg.iTextForm = convert_bin_to_value(
    bytesArray.slice(offset, offset + bytelen),
  )
  offset += bytelen

  let szInputText = []

  while (offset) {
    szInputText.push(bytesArray[offset])

    offset += 1

    if (bytesArray[offset] == 0) {
      // szInputText.push(bytesArray[offset]); // 이건 나중에 mapping 상태에 따라 뺄수도 있고, 아닐수가 있음.
      offset += 1
      break
    }
  }

  refrcg.set_szInputText(
    szInputText
      .map((input) => String.fromCharCode(input))
      .join('')
      .trim(),
  )

  var result_cnt = convert_bin_to_value(
    bytesArray.slice(offset, offset + bytelen),
  )
  refrcg.result_cnt = result_cnt
  offset += bytelen

  var result_string = ''
  var result_string_vec = new stt.vectorString()
  for (var i = 0; i < result_cnt; ++i) {
    var tmp = []
    while (offset) {
      tmp.push(bytesArray[offset])
      offset += 1
      if (bytesArray[offset] == 0) {
        // tmp.push(bytesArray[offset]); // 이건 나중에 mapping 상태에 따라 뺄수도 있고, 아닐수가 있음.
        offset += 1
        break
      }
    }
    result_string = tmp.map((input) => String.fromCharCode(input)).join('')
    result_string_vec.push_back(result_string)
  }

  refrcg.set_result_string(result_string_vec)
  var result_wav = refrcg['get_result_string']()
  refrcg.result_string = []
  for (var i = 0; i < result_wav.size(); ++i) {
    refrcg.result_string.push(result_wav.get(i))
  }
  result_wav.delete()
  result_wav = null
  result_string_vec.delete()
  result_string_rec = null

  var result_score_vec = new stt.vectorInt()
  for (var i = 0; i < result_cnt; ++i) {
    result_score_vec.push_back(
      convert_bin_to_value(bytesArray.slice(offset, offset + bytelen)),
    )
    offset += bytelen
  }
  refrcg.set_result_score(result_score_vec)
  result_score_vec.delete()
  result_score_vec = null

  refrcg.total_score = convert_bin_to_value(
    bytesArray.slice(offset, offset + bytelen),
  )
  offset += bytelen

  var word_cnt = convert_bin_to_value(
    bytesArray.slice(offset, offset + bytelen),
  )
  refrcg.word_cnt = word_cnt
  offset += bytelen

  var word = []
  var word_vec = new stt.vectorString()
  for (var i = 0; i < word_cnt; ++i) {
    var tmp = []
    while (offset) {
      tmp.push(bytesArray[offset])
      offset += 1
      if (bytesArray[offset] == 0) {
        // tmp.push(bytesArray[offset]); // 이건 나중에 mapping 상태에 따라 뺄수도 있고, 아닐수가 있음.
        offset += 1
        break
      }
    }
    tmp = tmp.map((input) => String.fromCharCode(input)).join('')
    word.push(tmp)
    word_vec.push_back(tmp)
  }
  refrcg.set_word(word_vec)
  refrcg.word = word
  word_vec.delete()
  word_vec = null

  var word_score_vec = new stt.vectorInt()
  for (var i = 0; i < word_cnt; ++i) {
    word_score_vec.push_back(
      convert_bin_to_value(bytesArray.slice(offset, offset + bytelen)),
    )
    offset += bytelen
  }
  refrcg.set_word_score(word_score_vec)
  word_score_vec.delete()
  word_score_vec = null
  var word_position_vec = new stt.vectorInt()
  var word_position = []
  for (var i = 0; i < word_cnt; ++i) {
    var tmparr = []
    tmp = convert_bin_to_value(bytesArray.slice(offset, offset + bytelen))
    word_position_vec.push_back(tmp)
    tmparr.push(tmp)
    offset += bytelen
    tmp = convert_bin_to_value(bytesArray.slice(offset, offset + bytelen))
    word_position_vec.push_back(tmp)
    tmparr.push(tmp)
    word_position.push(tmparr)
    tmparr = []
    offset += bytelen
  }
  refrcg.set_word_position(word_position_vec)
  refrcg.word_position = word_position
  word_position_vec.delete()
  word_position = null
  if (current_version == 2202002) {
    var phoneme_cnt_in_word = []
    var phoneme_cnt_in_word_vec = new stt.vectorInt()
    for (var i = 0; i < word_cnt; ++i) {
      var tmp = convert_bin_to_value(bytesArray.slice(offset, offset + bytelen))
      phoneme_cnt_in_word.push(tmp)
      phoneme_cnt_in_word_vec.push_back(tmp)
      offset += bytelen
    }
    refrcg.set_phoneme_cnt_in_word(phoneme_cnt_in_word_vec)
    phoneme_cnt_in_word_vec.delete()
    phoneme_cnt_in_word_vec = null
  }

  var phoneme_in_word_vec = new stt.vectorString()
  for (var i = 0; i < word_cnt; ++i) {
    var tmp = []
    while (offset) {
      tmp.push(bytesArray[offset])
      offset += 1
      if (bytesArray[offset] == 0) {
        // tmp.push(bytesArray[offset]); // 이건 나중에 mapping 상태에 따라 뺄수도 있고, 아닐수가 있음.
        offset += 1
        break
      }
    }
    phoneme_in_word_vec.push_back(
      tmp.map((input) => String.fromCharCode(input)).join(''),
    )
  }
  if (current_version != 2202002) {
    refrcg.set_phoneme_in_word(phoneme_in_word_vec)
    phoneme_in_word_vec.delete()
    phoneme_in_word_vec = null

    var phoneme_cnt_in_word = []
    var phoneme_cnt_in_word_vec = new stt.vectorInt()
    for (var i = 0; i < word_cnt; ++i) {
      var tmp = convert_bin_to_value(bytesArray.slice(offset, offset + bytelen))
      phoneme_cnt_in_word.push(tmp)
      phoneme_cnt_in_word_vec.push_back(tmp)
      offset += bytelen
    }
    refrcg.set_phoneme_cnt_in_word(phoneme_cnt_in_word_vec)
    phoneme_cnt_in_word_vec.delete()
    phoneme_cnt_in_word_vec = null
  }

  var phenome_score_in_word_vec = new stt.vectorInt()
  var tmparr = []
  for (var i = 0; i < word_cnt; ++i) {
    for (var j = 0; j < phoneme_cnt_in_word[i]; ++j) {
      phenome_score_in_word_vec.push_back(
        convert_bin_to_value(bytesArray.slice(offset, offset + bytelen)),
      )
      offset += bytelen
    }
  }
  refrcg.set_phoneme_score_in_word(phenome_score_in_word_vec)
  phenome_score_in_word_vec = null

  var phoneme_position_in_word_vec = new stt.vectorInt()
  for (var i = 0; i < word_cnt; ++i) {
    for (var j = 0; j <= phoneme_cnt_in_word[i]; ++j) {
      phoneme_position_in_word_vec.push_back(
        convert_bin_to_value(bytesArray.slice(offset, offset + bytelen)),
      )
      offset += bytelen
    }
  }
  refrcg.set_phoneme_position_in_word(phoneme_position_in_word_vec)
  phoneme_position_in_word_vec.delete()
  phoneme_position_in_word_vec = null

  var word_stress_vec = new stt.vectorInt()
  for (var i = 0; i < word_cnt; ++i) {
    word_stress_vec.push_back(
      convert_bin_to_value(bytesArray.slice(offset, offset + bytelen)),
    )
    offset += bytelen
  }
  refrcg.set_word_stress(word_stress_vec)
  word_stress_vec.delete()
  word_stress_vec = null

  refrcg.bEPD =
    convert_bin_to_value(bytesArray.slice(offset, offset + bytelen)) == 1
      ? true
      : false
  offset += bytelen

  var begin = convert_bin_to_value(bytesArray.slice(offset, offset + bytelen))
  offset += bytelen
  var end = convert_bin_to_value(bytesArray.slice(offset, offset + bytelen))
  offset += bytelen
  refrcg.set_EPD_position(begin, end)
  refrcg.EPD_position = [begin, end]

  refrcg.wpm = convert_bin_to_value(bytesArray.slice(offset, offset + bytelen))
  offset += bytelen

  refrcg.nSNR = convert_bin_to_value(bytesArray.slice(offset, offset + bytelen))
  offset += bytelen

  refrcg.EPD_sample_cnt = convert_bin_to_value(
    bytesArray.slice(offset, offset + bytelen),
  )
  offset += bytelen
  var EPD_Buf = ''
  if (bytes.byteLength % 2 == 1) {
    EPD_Buf = bytes.slice(offset, offset + refrcg.EPD_sample_cnt * 2)
  } else {
    EPD_Buf = new Int16Array(bytes).slice(
      offset,
      offset + refrcg.EPD_sample_cnt * 2,
    ).buffer
  }
  window.m_rec_buffer_ref = EPD_Buf
  if (callbackfunc) callbackfunc()
}
function SelvySTT_Edu_ENG_Get_Ref_Data(filepath, refrcg, callbackfunc) {
  var bin_data
  var reader = new FileReader()
  reader.onloadend = function () {
    save_from_bytes(reader.result, refrcg)
    if (callbackfunc) callbackfunc()
  }
  var rawFile = new XMLHttpRequest()
  rawFile.open('GET', filepath, true)
  rawFile.responseType = 'blob'
  rawFile.onreadystatechange = function () {
    if (rawFile.readyState === 4) {
      if (rawFile.status === 200 || rawFile.status == 0) {
        reader.readAsArrayBuffer(rawFile.response)
      }
    }
  }
  rawFile.send(new Blob())
}
function SelvySTT_Edu_ENG_Load_From_Bytes(file, refrcg, callbackfunc) {
  return save_from_bytes(file, refrcg, callbackfunc)
}

function SelvySTT_Edu_ENG_RT_Init() {
  var ret = stt.SelvySTT_Edu_ENG_RT_Init_Web()
  return ret
}
function SelvySTT_Edu_ENG_RT_ExtractFrame(inpbuffer, outbuffer) {
  var inpvec = new stt.vectorShort()
  var int16inp = new Int16Array(inpbuffer)
  for (var i = 0; i < int16inp.length; ++i) {
    inpvec.push_back(int16inp[i])
  }
  var ret = stt.SelvySTT_Edu_ENG_RT_ExtractFrame_Web(inpvec)
  var outvec = stt['SelvySTT_Edu_ENG_RT_GetExtractFrame_Web']()
  for (var i = 0; i < outvec.size(); ++i) {
    outbuffer[i] = outvec.get(i)
  }
  inpvec.delete()
  inpvec = null
  outvec.delete()
  outvec = null
  return ret
}
function SelvySTT_Edu_ENG_RT_Extract(inpbuffer, outbuffer) {
  var inpvec = new stt.vectorShort()
  var int16inp = new Int16Array(inpbuffer)
  for (var i = 0; i < int16inp.length; ++i) {
    inpvec.push_back(int16inp[i])
  }
  var ret = stt.SelvySTT_Edu_ENG_RT_Extract_Web(inpvec, RT_NORMALIZE_OPTION_4)
  var outvec = stt['SelvySTT_Edu_ENG_RT_GetExtract_Web']()
  for (var i = 0; i < outvec.size(); ++i) {
    outbuffer[i] = outvec.get(i)
  }
  inpvec.delete()
  inpvec = null
  outvec.delete()
  outvec = null
  return ret
}

function SelvySTT_Edu_ENG_RT_GetEnergy(outbuffer) {
  var ret = stt.SelvySTT_Edu_ENG_RT_GetEnergy_Web()
  outvec = stt['SelvySTT_Edu_ENG_RT_GetEnergyGraph_Web']()
  for (var i = 0; i < outvec.size(); ++i) {
    outbuffer[i] = outvec.get(i)
  }
  outvec.delete()
  outvec = null
  return ret
}

function SelvySTT_Edu_ENG_RT_NormalizeFrames(inpbuffer, outbuffer) {
  var inpvec = new stt.vectorFloat()
  var float32inp = new Float32Array(inpbuffer)
  for (var i = 0; i < float32inp.length; ++i) {
    inpvec.push_back(float32inp[i])
  }
  var ret = stt.SelvySTT_Edu_ENG_RT_NormalizeFrames_Web(
    inpvec,
    RT_NORMALIZE_OPTION_3,
  )
  var outvec = stt['SelvySTT_Edu_ENG_RT_GetNormalizeFrames_Web']()
  for (var i = 0; i < outvec.size(); ++i) {
    outbuffer[i] = outvec.get(i)
  }
  inpvec.delete()
  inpvec = null
  outvec.delete()
  outvec = null
  return ret
}
function SelvySTT_Edu_ENG_RT_NormalizeEnergy(inpbuffer, outbuffer) {
  var inpvec = new stt.vectorFloat()
  var float32inp = new Float32Array(inpbuffer)
  for (var i = 0; i < float32inp.length; ++i) {
    inpvec.push_back(float32inp[i])
  }
  var ret = stt.SelvySTT_Edu_ENG_RT_NormalizeEnergy_Web(
    inpvec,
    RT_NORMALIZE_OPTION_3,
  )
  var outvec = stt['SelvySTT_Edu_ENG_RT_GetNormalizeEnergy_Web']()
  for (var i = 0; i < outvec.size(); ++i) {
    outbuffer[i] = outvec.get(i)
  }
  inpvec.delete()
  inpvec = null
  outvec.delete()
  outvec = null
  return ret
}

function SelvySTT_Edu_ENG_RT_Destroy() {
  var ret = stt.SelvySTT_Edu_ENG_RT_Destroy_Web()
  return ret
}
