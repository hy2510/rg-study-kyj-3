var powerEPD = new libPowerEPD()

function powerEPD_Create() {
	return powerEPD.PowerEPD_Create_JS(true)
}

function powerEPD_Destroy() {
	powerEPD.PowerEPD_Destroy_JS()
	powerEPD = null
}

function powerEPD_InitVoice(bools) {
	return powerEPD.PowerEPD_InitVoice_JS(bools)
}

function PowerEPD_SetPauseThreshold(threshold) {
	var th = threshold / 10
	return powerEPD.PowerEPD_SetPauseThreshold_JS(th)
}

function powerEPD_FrameProc(frames) {
	var ret = -1
	frameproc = powerEPD.cwrap('PowerEPD_FrameProc_JS', 'number', ['number', 'number'])
	var parr = powerEPD._malloc(frames.byteLength)
	var arr = new Uint8Array(powerEPD.HEAP16.buffer, parr, frames.byteLength)
	powerEPD.HEAPU8.set(frames, parr)
	ret = frameproc(parr, arr.length / 2)
	powerEPD._free(parr)
	return ret
}

function powerEPD_GetSNR() {
	return powerEPD.PowerEPD_GetSNR_JS()
}

function powerEPD_GetPos() {
	var position = []
	var pos_vec = powerEPD['PowerEPD_GetPos_JS']()
	for (var i = 0; i < pos_vec.size(); i++) {
		position.push(pos_vec.get(i))
	}
	pos_vec.delete()
	return position
}
function powerEPD_GetData() {
	var wavData = []
	var wav_vec = powerEPD['PowerEPD_GetData_JS']()
	for (var i = 0; i < wav_vec.size(); ++i) {
		wavData.push(wav_vec.get(i))
	}
	wav_vec.delete()
	return wavData
}
