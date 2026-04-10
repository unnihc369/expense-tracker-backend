# Expense Tracker API — cURL examples

**Production host:** [https://finvoicepro-back.vercel.app](https://finvoicepro-back.vercel.app)

Set a shell variable for convenience:

```bash
export API="https://finvoicepro-back.vercel.app"
```

Most JSON endpoints expect `Content-Type: application/json`.

**Authentication:** After login or refresh, send the access token on protected routes:

```bash
-H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Replace `YOUR_ACCESS_TOKEN`, `YOUR_REFRESH_TOKEN`, MongoDB ids (`TRANSACTION_ID`, `ACCOUNT_ID`, etc.), and emails with real values.

---

## Public / health

### Root (not under `/api`)

```bash
curl -sS "$API/"
```

### Ping

```bash
curl -sS "$API/api/ping"
```

### Database check

```bash
curl -sS "$API/api/db-check"
```

### Send test email (requires server mail config)

```bash
curl -sS -X POST "$API/api/mail-test" \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com"}'
```

---

## Auth (`/api/auth`)

### Register

```bash
curl -sS -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"secret12"}'
```

### Verify email (link from email, or open in browser)

```bash
curl -sS "$API/api/auth/verify/VERIFICATION_TOKEN_FROM_EMAIL"
```

### Login

```bash
curl -sS -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"secret12"}'
```

### Refresh (rotate refresh token; returns new access + refresh)

```bash
curl -sS -X POST "$API/api/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

### Logout (invalidates refresh token on server)

```bash
curl -sS -X POST "$API/api/auth/logout" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Categories (`/api/categories`) — Bearer required

### Create category

`type` must be `income` or `expense`.

```bash
curl -sS -X POST "$API/api/categories" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Groceries","type":"expense"}'
```

### List categories

```bash
curl -sS "$API/api/categories" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update category

```bash
curl -sS -X PUT "$API/api/categories/CATEGORY_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Food","type":"expense"}'
```

### Delete category

```bash
curl -sS -X DELETE "$API/api/categories/CATEGORY_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Transactions (`/api/transactions`) — Bearer required

### Create expense (bank account)

```bash
curl -sS -X POST "$API/api/transactions" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type":"expense",
    "amount": 25.50,
    "accountId":"BANK_ACCOUNT_ID",
    "category":"dining",
    "merchant":"Cafe",
    "note":"",
    "date":"2026-04-10T12:00:00.000Z",
    "isCreditCard": false
  }'
```

### Create income (bank account)

```bash
curl -sS -X POST "$API/api/transactions" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type":"income",
    "amount": 1000,
    "accountId":"BANK_ACCOUNT_ID",
    "category":"salary",
    "merchant":"Employer",
    "isCreditCard": false
  }'
```

### Create expense on credit card (`isCreditCard: true`, `accountId` = card id)

```bash
curl -sS -X POST "$API/api/transactions" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type":"expense",
    "amount": 80,
    "accountId":"CREDIT_CARD_ID",
    "category":"shopping",
    "merchant":"Store",
    "isCreditCard": true
  }'
```

### Credit card payment from bank (`type: cc_payment`)

```bash
curl -sS -X POST "$API/api/transactions" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type":"cc_payment",
    "amount": 200,
    "accountId":"BANK_ACCOUNT_ID",
    "creditCardId":"CREDIT_CARD_ID"
  }'
```

Alternative field names accepted: `bankAccountId` instead of `accountId`; `description` instead of `merchant`; `categoryId` (Mongo id) to resolve category name.

### List my transactions

```bash
curl -sS "$API/api/transactions" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### List transactions by user email (still requires your Bearer token)

```bash
curl -sS "$API/api/transactions/user/other.user@example.com" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update transaction (metadata only: category, merchant, note, date)

```bash
curl -sS -X PUT "$API/api/transactions/TRANSACTION_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"merchant":"Updated merchant","note":"note"}'
```

### Delete transaction

```bash
curl -sS -X DELETE "$API/api/transactions/TRANSACTION_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Bank accounts (`/api/accounts` or `/api/bank-accounts`) — Bearer required

Both paths mount the same router. Responses include legacy fields `currentAmount` / `initialAmount` mapped from `balance`.

### Create account

```bash
curl -sS -X POST "$API/api/accounts" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Main checking","type":"checking","balance":500,"color":"#1D9E75"}'
```

```bash
curl -sS -X POST "$API/api/bank-accounts" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Savings","type":"savings","initialAmount":1000}'
```

### List accounts

```bash
curl -sS "$API/api/accounts" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get account by id

```bash
curl -sS "$API/api/accounts/ACCOUNT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update account

```bash
curl -sS -X PUT "$API/api/accounts/ACCOUNT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Renamed","balance":450,"color":"#2ecc71"}'
```

### Delete account

```bash
curl -sS -X DELETE "$API/api/accounts/ACCOUNT_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Credit cards (`/api/credit-cards`) — Bearer required

### Create card

```bash
curl -sS -X POST "$API/api/credit-cards" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Visa",
    "limit":5000,
    "outstanding":1200,
    "dueDate":15,
    "color":"#D4537E"
  }'
```

### List cards

```bash
curl -sS "$API/api/credit-cards" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get card by id

```bash
curl -sS "$API/api/credit-cards/CARD_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update card

```bash
curl -sS -X PUT "$API/api/credit-cards/CARD_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"outstanding":800,"dueDate":20}'
```

### Delete card

```bash
curl -sS -X DELETE "$API/api/credit-cards/CARD_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Budgets (`/api/budgets`) — Bearer required

### Get budget for month (optional `month=YYYY-MM`, default: current month)

```bash
curl -sS "$API/api/budgets?month=2026-04" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### List budget months (recent)

```bash
curl -sS "$API/api/budgets/months" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create or replace budget (POST or PUT)

```bash
curl -sS -X PUT "$API/api/budgets" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "month":"2026-04",
    "categories":{
      "Groceries":400,
      "Dining":150
    }
  }'
```

```bash
curl -sS -X POST "$API/api/budgets" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"month":"2026-04","categories":{"Rent":1200}}'
```

---

## Loans (`/api/loans`) — Bearer required

`direction` must be `lent` or `borrowed`.

### Create loan

```bash
curl -sS -X POST "$API/api/loans" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Car loan",
    "direction":"borrowed",
    "amount":10000,
    "remaining":8500,
    "accountId":"ACCOUNT_ID",
    "status":"active",
    "note":"",
    "date":"2026-01-01T00:00:00.000Z"
  }'
```

### List loans

```bash
curl -sS "$API/api/loans" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get loan by id

```bash
curl -sS "$API/api/loans/LOAN_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Record payment (reduces `remaining`)

```bash
curl -sS -X POST "$API/api/loans/LOAN_ID/payment" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount":250}'
```

### Update loan

```bash
curl -sS -X PUT "$API/api/loans/LOAN_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note":"Updated note","remaining":8000}'
```

### Delete loan

```bash
curl -sS -X DELETE "$API/api/loans/LOAN_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Dashboard (`/api/dashboard`) — Bearer required

### Summary for a month (`month=YYYY-MM`, default: current month)

```bash
curl -sS "$API/api/dashboard/summary?month=2026-04" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Expense trends (optional `months`, default 6)

```bash
curl -sS "$API/api/dashboard/trends?months=6" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Category breakdown for a month

```bash
curl -sS "$API/api/dashboard/category-breakdown?month=2026-04" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Quick copy-paste flow

```bash
export API="https://finvoicepro-back.vercel.app"

# 1) Register + verify email (or use existing user)
curl -sS -X POST "$API/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo","email":"demo@example.com","password":"secret12"}'

# 2) Login — copy accessToken from JSON
curl -sS -X POST "$API/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"secret12"}'

export TOKEN="paste_access_token_here"

curl -sS "$API/api/accounts" -H "Authorization: Bearer $TOKEN"
```
