import { useState } from 'react'
import Landing from './components/Landing'
import Login from './components/Login'
import Question from './components/Question'
import DrawingBoard from './components/DrawingBoard'
import Profile from './components/Profile'

type Page = 'landing' | 'login' | 'question' | 'drawing' | 'profile'

export default function App() {
  const [page, setPage] = useState<Page>('landing')
  const [savedDrawings, setSavedDrawings] = useState<string[]>([])

  if (page === 'profile') {
    return (
      <Profile
        onGoToCanvas={() => setPage('drawing')}
        savedDrawings={savedDrawings}
      />
    )
  }

  if (page === 'drawing') {
    return (
      <DrawingBoard
        onSave={(dataUrl) => setSavedDrawings((prev) => [...prev, dataUrl])}
        onProfile={() => setPage('profile')}
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
