import { useContext } from 'react'
import { AppContext, AppContextProps } from '@contexts/AppContext'

const useCharacter = () => {
  const { bookInfo } = useContext(AppContext) as AppContextProps

  const level = bookInfo.BookLevel
  let character = 'baro'

  switch (level) {
    case '6C':
    case '6B':
    case '6A':
    case '5C':
    case '5B':
    case '5A':
      character = 'dodo'
      break
    case '4C':
    case '4B':
    case '4A':
      character = 'gino'
      break
    case '3C':
      character = 'goma'
      break
    case '3B':
      character = 'leoni'
      break
    case '3A':
      character = 'edmond'
      break
    case '2C':
      character = 'roro'
      break
    case '2B':
      character = 'tori'
      break
    case '2A':
      character = 'greenthumb'
      break
    case '1C':
      character = 'blanc'
      break
    case '1B':
      character = 'sheila'
      break
    case '1A':
      character = 'jack'
      break
    case 'KC':
      character = 'millo'
      break
    case 'KB':
      character = 'chello'
      break
    default:
      character = 'baro'
  }

  return character
}

export default useCharacter
