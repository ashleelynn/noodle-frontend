import { useState } from 'react'
import Landing from './components/Landing'
import Login from './components/Login'
import Question from './components/Question'
import DrawMode from './components/DrawMode'
import DrawingBoard from './components/DrawingBoard'
import DrawingPreview from './components/DrawingPreview'
import ChooseDance from './components/ChooseDance'
import Profile from './components/Profile'
import {
  createDrawingSession,
  generateBuddyPromptFromInterests,
  getMyDrawings,
  loginWithBackend,
  registerWithBackend,
  saveDrawing,
  type AuthUser,
} from './lib/api'

type Page = 'landing' | 'login' | 'question' | 'drawMode' | 'drawing' | 'preview' | 'chooseDance' | 'profile'
type DrawingMode = 'freestyle' | 'buddy'

export default function App() {
  const [page, setPage] = useState<Page>('landing')
  const [savedDrawings, setSavedDrawings] = useState<string[]>([])
  const [currentDrawing, setCurrentDrawing] = useState<string>('')
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('freestyle')
  const [authToken, setAuthToken] = useState<string>('')
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)
  const [buddyPrompt, setBuddyPrompt] = useState<string>('dinosaur\'s birthday')
  const [buddyGuideQuestions, setBuddyGuideQuestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [welcomeTranscript, setWelcomeTranscript] = useState<string>('')

  const refreshDrawings = async (token: string) => {
    try {
      const drawings = await getMyDrawings(token)
      const mapped = drawings
        .map((drawing) => drawing.thumbnail_url || drawing.canvas_data)
        .filter((item): item is string => Boolean(item))
      setSavedDrawings(mapped)
    } catch {
      // Keep existing local drawings on fetch failure.
    }
  }

  const handleSave = async (dataUrl: string) => {
    if (authToken && currentSessionId) {
      try {
        await saveDrawing(authToken, currentSessionId, dataUrl, 'My Drawing')
        await refreshDrawings(authToken)
      } catch {
        // Preserve local flow if backend save fails.
      }
    }
    setSavedDrawings((prev) => [...prev, dataUrl])
    setCurrentDrawing(dataUrl)
    setPage('preview')
  }

  const handleAuth = async (payload: {
    username: string
    email: string
    password: string
    mode: 'login' | 'signup'
  }) => {
    try {
      setIsLoading(true)
      setErrorMessage('')
      const response = payload.mode === 'signup'
        ? await registerWithBackend(payload.username, payload.email, payload.password)
        : await loginWithBackend(payload.username, payload.password)

      setAuthToken(response.access_token)
      setCurrentUser(response.user)
      await refreshDrawings(response.access_token)
      setPage('question')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectMode = async (mode: DrawingMode) => {
    try {
      setIsLoading(true)
      setErrorMessage('')
      setDrawingMode(mode)

      if (mode === 'buddy') {
        const inferredInterests = welcomeTranscript
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 4)
        const generated = generateBuddyPromptFromInterests(inferredInterests)
        setBuddyPrompt(generated.prompt)
        setBuddyGuideQuestions(generated.guideQuestions)
      } else {
        setBuddyPrompt('dinosaur\'s birthday')
        setBuddyGuideQuestions([])
      }

      if (authToken) {
        const session = await createDrawingSession(authToken, 'luna', 'digital')
        setCurrentSessionId(session.id)
      }

      setPage('drawing')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not start drawing session')
    } finally {
      setIsLoading(false)
    }
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
        username={currentUser?.username || ''}
        userEmail={currentUser?.email || ''}
        userInterests={welcomeTranscript}
      />
    )
  }

  if (page === 'drawing') {
    return (
      <DrawingBoard
        initialFreestyle={drawingMode === 'freestyle'}
        drawingPrompt={drawingMode === 'buddy' ? buddyPrompt : undefined}
        aiMessage={drawingMode === 'buddy' && buddyGuideQuestions.length > 0 ? buddyGuideQuestions[0] : undefined}
        onSave={handleSave}
        onProfile={() => setPage('profile')}
      />
    )
  }

  if (page === 'drawMode') {
    return (
      <DrawMode
        onSelectFreestyle={() => void handleSelectMode('freestyle')}
        onSelectBuddy={() => void handleSelectMode('buddy')}
      />
    )
  }

  if (page === 'question') {
    return <Question onContinue={(transcript) => {
      setWelcomeTranscript(transcript)
      setPage('drawMode')
    }} />
  }

  if (page === 'login') {
    return (
      <Login
        onAuth={(payload) => void handleAuth(payload)}
        onSignUp={() => console.log('sign up clicked')}
        isLoading={isLoading}
        errorMessage={errorMessage}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#f4f1ed] flex items-center justify-center">
        <p style={{ fontFamily: '"Just Me Again Down Here", cursive', fontSize: '64px' }}>
          loading...
        </p>
      </div>
    )
  }

  if (errorMessage && !currentUser && page === 'landing') {
    return (
      <div className="h-screen w-screen bg-[#f4f1ed] flex items-center justify-center px-6">
        <p className="text-center" style={{ fontFamily: '"Just Me Again Down Here", cursive', fontSize: '42px' }}>
          {errorMessage}
        </p>
      </div>
    )
  }

  return (
    <Landing onStart={() => setPage('login')} />
  )
}
