import { useState } from 'react'
import Landing from './components/Landing'
import Login from './components/Login'
import Question from './components/Question'
import DrawingBoard from './components/DrawingBoard'
import DrawingPreview from './components/DrawingPreview'
import ChooseDance from './components/ChooseDance'
import Profile from './components/Profile'

type Page = 'landing' | 'login' | 'question' | 'drawing' | 'preview' | 'chooseDance' | 'profile'

export default function App() {
  const [page, setPage] = useState<Page>('landing')
  const [savedDrawings, setSavedDrawings] = useState<string[]>([])
  const [currentDrawing, setCurrentDrawing] = useState<string>('')

  const handleSave = (dataUrl: string) => {
    setSavedDrawings((prev) => [...prev, dataUrl])
    setCurrentDrawing(dataUrl)
    setPage('preview')
  }

  if (page === 'chooseDance') {
    return (
      <ChooseDance
        drawingDataUrl={currentDrawing}
        onSelect={(dance) => {
          console.log('selected dance:', dance)
          setPage('drawing')
        }}
      />
    )
  }

  if (page === 'preview') {
    return (
      <DrawingPreview
        drawingDataUrl={currentDrawing}
        onDone={() => setPage('chooseDance')}
      />
    )
  }

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
        onSave={handleSave}
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
