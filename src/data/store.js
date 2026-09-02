import { useState, useEffect, useRef, useCallback } from 'react'
import { api } from './api'

// Sem realtime: recarrega quando a aba volta ao foco e de tempos em tempos,
// para o que a Marli cadastrar aparecer aqui sem ninguém apertar F5.
const INTERVALO_MS = 30000

// Backup antigo ou registro incompleto não pode virar "Mundefined" e "NaN%" na tela
const normalizar = (s) => ({
  goal: 100000,
  currentMonth: 1,
  initials: (s.name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase(),
  roadmap: {},
  ...s,
  monthly: Array.isArray(s.monthly) ? s.monthly : [],
  sessions: Array.isArray(s.sessions) ? s.sessions : [],
  products: Array.isArray(s.products) ? s.products : [],
  milestones: Array.isArray(s.milestones) ? s.milestones : [],
})

export function useStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Espelho do estado para as mutações lerem sem depender do closure
  const studentsRef = useRef([])
  useEffect(() => { studentsRef.current = students }, [students])

  const load = useCallback(async () => {
    try {
      const { students: lista } = await api.listarStudents()
      setStudents(lista.map(normalizar))
      setError('')
    } catch (err) {
      setError('Não consegui carregar os mentorados: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()

    const aoFocar = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', aoFocar)
    const timer = setInterval(aoFocar, INTERVALO_MS)

    return () => {
      document.removeEventListener('visibilitychange', aoFocar)
      clearInterval(timer)
    }
  }, [load])

  const salvar = async (student) => {
    try {
      await api.salvarStudent(student)
      setError('')
    } catch (err) {
      setError('Falha ao salvar: ' + err.message + ' — recarregue a página para ver o que está no servidor.')
    }
  }

  const updateStudent = (id, updater) => {
    const atual = studentsRef.current.find(s => s.id === id)
    if (!atual) return
    const atualizado = { ...atual, ...updater(atual) }
    setStudents(prev => prev.map(s => s.id === id ? atualizado : s))   // responde na hora
    salvar(atualizado)                                                  // e confirma no servidor
  }

  const addStudent = async (student) => {
    try {
      const { student: criado } = await api.criarStudent(student)
      setStudents(prev => [...prev, normalizar(criado)])
      setError('')
    } catch (err) {
      setError('Falha ao criar mentorado: ' + err.message)
    }
  }

  const deleteStudent = async (id) => {
    const antes = studentsRef.current
    setStudents(prev => prev.filter(s => s.id !== id))
    try {
      await api.apagarStudent(id)
      setError('')
    } catch (err) {
      setStudents(antes)                       // desfaz se o servidor recusou
      setError('Falha ao excluir: ' + err.message)
    }
  }

  // Import de backup: o servidor troca a turma inteira numa transação
  const replaceAll = async (novos) => {
    try {
      const { students: lista } = await api.substituirTodos(novos)
      setStudents(lista.map(normalizar))
      setError('')
    } catch (err) {
      setError('Falha ao importar: ' + err.message)
      throw err
    }
  }

  const addMonthly = (studentId, monthData) => {
    updateStudent(studentId, s => ({ monthly: [...s.monthly, monthData] }))
  }

  const updateMonthly = (studentId, monthIndex, monthData) => {
    updateStudent(studentId, s => {
      const monthly = [...s.monthly]
      monthly[monthIndex] = { ...monthly[monthIndex], ...monthData }
      return { monthly }
    })
  }

  const deleteMonthly = (studentId, monthIndex) => {
    updateStudent(studentId, s => ({ monthly: s.monthly.filter((_, i) => i !== monthIndex) }))
  }

  const addSession = (studentId, session) => {
    updateStudent(studentId, s => ({
      sessions: [...s.sessions, { ...session, id: crypto.randomUUID() }]
    }))
  }

  const updateSession = (studentId, sessionId, updatedSession) => {
    updateStudent(studentId, s => ({
      sessions: s.sessions.map(sess =>
        sess.id === sessionId ? { ...sess, ...updatedSession } : sess
      )
    }))
  }

  const deleteSession = (studentId, sessionId) => {
    updateStudent(studentId, s => ({ sessions: s.sessions.filter(sess => sess.id !== sessionId) }))
  }

  // Catálogo de produtos por aluno
  const addProduct = (studentId, product) => {
    updateStudent(studentId, s => ({
      products: [...(s.products || []), { ...product, id: crypto.randomUUID() }]
    }))
  }

  const removeProduct = (studentId, productId) => {
    updateStudent(studentId, s => ({
      products: (s.products || []).filter(p => p.id !== productId)
    }))
  }

  // Valores padrão por aluno (fees %, prep center, etc.)
  const updateDefaults = (studentId, newDefaults) => {
    updateStudent(studentId, s => ({ defaults: { ...(s.defaults || {}), ...newDefaults } }))
  }

  return {
    students, loading, error, reload: load,
    replaceAll, updateStudent, addStudent, deleteStudent,
    addMonthly, updateMonthly, deleteMonthly, addSession, updateSession, deleteSession,
    addProduct, removeProduct, updateDefaults,
  }
}
