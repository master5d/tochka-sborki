# Handoff: подключение потребителя к gateway с пулами

> Документ для агента или инженера, который подключает новое приложение к чужому
> gateway. Читай сверху вниз. Это не рецепт «поставить прокси», а проверяемый
> контракт между потребителем, шлюзом и его операторами.

**Статус:** шаблон для адаптации под конкретный gateway  
**Источник модели:** пост «Одна дверь в машинный зал…» и эксплуатационные правила SOVERN  
**Пост:** https://mamaev.coach/blog/odna-dver-v-mashinnyy-zal-kak-ya-perestal-razdavat-ai-klyuchi-kazhdomu-prilozhen/  
**Аудитория:** агент, SRE или разработчик, принимающий приложение на стороне потребителя  
**Последнее обновление:** 2026-09-18

---

## 0. Короткая ментальная модель

Потребитель не знает провайдерские ключи и не выбирает конкретную модель.

```text
приложение
    │  один endpoint + внутренний ключ + имя полки
    ▼
gateway / дверь
    │  политика, лимиты, retry, fallback, журнал маршрута
    ▼
полка (capability pool)
    │  несколько участников, которые обещают одинаковое поведение
    ▼
модель / worker / провайдер
```

У gateway есть четыре обязательных слоя:

1. **Дверь** — единый OpenAI-совместимый вход.
2. **Полки** — capability-алиасы вроде `fast`, `reasoning`, `tools`, `private`, а не бренды моделей.
3. **Аварийный выход** — явный порядок отказа; приватная полка не должна молча утекать в облако.
4. **Диспетчерская** — observability, связывающая запрос потребителя с выбранной полкой,
   фактическим участником, задержкой, расходом и результатом.

Если один из этих слоёв не наблюдаем или не имеет владельца, интеграция не готова.

## 1. Что нужно получить до первой правки

Запроси у владельца gateway только контракт, не секреты провайдеров:

| Артефакт | Что должно быть явно указано |
|---|---|
| Base URL | HTTPS endpoint, например `https://gateway.example/v1` |
| Аутентификация | какой внутренний токен, где он хранится и как ротируется |
| Полки | алиас, обещанное поведение, допустимые типы запросов |
| Формат | поддерживаемые `/chat/completions`, embeddings, responses или tools |
| Таймауты | connect, request, stream-idle и общий deadline |
| Retry | какие ошибки повторяются, максимум попыток, backoff и budget |
| Fallback | следующий участник или честный отказ; правила для private-полок |
| Лимиты | rate/concurrency/token budget на потребителя и на полку |
| Correlation | имя заголовка request/correlation ID и кто его генерирует |
| Observability | endpoint/схема метрик, логов, трасс и retention |
| Сигнал готовности | authenticated health-check и контрактные пробы по полкам |
| Rollback | как отключить приложение или вернуть прежний маршрут без удаления данных |

Не принимай формулировки «там обычный OpenAI API» без таблицы полок и политики
отказа. Совместимость формата не гарантирует совместимость поведения.

## 2. Аудит системы потребителя до подключения

Сначала зафиксируй состояние приложения. Не меняй production вслепую.

### 2.1 Инвентаризация

- Найди все вызовы LLM, включая фоновые jobs, cron, webhooks и тестовые CLI.
- Найди все места, где в конфигурации встречаются `model`, `base_url`, `api_key`,
  provider SDK и прямые URL провайдеров.
- Составь карту потребителей: сервис, владелец, среда, назначение, полка, класс
  приватности, допустимая задержка и цена отказа.
- Отдельно отметь streaming, tool calls, structured output, embeddings и batch.
- Проверь, что секреты не лежат в git, Dockerfile, образе, логе, argv или URL.

Пример безопасного поиска (результат проверяй вручную, секреты не выводи):

```powershell
rg -n --hidden --glob '!node_modules' --glob '!.git' \
  'OPENAI|ANTHROPIC|api[_-]?key|base[_-]?url|chat/completions|responses|embeddings|tool_calls' .
```

### 2.2 Проверка текущего поведения

Для каждого call-site зафиксируй:

- какой контракт ожидается на выходе (непустой текст, JSON schema, tool call);
- что считается retryable (`408`, `429`, временный `5xx`, stream idle);
- что считается окончательным отказом (`401/403`, policy deny, schema mismatch);
- есть ли дедлайн на всю цепочку, а не только на один HTTP-вызов;
- сохраняется ли исходный `request_id` через async-границы;
- как приложение отличает «не проверено» от «здорово».

Красный флаг: зелёный `/health` без авторизованной рабочей пробы. Такой health
проверяет существование двери, но не то, что потребитель может ею воспользоваться.

### 2.3 Результат аудита

Сохрани короткий ledger без секретов:

```yaml
consumer: billing-worker
owner: team-name
environment: staging
calls:
  - operation: summarize_invoice
    pool: fast
    privacy: internal
    contract: non_empty_text
    timeout_ms: 30000
    stream: false
  - operation: extract_actions
    pool: tools
    privacy: internal
    contract: tool_call:extract_actions
    timeout_ms: 60000
    stream: true
direct_provider_calls_remaining: 0
secrets_in_repo: false
rollback_owner: on-call-name
```

## 3. Применение: минимальный consumer adapter

Вынеси gateway-вызов в один адаптер. Остальной код приложения должен знать только
имя операции и полку.

```text
GATEWAY_BASE_URL=https://gateway.example/v1
GATEWAY_TOKEN=<secret from runtime secret store>
GATEWAY_TIMEOUT_MS=30000
GATEWAY_POOL=fast
```

Правила адаптера:

1. URL, токен и таймаут читаются из runtime-конфигурации, не из исходников.
2. Токен передаётся только в `Authorization`, никогда не в query string.
3. Каждый запрос получает стабильный `X-Request-ID` и имя потребителя
   (`X-Consumer` или согласованный эквивалент).
4. Полка передаётся как согласованный alias/header или через серверный mapping;
   не принимай произвольное имя модели от пользовательского ввода.
5. Retry ограничен общим deadline. Не повторяй `401/403`, schema mismatch и policy deny.
6. Для streaming есть idle timeout и проверка финального состояния; «соединение
   не упало» не означает, что ответ завершён.
7. Ошибка адаптера должна сохранять класс ошибки и `request_id`, но не промпт,
   токен или секрет.

Псевдокод поведения:

```text
call(operation, input):
  contract = contracts[operation]
  pool = contract.pool
  deadline = now + contract.timeout
  request_id = stable_or_new_id()

  response = gateway.request(pool, input, request_id, deadline)
  if transport_timeout(response): classify(timeout)
  if auth_or_policy_error(response): fail_without_retry()
  if retryable(response) and budget_left(deadline): retry_with_backoff()
  if not satisfies(response, contract): classify(contract_mismatch)
  emit_consumer_telemetry(response, contract)
  return response
```

## 4. Где подключать observability на другой стороне

Наблюдаемость должна быть на **трёх границах**, иначе невозможно понять, где
сломалось: в потребителе, в gateway или у фактического участника пула.

```text
[consumer span] ──HTTP──> [gateway span] ──route──> [backend/model span]
      │                         │                         │
      └─ app metrics/logs       └─ route metrics/logs     └─ provider/worker metrics
```

### 4.1 На стороне потребителя

Создавай один span на логическую операцию и дочерний span на HTTP-вызов gateway.
Передавай только безопасные атрибуты:

```text
llm.operation        = summarize_invoice
llm.pool             = fast
llm.provider_model   = omit (gateway owns this)
llm.request_id       = <correlation id>
llm.contract         = non_empty_text
llm.privacy_class    = internal|private|public
llm.retry_count      = 0..N
llm.finish_reason    = stop|length|tool_call|error
llm.error_class      = timeout|auth|rate_limit|policy|contract|upstream
```

Метрики потребителя:

- `llm_requests_total{operation,pool,outcome}`;
- `llm_request_duration_seconds{operation,pool}`;
- `llm_retries_total{operation,pool,error_class}`;
- `llm_contract_failures_total{operation,pool,contract}`;
- `llm_inflight_requests{operation,pool}`;
- `llm_stream_idle_timeouts_total{operation,pool}`.

В логи пиши `request_id`, operation, pool, status, duration, retry count и error
class. Не пиши полный prompt/response, Authorization, cookies, персональные данные
или скрытые reasoning-токены. Если нужен разбор контента, используй redacted hash,
sampled fixture или отдельное контролируемое хранилище с TTL.

### 4.2 На стороне gateway

Gateway должен принять тот же `request_id` или вернуть свой с явной связью.
Минимальный route event:

```json
{
  "event": "llm.route",
  "request_id": "req-…",
  "consumer": "billing-worker",
  "pool": "fast",
  "selected_member": "pool-member-id",
  "attempt": 1,
  "status": 200,
  "finish_reason": "stop",
  "duration_ms": 842,
  "fallback_used": false,
  "privacy_class": "internal"
}
```

Данные `selected_member` и расход принадлежат диспетчерской gateway. Потребитель
не должен пытаться угадать фактическую модель из текста ответа.

### 4.3 На стороне backend/worker

Если есть собственные workers, они должны экспортировать health, saturation,
queue depth, latency, errors и quota state. Для приватной полки добавь измеряемый
egress guard: отсутствие исходящего маршрута должно быть проверяемым фактом, а не
обещанием в README.

## 5. Контрактные пробы после подключения

Проверяй не только HTTP-код, а обещание полки. Выполняй пробы из staging и затем
из production с безопасным минимальным payload.

| Полка | Минимальная проба | Успех |
|---|---|---|
| `fast` | короткий deterministic prompt | непустой текст в deadline |
| `reasoning` | задача с проверяемым результатом | корректный ответ, не только `200` |
| `tools` | зарегистрированный test tool | валидный `tool_calls` с нужным именем |
| `private` | synthetic private marker | ответ есть, egress guard не нарушен |

Каждая проба должна записывать `request_id`, latency, pool, outcome и contract
result. Если журнал недоступен, результат — **не проверено**, не зелёный.

Командный smoke-паттерн (токен остаётся в переменной окружения):

```powershell
$ErrorActionPreference = 'Stop'
$headers = @{ Authorization = "Bearer $env:GATEWAY_TOKEN"; "X-Request-ID" = "handoff-smoke-$(Get-Date -Format yyyyMMddHHmmss)" }
$body = @{ model = "fast"; messages = @(@{ role = "user"; content = "Ответь одним словом: ready" }); max_tokens = 8 } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method Post -Uri "$env:GATEWAY_BASE_URL/chat/completions" -Headers $headers -ContentType 'application/json' -Body $body
```

Адаптируй поле `model`/заголовок полки к реальному контракту gateway. Не подставляй
сырые имена провайдеров и не включай этот smoke в бесконечный retry.

## 6. Rollout и rollback

### Rollout

1. Прогнать аудит и сохранить ledger.
2. Создать отдельный consumer credential с минимальными правами.
3. Подключить один staging call-site к одной полке.
4. Пройти контрактные пробы и проверить связность telemetry по `request_id`.
5. Включить feature flag для одного production consumer.
6. Сравнить latency, error class, retry rate, cost и contract failures с baseline.
7. Расширять охват только после окна наблюдения и явного владельца.

### Rollback

Откат должен быть переключателем маршрута, а не удалением конфигурации:

- выключить feature flag или вернуть предыдущий adapter endpoint;
- отозвать consumer credential, если есть подозрение на утечку;
- сохранить `request_id` и route events для расследования;
- не отправлять private payload в fallback, который не был явно одобрен;
- проверить, что старый маршрут действительно работает контрактной пробой.

## 7. Типовые провалы и уроки

- **Два участника выглядят как резервирование, но делят одну квоту.** Смотри на
  реальные failure domains, а не на количество строк в конфиге.
- **Зелёный health-check не открывает рабочим ключом.** Нужна авторизованная probe.
- **HTTP 200 принимается за успех.** Проверяй содержимое согласно capability contract.
- **Fallback спасает доступность ценой приватности.** Privacy boundary важнее красивого SLO.
- **Модель просачивается в код потребителя.** Потребитель выбирает capability, не бренд.
- **Retry без общего deadline.** Очередь и стоимость растут, а пользователь получает timeout.
- **В observability нет consumer/request correlation.** В итоге видны цифры gateway,
  но нельзя доказать, какой вызов породил сбой.
- **Логи содержат prompt или токены.** Редактируй payload до логирования, а не после инцидента.

## 8. Definition of done

- [ ] Все LLM call-sites перечислены; прямых provider calls не осталось.
- [ ] Есть consumer ledger с владельцем, полкой, privacy class и контрактом ответа.
- [ ] Секреты берутся из runtime secret store и не попадают в git/argv/логи.
- [ ] Адаптер задаёт timeout, idle timeout, bounded retry и request correlation.
- [ ] Пройдены authenticated health и capability contract probes.
- [ ] Один `request_id` связывает consumer, gateway и backend telemetry.
- [ ] Дашборды показывают latency, errors, retries, fallback, saturation и contract failures.
- [ ] Private-полка имеет проверяемый egress guard и честный отказ.
- [ ] Зафиксирован rollback owner и проверен обратный маршрут.
- [ ] Первый production rollout ограничен feature flag и имеет окно наблюдения.

## 9. Что агент должен вернуть после handoff

В финальном отчёте не пересказывай весь документ. Верни:

1. изменённые файлы и commit;
2. список подключённых operations → pools;
3. результат каждой contract probe с `request_id` и latency;
4. ссылку на дашборд/логовый запрос без секретов;
5. известные ограничения и оставшиеся direct calls;
6. точную команду или переключатель rollback (без секретных значений).

Если какой-то слой нельзя проверить, пометь его как **не проверено** и останови
расширение rollout до решения владельца. Тихий провал здесь хуже явного отказа.
