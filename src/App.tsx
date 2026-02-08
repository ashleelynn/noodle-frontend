import { useState } from 'react'
import Landing from './components/Landing'
import Login from './components/Login'
import Question from './components/QuestionWithElevenLabsAgent'
import DrawMode from './components/DrawMode'
import DrawingBoard from './components/DrawingBoard'
import DrawingPreview from './components/DrawingPreview'
import Profile from './components/Profile'
import {
  createDrawingSession,
  getMyDrawings,
  loginWithBackend,
  registerWithBackend,
  saveDrawing,
  type AuthUser,
} from './lib/api'

type Page = 'landing' | 'login' | 'question' | 'drawMode' | 'drawing' | 'preview' | 'profile'
type DrawingMode = 'freestyle' | 'buddy'
type SavedDrawing = {
  dataUrl: string
  title: string
}

export default function App() {
  const [page, setPage] = useState<Page>('landing')
  const [savedDrawings, setSavedDrawings] = useState<SavedDrawing[]>([])
  const [currentDrawing, setCurrentDrawing] = useState<string>('')
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('freestyle')
  const [authToken, setAuthToken] = useState<string>('')
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null)
  const [userInterests, setUserInterests] = useState<string[]>(['dinosaurs', 'birthdays', 'cake'])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [welcomeTranscript, setWelcomeTranscript] = useState<string>('')

  const refreshDrawings = async (token: string) => {
    try {
      const drawings = await getMyDrawings(token)
      const mapped = drawings
        .map((drawing) => {
          const dataUrl = drawing.thumbnail_url || drawing.canvas_data
          if (!dataUrl) {
            return null
          }
          return {
            dataUrl,
            title: drawing.title?.trim() || 'My Drawing',
          }
        })
        .filter((item): item is SavedDrawing => Boolean(item))
      setSavedDrawings(mapped)
    } catch {
      // Keep existing local drawings on fetch failure.
    }
  }

  const handleSave = async (dataUrl: string) => {
    setCurrentDrawing(dataUrl)
    setPage('preview')
  }

  const handleFinalizeSave = async (title: string) => {
    const normalizedTitle = title.trim() || 'My Drawing'

    if (authToken && currentSessionId) {
      try {
        await saveDrawing(authToken, currentSessionId, currentDrawing, normalizedTitle)
        await refreshDrawings(authToken)
      } catch {
        // Preserve local flow if backend save fails.
        setSavedDrawings((prev) => [...prev, { dataUrl: currentDrawing, title: normalizedTitle }])
      }
    } else {
      setSavedDrawings((prev) => [...prev, { dataUrl: currentDrawing, title: normalizedTitle }])
    }
    setPage('profile')
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
        // Use Gemini ROLE 1: Interest Extraction Agent to analyze conversation
        if (authToken && welcomeTranscript.trim()) {
          try {
            const headers: HeadersInit = {
              'Content-Type': 'application/json',
            }
            if (authToken) {
              headers['Authorization'] = `Bearer ${authToken}`
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8004'}/api/ai/gemini/extract-interests`, {
              method: 'POST',
              headers,
              body: JSON.stringify({
                conversation_transcripts: [welcomeTranscript],
                child_name: currentUser?.username,
                child_age: 5,
              }),
            })

            if (response.ok) {
              const data = await response.json()
              console.log('Gemini extracted interests:', data)

              // Use Gemini-extracted interests
              if (data.interests && data.interests.length > 0) {
                setUserInterests(data.interests)
              } else {
                // Fallback to defaults
                setUserInterests(['dinosaurs', 'birthdays', 'cake'])
              }
            } else {
              console.warn('Interest extraction failed, using defaults')
              setUserInterests(['dinosaurs', 'birthdays', 'cake'])
            }
          } catch (err) {
            console.error('Error extracting interests:', err)
            // Fallback to defaults
            setUserInterests(['dinosaurs', 'birthdays', 'cake'])
          }
        } else {
          // No transcript or auth token - use defaults
          console.log('No transcript available, using default interests')
          setUserInterests(['dinosaurs', 'birthdays', 'cake'])
        }
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

  if (page === 'preview') {
    return (
      <DrawingPreview
        drawingDataUrl={currentDrawing}
        onBackToDrawing={() => setPage('drawing')}
        onSave={handleFinalizeSave}
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
        authToken={authToken}
        userInterests={userInterests}
        userAge={5}
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
    return <Question
      authToken={authToken}
      onContinue={(transcript) => {
        setWelcomeTranscript(transcript)
        setPage('drawMode')
      }}
    />
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
