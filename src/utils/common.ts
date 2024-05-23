// 공통적인 함수를 넣어놓을 곳

/** [ 서버에서 받아온 데이터의 키값을 camel case로 바꿔주는 함수]
 * @param data 서버에서 받아온 값
 *
 * output
 * 새로 생성된 object
 * */
const convertCase = (data: any) => {
  let copy: any = {}

  for (let key in data) {
    // key값의 앞글자를 대문자로
    const newName =
      key.charAt(0).toLocaleLowerCase() + key.substring(1, key.length)

    // 키가 객체형인 경우 그 내부도 같이 바꿔준다
    if (typeof data[key] == 'object') {
      copy[newName] = convertCase(data[key])
    } else {
      copy[newName] = data[key]
    }
  }

  return copy
}

let currentAud: HTMLAudioElement

/** [ 음원을 재생할 때 사용 ]
 * @param src 음원의 url이나 음원
 * */
const playAudio = (src: string) => {
  currentAud = new Audio(src)

  const playAudio = () => {
    currentAud.play()
  }

  playAudio()
}

export { convertCase, playAudio }
