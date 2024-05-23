import EBCSS from '@stylesheets/e-book.module.scss'

type LabelProps = {
  text: string
}

export default function Label({ text }: LabelProps) {
  return <div className={EBCSS.label}>{text}</div>
}
