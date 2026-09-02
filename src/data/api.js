// Cliente da API do próprio servidor (server/). O cookie de sessão é httpOnly:
// o navegador manda sozinho, o JavaScript daqui nunca vê o token.

async function req(caminho, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + caminho, {
    method,
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  let json = null
  try { json = await res.json() } catch { /* resposta sem corpo */ }

  if (!res.ok) {
    const erro = new Error(json?.error || `Erro ${res.status}`)
    erro.status = res.status
    throw erro
  }
  return json
}

export const api = {
  // sessão
  me:       ()               => req('/me'),
  login:    (email, password) => req('/login', { method: 'POST', body: { email, password } }),
  logout:   ()               => req('/logout', { method: 'POST' }),
  trocarSenha: (currentPassword, newPassword) =>
    req('/me/password', { method: 'PUT', body: { currentPassword, newPassword } }),

  // mentorados
  listarStudents: ()          => req('/students'),
  criarStudent:   (student)   => req('/students', { method: 'POST', body: { student } }),
  salvarStudent:  (student)   => req(`/students/${student.id}`, { method: 'PUT', body: { student } }),
  apagarStudent:  (id)        => req(`/students/${id}`, { method: 'DELETE' }),
  substituirTodos:(students)  => req('/students', { method: 'PUT', body: { students } }),

  // Oráculo
  sincronizarOraculo: (id, ano, mes) => req(`/students/${id}/oraculo/sync`, { method: 'POST', body: { ano, mes } }),
  autorizarOraculo:   (id)           => req(`/students/${id}/oraculo/autorizar`, { method: 'POST', body: {} }),

  // equipe
  listarUsers: ()                 => req('/users'),
  criarUser:   (email, password, name) => req('/users', { method: 'POST', body: { email, password, name } }),
  apagarUser:  (id)               => req(`/users/${id}`, { method: 'DELETE' }),
}
