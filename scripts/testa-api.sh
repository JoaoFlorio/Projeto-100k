#!/bin/bash
# Testes de ponta a ponta da API. SÓ roda contra um servidor local:
# ele apaga os dados do banco alvo antes de começar.
#
#   1) suba um Postgres de teste e o servidor apontando para ele
#   2) bash scripts/testa-api.sh
API=${API:-http://localhost:3100/api}
DB=${DB:-postgresql://teste:teste@localhost:55432/p100k}
EMAIL=${EMAIL:-teste@local}
SENHA=${SENHA:-senha-de-teste-123}

case "$API" in
  http://localhost:*|http://127.0.0.1:*) ;;
  *) echo "RECUSADO: este script apaga dados. Só roda contra localhost (API=$API)"; exit 1 ;;
esac

JAR=$(mktemp); JAR2=$(mktemp)
ok=0; falhou=0
check() {
  if [ "$2" = "$3" ]; then echo "  OK    $1"; ok=$((ok+1))
  else echo "  FALHA $1 — esperava [$2], veio [$3]"; falhou=$((falhou+1)); fi
}
code() { curl -s -o /dev/null -w "%{http_code}" -b $JAR -c $JAR "$@"; }
body() { curl -s -b $JAR -c $JAR "$@"; }
json() { node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const o=JSON.parse(d);console.log(new Function("o","return o"+process.argv[1])(o))}catch(e){console.log("ERRO")}})' "$1"; }


node -e "
import('$PWD/node_modules/pg/lib/index.js').then(async ({default: pg}) => {
  const c = new pg.Client({ connectionString: '$DB' }); await c.connect()
  await c.query('delete from students'); await c.query('delete from users where email <> \$1', ['$EMAIL']); await c.end()
})" 2>/dev/null || { echo "não consegui zerar o banco ($DB)"; exit 1; }

echo "== sem estar logado =="
check "listar mentorados bloqueia" 401 "$(code $API/students)"
check "listar equipe bloqueia"     401 "$(code $API/users)"
check "/me bloqueia"               401 "$(code $API/me)"

echo "== login =="
printf '{"email":"%s","password":"errada-mesmo"}' "$EMAIL" > /tmp/p100k-login-errado.json
check "senha errada recusada" 401 "$(code -X POST -H 'Content-Type: application/json' --data-binary @/tmp/p100k-login-errado.json $API/login)"
check "e-mail inexistente recusado" 401 "$(code -X POST -H 'Content-Type: application/json' -d '{"email":"ninguem@local","password":"x123456789"}' $API/login)"
printf '{"email":"%s","password":"%s"}' "$EMAIL" "$SENHA" > /tmp/p100k-login.json
check "senha certa entra" 200 "$(code -X POST -H 'Content-Type: application/json' --data-binary @/tmp/p100k-login.json $API/login)"
check "/me responde" 200 "$(code $API/me)"
check "cookie httpOnly" 1 "$(grep -c HttpOnly $JAR)"

echo "== mentorados =="
check "turma vazia" "0" "$(body $API/students | json '.students.length')"
cat > /tmp/p100k-novo.json <<'JSON'
{"student":{"name":"Aluno de Teste","initials":"AT","currentMonth":1,"goal":100000,
"monthly":[{"month":1,"label":"Jan/26","revenue":1000,"returns":0,"cogs":400,"amazonFees":150,"prepCenter":0,"ads":50,"shipping":0,"accounting":0,"taxes":60,"acos":5,"units":10,"avgTicket":100},
           {"month":2,"label":"Fev/26","revenue":2000,"returns":0,"cogs":800,"amazonFees":300,"prepCenter":0,"ads":100,"shipping":0,"accounting":0,"taxes":120,"acos":5,"units":20,"avgTicket":100}],
"sessions":[{"id":"s1","date":"2026-01-10","duration":60,"notes":"call","actions":["a"],"done":true}],
"products":[{"id":"p1","name":"Produto","cost":40,"asin":"B0X"}],"milestones":[],"roadmap":{}}}
JSON
ID=$(body -X POST -H 'Content-Type: application/json' --data-binary @/tmp/p100k-novo.json $API/students | json '.student.id')
check "criar devolve uuid" 36 "${#ID}"
check "turma tem 1" "1" "$(body $API/students | json '.students.length')"

echo "== exclusões dentro do aluno (o front manda o aluno inteiro) =="
cat > /tmp/p100k-sem-mes.json <<JSON
{"student":{"id":"$ID","name":"Aluno de Teste","initials":"AT","currentMonth":1,"goal":100000,
"monthly":[{"month":2,"label":"Fev/26","revenue":2000,"returns":0,"cogs":800,"amazonFees":300,"prepCenter":0,"ads":100,"shipping":0,"accounting":0,"taxes":120,"acos":5,"units":20,"avgTicket":100}],
"sessions":[],"products":[],"milestones":[],"roadmap":{}}}
JSON
check "salvar sem o mês/sessão/produto" 200 "$(code -X PUT -H 'Content-Type: application/json' --data-binary @/tmp/p100k-sem-mes.json $API/students/$ID)"
check "sobrou 1 mês"      "1" "$(body $API/students | json '.students[0].monthly.length')"
check "sobrou 0 sessões"  "0" "$(body $API/students | json '.students[0].sessions.length')"
check "sobrou 0 produtos" "0" "$(body $API/students | json '.students[0].products.length')"
check "o mês que ficou é o certo" "Fev/26" "$(body $API/students | json '.students[0].monthly[0].label')"
check "editar id inexistente dá 404" 404 "$(code -X PUT -H 'Content-Type: application/json' -d '{"student":{"name":"x"}}' $API/students/11111111-1111-1111-1111-111111111111)"
check "corpo malformado dá 400" 400 "$(code -X PUT -H 'Content-Type: application/json' -d '{"quebrado":' $API/students/$ID)"

echo "== import de backup =="
check "import substitui tudo" 200 "$(code -X PUT -H 'Content-Type: application/json' -d '{"students":[{"id":"1","name":"Do Backup","monthly":[],"sessions":[]}]}' $API/students)"
check "turma virou 1" "1" "$(body $API/students | json '.students.length')"
check "nome certo" "Do Backup" "$(body $API/students | json '.students[0].name')"

echo "== excluir mentorado inteiro =="
DEL=$(body $API/students | json '.students[0].id')
check "excluir responde" 200 "$(code -X DELETE $API/students/$DEL)"
check "turma vazia de novo" "0" "$(body $API/students | json '.students.length')"

echo "== equipe =="
check "criar acesso" 200 "$(code -X POST -H 'Content-Type: application/json' -d '{"email":"outra@local","password":"senha-da-outra-1","name":"Outra"}' $API/users)"
check "e-mail repetido recusado" 409 "$(code -X POST -H 'Content-Type: application/json' -d '{"email":"outra@local","password":"outra-senha-123"}' $API/users)"
check "senha curta recusada" 400 "$(code -X POST -H 'Content-Type: application/json' -d '{"email":"curta@local","password":"1234"}' $API/users)"
check "equipe com 2" "2" "$(body $API/users | json '.users.length')"
MEU=$(body $API/me | json '.user.id')
check "não removo a mim mesmo" 400 "$(code -X DELETE $API/users/$MEU)"

echo "== a outra pessoa vê a mesma base =="
curl -s -o /dev/null -c $JAR2 -X POST -H 'Content-Type: application/json' -d '{"email":"outra@local","password":"senha-da-outra-1"}' $API/login
check "ela entra" "0" "$(curl -s -b $JAR2 $API/students | json '.students.length')"

echo "== logout =="
check "logout responde" 200 "$(code -X POST $API/logout)"
check "bloqueia de novo" 401 "$(code $API/students)"

rm -f $JAR $JAR2
echo
echo "RESULTADO: $ok passaram, $falhou falharam"
[ $falhou -eq 0 ]
