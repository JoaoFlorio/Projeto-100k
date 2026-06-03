export const ROADMAP_PHASES = [
  { id: 'M1', label: 'Mês 1', title: 'Implementação', desc: 'Conta seller, primeiros produtos, logística' },
  { id: 'M2', label: 'Mês 2', title: 'Fornecedores', desc: 'Compras estratégicas, primeiras importações' },
  { id: 'M3', label: 'Mês 3', title: 'Publicidade', desc: 'Campanhas PPC, ACOS abaixo de 25%' },
  { id: 'M4', label: 'Mês 4', title: 'Pré-Escala', desc: 'SKUs selecionados, estoque consistente' },
  { id: 'M5', label: 'Mês 5', title: 'Escala', desc: 'Volume de compras, múltiplos canais' },
  { id: 'M6', label: 'Mês 6', title: 'Consolidação', desc: 'Processo rodando, meta R$100k atingida' },
]

export const INITIAL_STUDENTS = [
  {
    id: '1',
    name: 'Carlos Mendes',
    photo: '',
    initials: 'CM',
    startDate: '2026-01-01',
    currentMonth: 4,
    goal: 100000,
    whatsapp: '35991234567',
    roadmap: { M1: 'done', M2: 'done', M3: 'done', M4: 'active', M5: 'pending', M6: 'pending' },
    milestones: [
      { title: 'Primeira venda', date: '2026-01-15', value: 320 },
      { title: 'Primeiro R$10k', date: '2026-02-20', value: 10800 },
      { title: 'Primeiro R$30k', date: '2026-04-05', value: 31200 },
    ],
    monthly: [
      { month: 1, label: 'Jan/26', revenue: 4200, returns: 200, cogs: 2100, amazonFees: 630, prepCenter: 300, ads: 420, shipping: 180, accounting: 150, taxes: 120, acos: 32, units: 28, avgTicket: 150 },
      { month: 2, label: 'Fev/26', revenue: 12800, returns: 400, cogs: 5800, amazonFees: 1920, prepCenter: 400, ads: 980, shipping: 380, accounting: 150, taxes: 380, acos: 24, units: 74, avgTicket: 173 },
      { month: 3, label: 'Mar/26', revenue: 24600, returns: 700, cogs: 10800, amazonFees: 3690, prepCenter: 500, ads: 1600, shipping: 620, accounting: 150, taxes: 680, acos: 20, units: 138, avgTicket: 178 },
      { month: 4, label: 'Abr/26', revenue: 38500, returns: 900, cogs: 16500, amazonFees: 5775, prepCenter: 600, ads: 2200, shipping: 950, accounting: 150, taxes: 980, acos: 18, units: 210, avgTicket: 183 },
    ],
    sessions: [
      { id: 's1', date: '2026-01-08', duration: 60, notes: 'Configuração inicial da conta Seller Central. Escolha dos primeiros 5 produtos.', actions: ['Abrir conta Seller', 'Enviar 5 SKUs pra galpão', 'Configurar pricing automático'], done: true },
      { id: 's2', date: '2026-01-22', duration: 60, notes: 'Primeiros resultados: 12 unidades vendidas. ACOS alto mas esperado. Ajuste de campanhas.', actions: ['Ajustar lances PPC', 'Adicionar negative keywords', 'Pedir 3 reviews'], done: true },
      { id: 's3', date: '2026-02-05', duration: 60, notes: 'Faturamento acelerando. Aprovado no programa Prime. Discutimos compra compartilhada.', actions: ['Entrar na compra compartilhada deste mês', 'Criar campanha Sponsored Brands'], done: true },
      { id: 's4', date: '2026-04-20', duration: 60, notes: 'Review do mês 4. ACOS em 18% — excelente. Planejando escala para maio.', actions: ['Dobrar orçamento ads em top 3 produtos', 'Importar lote de 500 unidades', 'Mapear 3 novos SKUs'], done: false },
    ],
  },
  {
    id: '2',
    name: 'Ana Paula Souza',
    photo: '',
    initials: 'AP',
    startDate: '2026-02-01',
    currentMonth: 3,
    goal: 100000,
    whatsapp: '35998765432',
    roadmap: { M1: 'done', M2: 'done', M3: 'active', M4: 'pending', M5: 'pending', M6: 'pending' },
    milestones: [
      { title: 'Primeira venda', date: '2026-02-12', value: 189 },
      { title: 'Primeiro R$5k', date: '2026-03-08', value: 5400 },
    ],
    monthly: [
      { month: 1, label: 'Fev/26', revenue: 2800, returns: 100, cogs: 1400, amazonFees: 420, prepCenter: 300, ads: 280, shipping: 120, accounting: 150, taxes: 80, acos: 38, units: 18, avgTicket: 156 },
      { month: 2, label: 'Mar/26', revenue: 8900, returns: 280, cogs: 4100, amazonFees: 1335, prepCenter: 380, ads: 650, shipping: 280, accounting: 150, taxes: 260, acos: 26, units: 52, avgTicket: 171 },
      { month: 3, label: 'Abr/26', revenue: 19200, returns: 520, cogs: 8400, amazonFees: 2880, prepCenter: 450, ads: 1100, shipping: 490, accounting: 150, taxes: 540, acos: 21, units: 106, avgTicket: 181 },
    ],
    sessions: [
      { id: 's1', date: '2026-02-10', duration: 60, notes: 'Onboarding. Definição de nicho: eletrônicos acessórios. Capital inicial R$8k.', actions: ['Abrir conta PJ', 'Selecionar 4 produtos iniciais'], done: true },
      { id: 's2', date: '2026-03-10', duration: 60, notes: 'Mês 2 positivo. Acelerando bem acima da média da turma.', actions: ['Participar da compra coletiva de março', 'Testar auto campaign'], done: true },
    ],
  },
  {
    id: '3',
    name: 'Roberto Lima',
    photo: '',
    initials: 'RL',
    startDate: '2026-03-01',
    currentMonth: 2,
    goal: 100000,
    whatsapp: '35997654321',
    roadmap: { M1: 'done', M2: 'active', M3: 'pending', M4: 'pending', M5: 'pending', M6: 'pending' },
    milestones: [
      { title: 'Primeira venda', date: '2026-03-18', value: 210 },
    ],
    monthly: [
      { month: 1, label: 'Mar/26', revenue: 1800, returns: 80, cogs: 900, amazonFees: 270, prepCenter: 300, ads: 190, shipping: 90, accounting: 150, taxes: 50, acos: 44, units: 10, avgTicket: 180 },
      { month: 2, label: 'Abr/26', revenue: 5600, returns: 180, cogs: 2600, amazonFees: 840, prepCenter: 320, ads: 380, shipping: 170, accounting: 150, taxes: 160, acos: 30, units: 30, avgTicket: 187 },
    ],
    sessions: [
      { id: 's1', date: '2026-03-05', duration: 60, notes: 'Primeiro encontro. Roberto já tinha conta seller mas nunca vendeu. Plano de 90 dias definido.', actions: ['Ativar conta', 'Enviar primeiros produtos'], done: true },
    ],
  },
]
