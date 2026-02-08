import { useState } from 'react'
import Landing from './components/Landing'
import Login from './components/Login'
import Question from './components/Question'
import DrawingBoard from './components/DrawingBoard'

type Page = 'landing' | 'login' | 'question' | 'drawing'

export default function App() {
  const [page, setPage] = useState<Page>('landing')

  if (page === 'drawing') {
    return (
      <DrawingBoard
        onSave={(dataUrl) => console.log('saved drawing', dataUrl.slice(0, 50))}
      />
    )
  }

  if (page === 'question') {
    return <Question onContinue={() => setPage('drawing')} />
  }

  if (page === 'login') {
    return (
      <Login
        onLogin={() => setPage('question')}
        onSignUp={() => console.log('sign up clicked')}
      />
    )
  }

  return (
    <Landing onStart={() => setPage('login')} />
  )
}
