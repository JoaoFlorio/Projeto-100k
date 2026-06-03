import { useState, useEffect } from 'react'
import { INITIAL_STUDENTS } from './mockData'

const STORAGE_KEY = 'p100k_students'

export function useStudents() {
  const [students, setStudents] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : INITIAL_STUDENTS
    } catch {
      return INITIAL_STUDENTS
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students))
  }, [students])

  const updateStudent = (id, updater) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updater(s) } : s))
  }

  const addStudent = (student) => {
    setStudents(prev => [...prev, { ...student, id: Date.now().toString() }])
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

  const addSession = (studentId, session) => {
    updateStudent(studentId, s => ({
      sessions: [...s.sessions, { ...session, id: Date.now().toString() }]
    }))
  }

  const updateSession = (studentId, sessionId, updatedSession) => {
    updateStudent(studentId, s => ({
      sessions: s.sessions.map(sess =>
        sess.id === sessionId ? { ...sess, ...updatedSession } : sess
      )
    }))
  }

  const deleteStudent = (id) => {
    setStudents(prev => prev.filter(s => s.id !== id))
  }

  const resetData = () => {
    setStudents(INITIAL_STUDENTS)
  }

  // Products catalog per student
  const addProduct = (studentId, product) => {
    updateStudent(studentId, s => ({
      products: [...(s.products || []), { ...product, id: Date.now().toString() }]
    }))
  }

  const removeProduct = (studentId, productId) => {
    updateStudent(studentId, s => ({
      products: (s.products || []).filter(p => p.id !== productId)
    }))
  }

  // Saved defaults per student (fees %, prep center, etc.)
  const updateDefaults = (studentId, newDefaults) => {
    updateStudent(studentId, s => ({ defaults: { ...(s.defaults || {}), ...newDefaults } }))
  }

  return { students, setStudents, updateStudent, addStudent, deleteStudent, addMonthly, updateMonthly, addSession, updateSession, addProduct, removeProduct, updateDefaults, resetData }
}
