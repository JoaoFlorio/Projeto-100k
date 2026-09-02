import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useStudents } from './data/store'
import { api } from './data/api'
import Sidebar from './components/Layout/Sidebar'
import Dashboard from './pages/Dashboard'
import StudentProfile from './pages/StudentProfile'
import LoginPage from './pages/LoginPage'

export default function App() {
  const [user, setUser] = useState(null)
  const [checando, setChecando] = useState(true)

  // O cookie de sessão pode já existir de uma visita anterior
  useEffect(() => {
    api.me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setChecando(false))
  }, [])

  const sair = async () => {
    try { await api.logout() } finally { setUser(null) }
  }

  if (checando) return <TelaCarregando texto="Verificando acesso..." />
  if (!user) return <LoginPage onLogin={setUser} />

  return <AppContent user={user} onLogout={sair} />
}

function TelaCarregando({ texto }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 14 }}>
      {texto}
    </div>
  )
}

function AppContent({ user, onLogout }) {
  const {
    students, loading, error,
    addStudent, deleteStudent, replaceAll,
    addMonthly, updateMonthly, deleteMonthly, addSession, updateSession, deleteSession, updateStudent,
  } = useStudents()

  if (loading) return <TelaCarregando texto="Carregando mentorados..." />

  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a' }}>
        <Sidebar students={students} onLogout={onLogout} email={user.email} />
        <main style={{ flex: 1, overflowY: 'auto', minHeight: '100vh' }}>
          {error && (
            <div style={{ padding: '10px 36px', background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: 12.5 }}>
              {error}
            </div>
          )}
          <Routes>
            <Route path="/" element={<Dashboard students={students} onAddStudent={addStudent} onDeleteStudent={deleteStudent} onImportStudents={replaceAll} />} />
            <Route
              path="/aluno/:id"
              element={
                <StudentProfile
                  students={students}
                  onAddMonthly={addMonthly}
                  onUpdateMonthly={updateMonthly}
                  onDeleteMonthly={deleteMonthly}
                  onAddSession={addSession}
                  onUpdateSession={updateSession}
                  onDeleteSession={deleteSession}
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
