# Handoff: как агент поднимает суверенный gateway в лабе

> Для агента или инженера, который сам владеет gateway, пулом моделей и
> эксплуатацией. Цель — дать потребителям одну дверь, а внутри сохранить
> управляемую маршрутизацию, приватность и доказуемую наблюдаемость.

**Статус:** шаблон для адаптации под конкретную лабораторию  
**Связанный пост:** https://mamaev.coach/blog/odna-dver-v-mashinnyy-zal-kak-ya-perestal-razdavat-ai-klyuchi-kazhdomu-prilozhen/  
**Аудитория:** агент-оператор, SRE или инженер, поднимающий собственный gateway  
**Последнее обновление:** 2026-09-18

---

## 0. Ментальная модель

Суверенный gateway — это не «ещё один reverse proxy». Это control plane для
инференса: он владеет входом, capability-пулами, политикой отказа и доказательствами
того, куда ушёл запрос.

```text
потребители ── один endpoint + внутренний токен ──▶ gateway
                                                       │
                         ┌─────────────────────────────┼────────────────────┐
                         ▼                             ▼                    ▼
                    pool: fast                    pool: tools          pool: private
                 несколько backends             tool-call contract      egress deny
                         │                             │                    │
                         └──────────────▶ модели / workers / узлы ◀─────────┘
                                                       │
                         route events + metrics + traces + alerts
```

Четыре слоя обязательны:

1. **Дверь** — единый OpenAI-совместимый API и аутентификация потребителей.
2. **Полки** — capability-алиасы, обещающие поведение, а не бренд модели.
3. **Аварийный выход** — bounded retry, fallback и честный отказ без обхода privacy boundary.
4. **Диспетчерская** — observability от входного запроса до фактического участника пула.

Gateway обслуживает два связанных, но разных контура:

- **orchestration plane** решает, кому поручить работу, выдаёт делегату brief и
  принимает типизированный исход (`done`, `missing_evidence`, `run_failed`,
  `needs_user_input`, `not_verified`);
- **inference plane** gateway принимает запрос делегата, выбирает capability-полку,
  применяет policy/retry/fallback и оставляет route event.

Gateway не подменяет оркестратор: он не назначает задачи и не принимает `done` со
слов модели. Делегат — такой же consumer gateway, но с собственной идентичностью,
operation и `request_id`.

## 1. Сначала — паспорт лаборатории и границы доверия

До установки чего-либо собери инвентарь. Не угадывай состояние узлов по README.

Зафиксируй:

- узлы, hostname, роль, ОС, GPU/CPU/RAM, локальность данных и доступность сети;
- где живут gateway, workers, observability и secret store;
- какие узлы могут ходить наружу, а какие должны быть egress-denied;
- кто владеет каждым узлом и кто имеет право на restart/deploy;
- текущие порты, systemd/launchd/containers и health endpoints;
- версии runtime, gateway, моделей и конфигов;
- baseline: latency, concurrency, queue depth, error rate, стоимость/энергия.

Результат — машинно-читаемый ledger без ключей:

```yaml
lab: my-lab
gateway:
  endpoint: https://gateway.example/v1
  owner: team-inference
  config_revision: git-sha
nodes:
  - name: control-plane
    role: gateway
    egress: restricted
  - name: inference-floor
    role: worker
    models: [local-fast]
    egress: denied
observability:
  traces: otel-collector
  metrics: prometheus
  logs: loki
trust_boundaries:
  private_pool: no_external_egress
```

Развёртывание описано через роли `control-plane`, `inference-floor`, `edge-worker`,
`observability` и `workstation`; конкретная топология и адреса определяются в inventory
окружения.

Проверки должны иметь честный статус `pass`, `fail` или `not_checked`. Не превращай
недоступный журнал в зелёный health.

## 2. Спроектируй контракт до конфигурации

### 2.1 Потребитель видит только это

- один HTTPS base URL;
- отдельный consumer token с минимальными правами;
- capability alias (`fast`, `reasoning`, `tools`, `private`);
- согласованные timeout/deadline и заголовок correlation ID.

Потребитель не получает провайдерские ключи, реальные имена моделей, внутренние
адреса workers или возможность выбрать произвольный backend.

Для агентских клиентов это означает один OpenAI-совместимый endpoint по tailnet.
Профиль выбирает pool alias: например, обычный Codex может идти через `codex-pool`,
а суверенный режим — через `codex-floor`. Если клиент говорит Responses API, gateway
может использовать совместимый Responses→chat bridge; bridge обязан удалять
неподдерживаемые поля и приводить tool schema к форме, которую принимает backend.

### 2.2 Полка обещает проверяемое поведение

| Полка | Обещание | Минимальная проверка |
|---|---|---|
| `fast` | быстрый непустой ответ | content не пуст, deadline соблюдён |
| `reasoning` | корректный результат сложной задачи | fixture/assertion, не только HTTP 200 |
| `tools` | валидный вызов инструмента | нужное имя и schema в `tool_calls` |
| `private` | данные не покидают доверенную границу | egress guard + synthetic marker |

Не смешивай capability-пулы: `fast-pool` — текстовая рабочая лошадка и не
tools-safe; `tools-pool` принимает только проверенных function-calling участников.
Embeddings, STT и vision должны иметь отдельные маршруты и свои probes, а не
проходить через обычный chat pool.

Пул нельзя называть «healthy» только потому, что в нём перечислены два участника.
Проверь, что они не делят одну скрытую квоту или один failure domain.

### 2.3 Матрица отказов

До запуска составь таблицу:

| Событие | Retry | Fallback | Наружу можно? |
|---|---:|---|---|
| connect timeout | bounded | следующий участник той же полки | только по policy |
| `429`/quota | bounded | участник другой квоты той же полки | только по policy |
| `401/403` | нет | fail | нет |
| schema/contract mismatch | нет | fail + alert | нет |
| private backend down | bounded локально | честный отказ | никогда молча |

Правило: приватность и policy deny важнее availability. Невидимая подмена хуже
явного отказа.

## 3. Собери gateway как один управляемый artefact

Конфигурация gateway, pool registry, policy и dashboard queries должны жить в git
с ревизией. Секреты — только в runtime secret store или env-файле узла, не в git,
argv, URL, Docker image и логах.

Минимальная структура:

```text
gateway/
  config/                  # pools, routes, policies — без секретов
  contracts/               # capability probes и response assertions
  deploy/                  # systemd/container/worker manifests
  observability/           # dashboards, alerts, recording rules
  smoke/                   # bounded authenticated probes
  docs/                    # runbook и rollback
```

Каждый pool member должен иметь:

- уникальный идентификатор и owner;
- health и readiness, проверяющие рабочий путь;
- timeout и concurrency limit;
- quota/failure-domain labels;
- явную privacy/egress policy;
- версию модели и config revision.

Суверенная топология состоит из обезличенных ролей: постоянно включённый
`control-plane` публикует gateway по tailnet, а локальный `inference-floor` является
терминальным fallback. Рабочая станция — только клиент/место разработки. Для
`private`-пула fallback наружу запрещён; для public-пула может существовать отдельная
политика данных.

Никогда не подставляй сырые provider model names в приложение. Mapping «capability
→ участники» остаётся внутри gateway.

## 4. Безопасность и секреты

1. Сгенерируй отдельные consumer credentials; не раздавай master/provider keys.
2. Ограничь scope, rate и срок жизни токена.
3. Ротация должна быть без остановки всех потребителей.
4. Проверь, что токен не появляется в exception, access log, trace baggage или URL.
5. Для `private` определи egress-denied маршрут на уровне сети, а не только в коде.
6. Добавь audit event для выдачи, ротации и отзыва consumer credential.

Если проверка секрета или policy недоступна, необратимая операция не запускается.

## 5. Observability: подключать с самого первого запроса

### 5.1 Сквозная корреляция

Gateway принимает или создаёт `X-Request-ID` и протаскивает его через все attempts.
Связывай:

```text
consumer span → gateway ingress span → route/attempt span → backend span
```

Минимальные безопасные поля route event:

```json
{
  "event": "llm.route",
  "request_id": "req-…",
  "consumer": "billing-worker",
  "operation": "summarize_invoice",
  "pool": "fast",
  "member": "member-a",
  "attempt": 1,
  "status": 200,
  "finish_reason": "stop",
  "duration_ms": 842,
  "fallback_used": false,
  "privacy_class": "internal",
  "config_revision": "git-sha"
}
```

Не логируй полный prompt/response, Authorization, cookies, персональные данные или
скрытые reasoning-токены. Для отладки используй redacted fixture, hash и TTL.

### 5.2 Метрики gateway

- `gateway_requests_total{consumer,pool,outcome}`;
- `gateway_request_duration_seconds{pool,member}`;
- `gateway_attempts_total{pool,error_class}`;
- `gateway_fallback_total{pool,reason}`;
- `gateway_contract_failures_total{pool,contract}`;
- `gateway_inflight_requests{pool}`;
- `gateway_queue_depth{pool,member}`;
- `gateway_quota_remaining{pool,domain}`;
- `gateway_stream_idle_timeouts_total{pool}`;
- `gateway_egress_denials_total{pool}`.

### 5.3 Алерты и дашборды

Минимальные панели: входной трафик, p50/p95/p99 latency, saturation, retries,
fallbacks, contract failures, quota, egress violations и «not checked» probes.

Алерты должны различать:

- gateway жив, но capability contract сломан;
- pool жив, но все участники в одной квоте;
- backend healthy, но consumer auth/policy не проходит;
- telemetry отсутствует (это отдельный красный сигнал, не зелёный).

## 6. Аудит перед первым production rollout

### Конфигурация

- [ ] Все pools и members имеют owner, revision и failure domain.
- [ ] Нет provider keys/model names в consumer config.
- [ ] Retry ограничен общим deadline; stream имеет idle timeout.
- [ ] Fallback для каждой privacy class явен.
- [ ] Rate/concurrency limits заданы на consumer и pool.

### Сеть и секреты

- [ ] Gateway доступен только по HTTPS и нужным сетевым ACL.
- [ ] Private workers не имеют несанкционированного egress.
- [ ] Consumer credentials scoped, rotatable и не попадают в логи.
- [ ] Backup и rollback config проверены, но секреты не копируются в git.

### Поведение

- [ ] Authenticated health пробует рабочий endpoint.
- [ ] Contract probes прошли по каждой полке.
- [ ] `finish_reason=length`, schema mismatch и tool-call errors не теряются.
- [ ] Not-found model, collapsed pool и quota exhaustion видны как разные классы.

### Observability

- [ ] Один `request_id` виден на ingress, route и backend.
- [ ] Dashboards и alerts проверены synthetic traffic.
- [ ] Есть сигнал «telemetry unavailable».
- [ ] Логи редактируют payload до записи.

## 7. Smoke и эксплуатация

Токен не передавай в argv; пример использует runtime environment:

```powershell
$ErrorActionPreference = 'Stop'
$headers = @{
  Authorization = "Bearer $env:GATEWAY_TOKEN"
  "X-Request-ID" = "gateway-smoke-$(Get-Date -Format yyyyMMddHHmmss)"
}
$body = @{
  model = "fast"
  messages = @(@{ role = "user"; content = "Ответь одним словом: ready" })
  max_tokens = 8
} | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method Post -Uri "$env:GATEWAY_BASE_URL/chat/completions" `
  -Headers $headers -ContentType 'application/json' -Body $body
```

Адаптируй `model` или header полки к своему gateway contract. Smoke должен быть
детерминированным, дешёвым и bounded; не запускай бесконечный retry.

Для каждого deploy сохраняй config revision и результаты probes. Перезапуск делай
по PID/юниту своего gateway, не по имени общего процесса. Не гаси соседние jobs.

## 8. Rollout и rollback

1. Прогнать audit в staging и записать baseline.
2. Подключить один consumer token и одну полку.
3. Проверить route events и dashboards по synthetic traffic.
4. Включить production traffic через feature flag или allow-list.
5. Наблюдать latency, errors, retries, fallback, cost, quota и contract failures.
6. Расширять охват только после окна наблюдения и подтверждения владельца.

Rollback — переключатель маршрута на последнюю известную рабочую revision:

- остановить rollout/выключить allow-list;
- вернуть config revision, не удаляя audit events;
- отозвать скомпрометированный token;
- повторить authenticated health и contract probes;
- проверить, что private traffic не попал в внешний fallback;
- записать incident и root cause.

## 9. Уроки, которые нельзя потерять

- Две модели у одного провайдера — не резервирование.
- HTTP 200 — не доказательство правильного ответа.
- Health без рабочего ключа — только liveness.
- Fallback без privacy policy — потенциальная утечка.
- Пул без telemetry — чёрный ящик.
- Retry без deadline — зависшие jobs и скрытая стоимость.
- Отсутствующий журнал должен выглядеть как `not_checked`, а не как `healthy`.
- Capability contract принадлежит оператору gateway и тестируется независимо от бренда модели.

## 10. Что агент возвращает владельцу после handoff

1. Архитектурный ledger узлов, pools, owners и trust boundaries.
2. Git revision gateway config и список deploy artefacts.
3. Таблицу capability contracts и матрицу отказов.
4. Результаты authenticated health/contract probes с `request_id` и latency.
5. Ссылки на dashboards/alerts без секретных параметров.
6. Проверенный rollback path и ответственного on-call.
7. Явный список того, что осталось `not_checked`.

**Definition of done:** потребители знают одну дверь; оператор знает каждый маршрут;
приватный pool не имеет молчаливого egress; любой отказ классифицируется; а без
наблюдаемости deploy не объявляется успешным.
