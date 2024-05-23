/* Copyright 2013 Chris Wilson

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
   ver : SelvySTT Edu ENG Script SDK V.2021. 2. 25
*/

var audioContext

var audioInput = null,
  realAudioInput = null,
  inputPoint = null,
  audioRecorder = null
var rafID = null
var analyserContext = null
var canvasWidth, canvasHeight
var recIndex = 0
var audioUseFastSample = true
var audioUseEPD = false
var audioStopWhenEPD = false
var roundbufferlen = 0
var roundbuffer = null
var roundbuffer_begin = 0
var roundbuffer_last = 0
var bufptr = null
var audioCBOnStop = null
//var audio_pause_threshold = 500;
var audio_pause_threshold = 1000
var prevRet
var idx
var tmpbuffer
var usePowerEPD = false
var audioUseOTF = false
var localStream = null

var mediaContraints = { mediaSource: true, audio: true }

var playVolumeValues = 1
var inputgainValues = 2

var bInitAudio = false
function printErrorTypeA(e, url) {
  document.writeln(
    'HTML-5 의 웹킷 (특히 오디오) 호환성과 관련하여 요청하신 페이지의 로딩에 실패하였습니다. 다음 사항을 확인하여 주시기 바랍니다.<br /><br />' +
      '1. 지원 브라우저로 접속하였는지 ? (IE는 지원하지 않습니다.)<br />' +
      '2. 컴퓨터의 사운드 카드에 마이크가 설치되어 있는지 ?<br />' +
      '3. HDMI 등 외부 오디오 장치로 연결되어 마이크를 사용하지 않는 상태가 아닌지 ?<br /><br />' +
      '이외의 경우라면 고객센터로 문의하여 주세요.<br />' +
      '(리딩게이트 1599-0533)',
  )
}
function printErrorTypeB() {
  document.writeln(
    '현재 브라우저에서 WebAudio 를 지원하지 않거나 설정에 문제가 있는 것으로 보입니다. Chrome 등의 브라우저를 사용하여 다시 접속하거나, 관리자에게 문의하시기 바랍니다.',
  )
}
function gotBuffers(buffers) {
  if (buffers[0].length <= 0) return
  var newSource = audioContext.createBufferSource()
  var newBuffer = audioContext.createBuffer(
    1,
    buffers[0].length,
    audioContext.sampleRate,
  )
  newBuffer.getChannelData(0).set(buffers[0])

  var buffer = new ArrayBuffer(newBuffer.length * 2)
  var view = new DataView(buffer)
  var offset = 0
  for (var i = 0; i < newBuffer.length; i++, offset += 2) {
    var s = buffers[0][i] * 32768
    if (s > 32767) s = 32767
    if (s < -32768) s = -32768
    view.setInt16(offset, s, true)
  }

  if (audioRecorder.m_onRecordDone) {
    audioRecorder.m_onRecordDone(buffer)
  }
}

function startRecording(
  onRecordUpdate,
  enableFastSample,
  useEPD,
  stopOnEPD,
  useOTF,
  cbOnStop,
) {
  if (!audioRecorder) return
  audioRecorder.m_onRecordUpdate = onRecordUpdate
  audioRecorder.clear()
  audioRecorder.record()
  audioUseFastSample =
    enableFastSample == null ? true : enableFastSample == true ? true : false
  audioUseEPD = useEPD == null ? false : useEPD == true ? true : false
  audioStopWhenEPD =
    stopOnEPD == null ? false : stopOnEPD == true ? true : false
  audioUseOTF = useOTF == null ? false : useOTF == true ? true : false
  //epd
  if (audioUseEPD) {
    if (usePowerEPD) {
      powerEPD_InitVoice(true)
      PowerEPD_SetPauseThreshold(audio_pause_threshold)
    }
    roundbuffer = new Uint8Array()
    tmpbuffer = new Uint8Array()
    idx = 0
  }
  audioCBOnStop = cbOnStop ? cbOnStop : null
}
function setGain(_value) {
  inputgainValues = _value
  if (bInitAudio == false) {
    mediaContraints = {
      audio: {
        mandatory: {
          // 필수값
          echoCancellation: 'false',
          googEchoCancellation: 'false',
          googAutoGainControl: 'false',
          googNoiseSuppression: 'true',
          googHighpassFilter: 'true',
        },
        optional: [],
      },
    }
  }
}
function stopRecording(onRecordDone) {
  audioRecorder.stop()
  audioRecorder.m_onRecordUpdate = null

  if (usePowerEPD) {
    audioRecorder.m_onRecordDone = function (buffer) {
      var tmpbuf = new Uint8Array(buffer)
      var ret = 0
      while (tmpbuf.length >= 1600) {
        var arr = tmpbuf.slice(0, 1600)

        ret = powerEPD_FrameProc(arr)
        if (ret == 1) {
          var buf = powerEPD_GetData()
          if (onRecordDone) {
            onRecordDone(new Int16Array(buf).buffer)
          }
          return
        } else if (ret == 2) {
          var whilebuf = new Uint8Array(1600).fill(0)
          while (ret != 1) {
            ret = powerEPD_FrameProc(whilebuf)
          }
          var buf = powerEPD_GetData()
          if (onRecordDone) {
            onRecordDone(new Int16Array(buf).buffer)
          }
          return
        } else if (ret != 0) {
          ret = powerEPD_InitVoice(false)
        }
        tmpbuf = tmpbuf.slice(1600)
      }
      var arr = tmpbuf
      ret = powerEPD_FrameProc(arr)
      if (ret != 1) {
        //onRecordDone(null);
        if (onRecordDone) {
          onRecordDone(null)
          window.m_rec_buffer = buffer
        }
      }
    }
  } else {
    audioRecorder.m_onRecordDone = onRecordDone
  }

  audioRecorder.getBuffers(gotBuffers)
}

function convertToMono(input) {
  var splitter = audioContext.createChannelSplitter(2)
  var merger = audioContext.createChannelMerger(2)

  input.connect(splitter)
  splitter.connect(merger, 0, 0)
  splitter.connect(merger, 0, 1)
  return merger
}
function prepareEPDparams(pauseth) {
  audio_pause_threshold = pauseth
}
function gotStream(stream) {
  window.AudioContext =
    window.AudioContext ||
    window.webkitAudioContext ||
    window.mozAudioContext ||
    window.oAudioContext ||
    window.msAudioContext
  if (window.webkitAudioContext) {
    audioContext = new webkitAudioContext()
  } else {
    audioContext = new AudioContext()
  }
  if (!audioContext) printErrorTypeB()

  inputPoint = audioContext.createGain()
  //초기값
  inputPoint.gain.value = inputgainValues
  var vol = parseFloat(localStorage.getItem('global_volume'))
  if (isNaN(vol)) {
    vol = 1
  }
  MW_SetVolume(vol)
  // Create an AudioNode from the stream.
  realAudioInput = audioContext.createMediaStreamSource(stream)

  audioInput = realAudioInput
  audioInput.connect(inputPoint)

  audioInput = convertToMono(inputPoint) //mono

  analyserNode = audioContext.createAnalyser()
  analyserNode.smoothingTimeConstant = 0.3
  analyserNode.fftSize = 2048
  inputPoint.connect(analyserNode)

  audioRecorder = new Recorder(inputPoint)

  zeroGain = audioContext.createGain()
  zeroGain.gain.value = 0.0
  inputPoint.connect(zeroGain)
  zeroGain.connect(audioContext.destination)

  realAudioInput.connect(analyserNode)

  updateWaveform()
}
var interpolateArray2 = function (data, fitCount) {
  var linearInterpolate2 = function (before, after, atPoint) {
    return before + (after - before) * atPoint
  }

  var newData = new ArrayBuffer(fitCount << 1)

  var dataview = new DataView(data)
  var newdataview = new DataView(newData)

  var springFactor = new Number(((data.byteLength >> 1) - 1) / (fitCount - 1))
  newdataview.setInt16(0, dataview.getInt16(0, true), true) // for new allocation
  for (var i = 1; i < fitCount - 1; i++) {
    var tmp = i * springFactor
    var before = new Number(Math.floor(tmp)).toFixed()
    var after = new Number(Math.ceil(tmp)).toFixed()
    var atPoint = tmp - before
    newdataview.setInt16(
      i << 1,
      linearInterpolate2(
        dataview.getInt16(before << 1, true),
        dataview.getInt16(after << 1, true),
        atPoint,
      ),
      true,
    )
  }
  newdataview.setInt16(
    (fitCount - 1) << 1,
    dataview.getInt16(((data.byteLength >> 1) - 1) << 1, true),
    true,
  ) // for new allocation
  return newData
}

function gotPartialBuffers(buffers) {
  if (buffers[0].length == 0) return

  var newSource = audioContext.createBufferSource()
  var newBuffer = audioContext.createBuffer(
    1,
    buffers[0].length,
    audioContext.sampleRate,
  )
  newBuffer.getChannelData(0).set(buffers[0])

  var buffer = new ArrayBuffer(newBuffer.length * 2)
  var view = new DataView(buffer)
  var offset = 0
  for (var i = 0; i < newBuffer.length; i++, offset += 2) {
    var s = buffers[0][i] * 32768
    if (s > 32767) s = 32767
    if (s < -32768) s = -32768
    view.setInt16(offset, s, true)
  }
  if (audioRecorder.m_onRecordUpdate) {
    if (audioUseEPD) {
      processEPD(buffer)
    }
  }
}
function updateWaveform(time) {
  if (audioRecorder && audioRecorder.m_onRecordUpdate) {
    var freqByteData = new Float32Array(analyserNode.frequencyBinCount)
    var uint8 = new Uint8Array(freqByteData.length * 2)
    analyserNode.getByteTimeDomainData(uint8)

    for (var i = 0, imax = freqByteData.length; i < imax; i++) {
      freqByteData[i] = (uint8[i] - 128) * 0.0078125
    }

    var buffer = new ArrayBuffer(freqByteData.length * 2)
    var view = new DataView(buffer)
    var offset = 0
    for (var i = 0; i < freqByteData.length; i++, offset += 2) {
      var s = freqByteData[i] * 32768
      if (s > 32767) s = 32767
      if (s < -32768) s = -32768
      view.setInt16(offset, s, true) //littleEndian
    }

    audioRecorder.getBufferFromBytes(gotPartialBuffers)
    if (audioRecorder.m_onRecordUpdate) audioRecorder.m_onRecordUpdate(buffer)
  }

  rafID = window.requestAnimationFrame(updateWaveform)
}

ArrayBuffer.prototype.memcpy = function (
  dstOffset,
  src,
  srcOffset,
  bytelength,
) {
  var viewDst = new DataView(this)
  var viewSrc = new DataView(src)
  var last = dstOffset + bytelength
  while (dstOffset != last) {
    viewDst.setInt16(dstOffset, viewSrc.getInt16(srcOffset, true), true)
    dstOffset += 2
    srcOffset += 2
  }
}
function concatArray(a, b) {
  var c = new Uint8Array(a.length + b.length)
  c.set(a)
  c.set(b, a.length)
  return c
}
function processEPD(framebuf) {
  var ret
  roundbuffer = concatArray(roundbuffer, new Uint8Array(framebuf))
  while (roundbuffer.length >= 1600) {
    var arr = roundbuffer.slice(0, 1600)
    roundbuffer = roundbuffer.slice(1600)
    if (usePowerEPD) {
      ret = powerEPD_FrameProc(arr)
      if (ret == 1) {
        //found epd
        var pos = powerEPD_GetPos()
        var tmpbegin = pos[0]
        var tmpend = pos[1]
        // //TODO: audioStopWhenEPD 처리
        if (audioStopWhenEPD) {
          audioRecorder.stop()
          audioRecorder.m_onRecordUpdate = null
        }
        audioRecorder.m_onRecordDone = function (totalbuffer) {
          if (audioCBOnStop) {
            audioCBOnStop(totalbuffer, tmpbegin.toFixed(0), tmpend.toFixed(0))
          }
        }
        audioRecorder.getBuffers(gotBuffers)
        return
      } else if (ret == 2) {
      } else if (ret != 0) {
        ret = powerEPD_InitVoice(false)
      }
      //Server에 대한 Try & catch 추가
    } else if (audioUseEPD && !audioUseOTF) {
      ret = SelvySTT_Edu_ENG_Recognition_Frame(arr, 800, false)
      if (ret > 0) {
        //audioStopWhenEPD 처리
        if (audioStopWhenEPD) {
          audioRecorder.stop()
          audioRecorder.m_onRecordUpdate = null
        }
        audioRecorder.m_onRecordDone = function (totalbuffer) {
          if (audioCBOnStop) {
            audioCBOnStop(totalbuffer)
          }
        }
        audioRecorder.getBuffers(gotBuffers)
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
          case 4:
            window.frame_msg = 'timeout'
            break
          case 5:
            window.frame_msg = 'frame_error'
            break
          default:
            window.frame_msg = 'recognition_not_success'
        }
        return
      }
    } else {
      ret = SelvySTT_Edu_ENG_OTF_RecogFrames(arr, 800, 0, false)
      if (ret == 12) {
        audioRecorder.stop()
        while (ret == 12) {
          ret = SelvySTT_Edu_ENG_OTF_RecogFrames(null, 0, 0, false)
        }
        audioRecorder.record()
      }
      if (ret == 13) {
        var updatedFrom = sessionStorage.getItem('updatedFrom')
        if (updatedFrom >= 0) {
          if (audioStopWhenEPD) {
            audioRecorder.stop()
            audioRecorder.m_onRecordUpdate = null
            audioRecorder.record()
          }
          audioRecorder.m_onRecordDone = function (totalbuffer) {
            if (audioCBOnStop) {
              audioCBOnStop(totalbuffer)
            }
          }
          audioRecorder.getBuffers(gotBuffers)
          window.frame_msg = 'success'
          return
        }
      } else {
        sessionStorage.setItem('ret', 13)
      }
    }
  }
}
function initAudio(onSucceed) {
  if (navigator.mediaDevices === undefined) {
    navigator.mediaDevices = {}
  }

  // Some browsers partially implement mediaDevices. We can't just assign an object
  // with getUserMedia as it would overwrite existing properties.
  if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      // First get ahold of the legacy getUserMedia, if present
      var getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia ||
        navigator.oGetUserMedia
      if (!navigator.cancelAnimationFrame)
        navigator.cancelAnimationFrame =
          navigator.webkitCancelAnimationFrame ||
          navigator.mozCancelAnimationFrame
      if (!navigator.requestAnimationFrame)
        navigator.requestAnimationFrame =
          navigator.webkitRequestAnimationFrame ||
          navigator.mozRequestAnimationFrame

      // Some browsers just don't implement it - return a rejected promise with an error
      // to keep a consistent interface
      if (!getUserMedia) {
        return Promise.reject(
          new Error('getUserMedia is not implemented in this browser'),
        )
      }

      // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
      return new Promise(function (resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject)
      })
    }
  }
  navigator.mediaDevices
    .getUserMedia(mediaContraints)
    .then(function (stream) {
      localStream = stream
      gotStream(stream)
      bInitAudio = true
      if (onSucceed != undefined) onSucceed()
    })
    .catch(function (e) {
      console.log(e)
      alert('Error getting audio')
      var url = location.href
      url = url.substring(0, url.length - 1)

      printErrorTypeA(e, url)
    })
  try {
    var ret = powerEPD_Create(true)
    usePowerEPD = true
  } catch (err) {
    console.log('This page does not use EPD Module')
  }
}
function DestroyAudio() {
  if (usePowerEPD == true) {
    powerEPD_Destroy()
  }
  usePowerEPD = false
  realAudioInput.disconnect()
  realAudioInput = null
  zeroGain.disconnect()
  zeroGain = null
  inputPoint.disconnect()
  inputPoint = null
  //AudioContext close;
  audioContext.close().then(function () {
    localStream.getAudioTracks().forEach(function (track) {
      track.stop()
    })
    audioContext = null
    localStream = null
  })
}

function setPlayVolume(_value) {
  playVolumeValues = _value
}

function playBuffer(buffer, cbOnEnded) {
  if (!audioContext) return
  buffer = interpolateArray2(buffer, (buffer.byteLength >> 1) * (22050 / 16000))
  var floats = new Float32Array(buffer.byteLength >> 1)
  var dv = new DataView(buffer)
  var factor = 1.0 / 32767
  for (var i = 0; i < floats.length; ++i) {
    floats[i] = dv.getInt16(i << 1, true) * factor
  }
  var bs = audioContext.createBufferSource()
  var ab = audioContext.createBuffer(1, floats.length, 22050)

  ab.getChannelData(0).set(floats)
  bs.buffer = ab

  var bsgain = audioContext.createGain()
  bsgain.gain.value = playVolumeValues
  bs.connect(bsgain)
  //bs.connect(audioContext.destination);
  bsgain.connect(audioContext.destination)
  // iphone/ipad(iOS) safari callback 동작
  bs.onended = function () {
    bs.disconnect()
    if (cbOnEnded) {
      cbOnEnded()
    }
  }
  bs.start(0)
  return bs
}

function MW_GetVolume() {
  return inputPoint && inputPoint.gain ? inputPoint.gain.value : -1
}
function MW_SetVolume(newvol) {
  return inputPoint && inputPoint.gain ? (inputPoint.gain.value = newvol) : -1
}

////////////////// MIC WIZARD START //////////////////
var _MW_onCanceled = null
var _MW_adjustVolumeTried = 0
var _MW_adjustVolume = function (buf) {
  //buf: ArrayBuffer
  var lastvol = MW_GetVolume()
  //find 3-best
  var max1 = -32768
  var max2 = -32768
  var max3 = -32768
  var viewbuf = new DataView(buf)
  for (var i = 0; i < buf.byteLength - (800 << 1); i += 800 << 1) {
    var fave = 0
    var fvol = 0
    for (var j = i; j < i + (800 << 1); j += 2)
      fave += viewbuf.getInt16(j, true)
    fave /= 800
    for (var j = i; j < i + (800 << 1); j += 2)
      fvol += Math.abs(viewbuf.getInt16(j, true) - fave)
    var t_vol = Math.min(200, fvol / 800 / 100)

    max1 = Math.max(max1, t_vol)
    if (max2 < max1) {
      var t = max2
      max2 = max1
      max1 = t
    }
    if (max3 < max2) {
      var t = max3
      max3 = max2
      max2 = t
    }
    if (max2 < max1) {
      var t = max2
      max2 = max1
      max1 = t
    }
  }
  {
    var t = max1
    max1 = max3
    max3 = t
  } //swap
  var enemean = (max1 + max2) * 0.5

  //너무 작을때도 봐야할 듯? -> 볼륨을 올리진 않네.
  var newvol = lastvol * 100 //float to vol (0~100)
  if (max2 <= 15) {
    //too low, I think. set to max
    newvol = 100
  } else if (max2 <= 50) {
    //ok
  } else {
    if (max1 > 200 && max2 > 200 && max3 > 200) newvol = (max2 / 950) * newvol
    else if (max1 > 170 && max2 > 170) newvol = (max2 / 650) * newvol
    else if (max2 > 160) newvol = (max2 / 490) * newvol
    else if (max2 > 150) newvol = (max2 / 410) * newvol
    else if (max2 > 100) newvol = (max2 / 220) * newvol
    else if (max2 > 80) newvol = (max2 / 180) * newvol
    else if (max2 > 70) newvol = (max2 / 140) * newvol
    else if (max2 > 60) newvol = (max2 / 80) * newvol
    else newvol = (max2 / 67) * newvol
    if (newvol == 0) newvol = 1
  }
  newvol /= 100 //cvt to float (0~1.f)
  return newvol
}
function MW_TryAdjustVolume(howmany, cbobj) {
  _MW_adjustVolumeTried = 0
  _MW_onCanceled = cbobj.onCanceled
  var onEPD = function (buffer, begin_insample, end_insample) {
    //adjust volume
    var lastvol = MW_GetVolume()
    var newvol = _MW_adjustVolume(
      buffer.slice(begin_insample << 1, end_insample << 1),
    )

    ++_MW_adjustVolumeTried

    if (cbobj.onAdjustVolume && typeof cbobj.onAdjustVolume == 'function') {
      cbobj.onAdjustVolume({
        lastvol: lastvol,
        newvol: newvol,
        tried: _MW_adjustVolumeTried,
        until: howmany,
        buffer: buffer.slice(begin_insample << 1, end_insample << 1),
      })
    }

    if (_MW_adjustVolumeTried < howmany) {
      if (cbobj.onBeforeStart && typeof cbobj.onBeforeStart == 'function') {
        cbobj.onBeforeStart({
          tried: _MW_adjustVolumeTried + 1,
          until: howmany,
          resume: function () {
            startRecording(cbobj.onRecordUpdate, true, true, true, false, onEPD)
          },
        })
      } else {
        startRecording(cbobj.onRecordUpdate, true, true, true, false, onEPD)
      }
    }
  }

  if (cbobj.onBeforeStart && typeof cbobj.onBeforeStart == 'function') {
    cbobj.onBeforeStart({
      tried: _MW_adjustVolumeTried + 1,
      until: howmany,
      resume: function () {
        startRecording(cbobj.onRecordUpdate, true, true, true, false, onEPD)
      },
    })
  } else {
    startRecording(cbobj.onRecordUpdate, true, true, true, false, onEPD)
  }
}
function MW_Cancel() {
  stopRecording(
    _MW_onCanceled && typeof _MW_onCanceled == 'function'
      ? _MW_onCanceled
      : null,
  )
}
////////////////// MIC WIZARD END //////////////////
