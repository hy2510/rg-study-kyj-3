import { useEffect, useRef } from 'react'

export default function useInterval(tickFn: () => void, delay: number) {
  const callback = useRef<() => void>()

  useEffect(() => {
    callback.current = tickFn
  }, [tickFn])

  useEffect(() => {
    function tick() {
      callback.current && callback.current()
    }
    tick()
    const id = setInterval(tick, delay)
    return () => {
      clearInterval(id)
    }
  }, [delay])
}
