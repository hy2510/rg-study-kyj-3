type GapProps = {
  height: number
}

export default function Gap({ height }: GapProps) {
  return <div style={{ height: `${height}px` }}></div>
}
