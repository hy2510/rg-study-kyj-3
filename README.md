# readinggate-study-react-vite

# 참고자료

화면기획 : https://3n33g5.axshare.com/?id=zc2tuo&p=%EA%B8%B0%EB%B3%B8_%ED%99%94%EB%A9%B4_%EA%B5%AC%EC%84%B1&g=1
<br>

# 학습 설정 방법

src/assets/sample-data 폴더 하위에 설정 JSON 파일 존재

### ref.json

학습이 시작되기 전에 미리 설정되는 정보를 담은 객체이다.

- Token : 서버에서 토큰 입력
- StudyId, StudentHistoryId, LevelRoundId : 학습추가 시 할당되는 값
- BookType : EB, PB 두 값 중 한 값을 입력
- MODE : quiz, super 두 값 중 한 값을 입력
- StartSpeak : 스피크학습으로 바로 시작할 때 Y로 입력

### 폴더 설명

- assets: 프로젝트 내부에서 사용할 이미지, 음원 등을 모아두는 폴더
- components: 컴포넌트들을 모아둔 폴더
- configs: config파일이나 프로젝트 설정 파일들을 모아둔 폴더
- constants: 프로젝트에서 사용할 상수들을 정의해놓은 폴더
- contexts: context파일들을 모아놓은 폴더
- hooks: custom hook들을 모아놓은 폴더
- interfaces: 인터페이스 파일들을 모아놓은 폴더
- pages: 각 학습 페이지들을 모아둔 폴더
- services: 서버와 통신할 때 사용하는 api들을 모아놓은 폴더
- stylesheets: css파일들을 모아놓은 폴더
- utils: 공통적으로 사용하는 함수나 보안에 관련된 파일들을 모아놓은 폴더

### 이름 설명

### .env 파일은 내부 공유를 한다.
