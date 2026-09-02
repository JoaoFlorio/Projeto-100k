# Projeto 100K

Sistema de gestão dos mentorados da Mentoria Individual JF.
Tudo roda no Railway: um serviço Node (Express) que serve o site em React e a API,
e um Postgres ao lado.

```
navegador  →  Express (server/)  →  Postgres
              serve o site           mentorados, usuários, sessões
              e a /api
```

## Rodar local

```bash
npm install
cp .env.example .env     # preencha o DATABASE_URL e o admin inicial
npm run dev:server       # a API na porta 3100
npm run dev              # o site na 5173, com proxy do /api para a 3100
```

Para testar igual à produção (um servidor só): `npm run build && npm start`.

## Configurar no Railway (uma vez só)

1. No projeto, **+ Create → Database → Add PostgreSQL**.
2. No serviço **do site**, aba **Variables**:

| Variável | Valor |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (referência, não o valor) |
| `NODE_ENV` | `production` |
| `ADMIN_EMAIL` | o e-mail do primeiro acesso |
| `ADMIN_PASSWORD` | senha do primeiro acesso (mín. 8 caracteres) |
| `ADMIN_NAME` | nome de quem vai entrar |

As tabelas são criadas sozinhas na primeira subida (`server/db.js`), e o primeiro
usuário é criado a partir das variáveis `ADMIN_*` — mas só se o banco ainda não tiver
ninguém. Depois de entrar, use a tela **Equipe** na barra lateral para dar acesso a
mais gente; as variáveis `ADMIN_*` podem ser apagadas.

## Segurança

- Senha guardada com **scrypt** e salt por usuário — nunca em texto puro.
- Sessão em cookie **httpOnly**: o JavaScript da página não consegue ler o token.
  Em produção o cookie também é `Secure`, por isso o `NODE_ENV=production` importa.
- Login errado responde a mesma coisa para e-mail inexistente e senha errada,
  e trava por 15 minutos depois de 8 tentativas.
- Toda rota da API (fora `/api/health` e `/api/login`) exige sessão válida.

## Como os dados ficam guardados

Cada mentorado é uma linha da tabela `students`, com o objeto inteiro (DRE mensal,
sessões, produtos, perfil) na coluna `data` em JSONB, mais quem alterou e quando.
Toda edição salva na hora; a tela recarrega sozinha quando volta ao foco e a cada
30 segundos, então o que uma pessoa cadastra aparece para a outra sem apertar F5.

O botão **Backup** exporta a turma num `.json` e importa de volta (substituindo tudo
ou mesclando só os nomes novos) — cópia de segurança e caminho para subir dados que
estavam presos no navegador de alguém.

## Testes

```bash
bash scripts/testa-api.sh
```

31 verificações de ponta a ponta: login, bloqueio sem sessão, CRUD de mentorados,
exclusão de mês/sessão/produto, import de backup e gestão da equipe. Ele **apaga os
dados do banco** que está testando, por isso só roda contra `localhost` — a máquina
não precisa ter Postgres instalado, dá para subir um descartável com `embedded-postgres`.
