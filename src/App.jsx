import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useStudents } from './data/store'
import Sidebar from './components/Layout/Sidebar'
import Dashboard from './pages/Dashboard'
import StudentProfile from './pages/StudentProfile'
import LoginPage from './pages/LoginPage'

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => localStorage.getItem('p100k_auth') === '1'
  )

  const handleLogout = () => {
    localStorage.removeItem('p100k_auth')
    setIsLoggedIn(false)
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />
  }

  return <AppContent onLogout={handleLogout} />
}

function AppContent({ onLogout }) {
  const { students, addStudent, deleteStudent, addMonthly, updateMonthly, addSession, updateSession, updateStudent } = useStudents()

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a' }}>
        <Sidebar students={students} onLogout={onLogout} />
        <main style={{ flex: 1, overflowY: 'auto', minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<Dashboard students={students} onAddStudent={addStudent} onDeleteStudent={deleteStudent} />} />
            <Route
              path="/aluno/:id"
              element={
                <StudentProfile
                  students={students}
                  onAddMonthly={addMonthly}
                  onUpdateMonthly={updateMonthly}
                  onAddSession={addSession}
                  onUpdateSession={updateSession}
                  onUpdateStudent={updateStudent}
                />
              }
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
