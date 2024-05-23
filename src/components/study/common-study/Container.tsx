type ContainerProps = {
  typeCSS: string
  containerCSS: string
  children: JSX.Element | JSX.Element[]
}

export default function Container({
  typeCSS,
  containerCSS,
  children,
}: ContainerProps) {
  return (
    <div className={`${typeCSS}`}>
      <div className={`${containerCSS}`}>{children}</div>
    </div>
  )
}
