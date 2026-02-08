import { useState } from 'react'
import Landing from './components/Landing'
import Login from './components/Login'

type Page = 'landing' | 'login'

export default function App() {
  const [page, setPage] = useState<Page>('landing')

  if (page === 'login') {
    return (
      <Login
        onLogin={(email, password) => console.log('login', email, password)}
        onSignUp={() => console.log('sign up clicked')}
      />
    )
  }

  return (
    <Landing onStart={() => setPage('login')} />
  )
}
