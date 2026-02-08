import { useState } from 'react'
import Landing from './components/Landing'
import Login from './components/Login'
import Question from './components/Question'

type Page = 'landing' | 'login' | 'question'

export default function App() {
  const [page, setPage] = useState<Page>('landing')

  if (page === 'question') {
    return <Question />
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
