 export const useDeviceDetection = () =>  {
  const isMobile = /Android|iPhone|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  return isMobile;
}

export default useDeviceDetection