import Lottie from "react-lottie";

import aniDataScrollDown from "@assets/anims/scrolldown.json";
import aniDataRecord from "@assets/anims/record.json";
import aniDataUserSay from "@assets/anims/user-say.json";
import aniDataAudioPlay from "@assets/anims/audio-play.json";
import aniDataExcellent from "@assets/anims/excellent.json";
import aniDataGoodEffort from "@assets/anims/good-effort.json";

export function LottieScrollDownAni() {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: aniDataScrollDown,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return (
    <>
      <Lottie options={defaultOptions} height={300} width={300} />
    </>
  );
}

export function LottieRecordAni() {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: aniDataRecord,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return (
    <>
      <Lottie options={defaultOptions} height={40} width={40} />
    </>
  );
}

export function LottieUserSayAni() {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: aniDataUserSay,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return (
    <>
      <Lottie options={defaultOptions} height={80} width={98} />
    </>
  );
}

export function LottieAudioPlayAni() {
  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: aniDataAudioPlay,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return (
    <>
      <Lottie options={defaultOptions} height={40} width={50} />
    </>
  );
}

export function LottieExcellentAni() {
  const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: aniDataExcellent,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return (
    <>
      <Lottie options={defaultOptions} height={400} width={400} />
    </>
  );
}

export function LottieGoodEffortAni() {
  const defaultOptions = {
    loop: false,
    autoplay: true,
    animationData: aniDataGoodEffort,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return (
    <>
      <Lottie options={defaultOptions} height={300} width={400} />
    </>
  );
}
