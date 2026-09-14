

Day 1 + Day 2 — Authentication Summary
Before: Simple JWT

Originally you had:

signToken()
    ↓
createSendToken()
    ↓
one JWT
    ↓
jwt cookie

So:

signToken() → created one JWT.
createSendToken() → put that JWT in the jwt HttpOnly cookie.
protect() → verified that JWT.

We replaced this simple system with:

Access Token
+
Refresh Token
+
Database Session
1. signAccessToken()

Replaced the old:

signToken()

with:

signAccessToken()

Purpose: Creates the short-lived access token.

User ID
  ↓
signAccessToken()
  ↓
Access Token

Used for:

GET /tasks
POST /tasks
PATCH /tasks
DELETE /tasks
GET /users/me
2. signRefreshToken()

We added:

signRefreshToken()

Purpose: Creates the longer-lived refresh token.

User ID
  ↓
signRefreshToken()
  ↓
Refresh Token

It is not used to access /tasks.

It is used to get a new access token.

3. hashToken()

We added:

hashToken()

using Node's crypto.

Purpose: Converts the raw refresh token into a SHA-256 hash before storing it in MongoDB.

Refresh Token
     ↓
 hashToken()
     ↓
Refresh Token Hash
     ↓
MongoDB Session

So MongoDB doesn't store the raw refresh token.

4. Session Model

We added:

sessionModel.js

Purpose: Keeps track of refresh-token sessions in MongoDB.

Each session contains:

Session
├── user
├── refreshTokenHash
├── expiresAt
└── revoked

This creates the relationship:

User
 ↓
can have
 ↓
Session(s)
5. Updated createSendToken()

Before:

createSendToken()
 ↓
Create ONE JWT
 ↓
Store jwt cookie

Now:

createSendToken()
      ↓
Create Access Token
      ↓
Create Refresh Token
      ↓
Hash Refresh Token
      ↓
Create Session in MongoDB
      ↓
Store accessToken cookie
      ↓
Store refreshToken cookie
      ↓
Send response

We also changed it to:

async

because it now performs a database operation:

Session.create()

Therefore signup/login now use:

await createSendToken(...)
6. Updated protect()

Before:

jwt cookie
 ↓
protect()
 ↓
verify JWT

Now:

accessToken cookie
 ↓
protect()
 ↓
verify Access Token
 ↓
Allow protected API

So protect() cares about the access token, not the refresh token.

7. Added refresh()

We added a new controller:

refresh()

Purpose: Give the user a new access token when the old one expires.

Day 2 version:

Refresh Token
     ↓
Verify JWT
     ↓
Hash Refresh Token
     ↓
Find Session in MongoDB
     ↓
Session exists?
     ↓
revoked = false?
     ↓
not expired?
     ↓
User still exists?
     ↓
Create NEW Access Token

Route:

POST /api/auth/refresh
8. Updated logout()

Before logout:

Clear jwt cookie

Now:

LOGOUT
  ↓
Find Session using refresh token hash
  ↓
revoked = true
  ↓
Clear accessToken cookie
  ↓
Clear refreshToken cookie

This is stronger because logout doesn't just remove browser cookies.

The backend also cancels the session.

Complete Day 1 → Day 2 Architecture
              LOGIN / SIGNUP
                    ↓
            createSendToken()
                    ↓
          ┌─────────┴─────────┐
          ↓                   ↓
 signAccessToken()    signRefreshToken()
          ↓                   ↓
   Access Token         Refresh Token
                              ↓
                         hashToken()
                              ↓
                       Session MongoDB
                    revoked: false


PROTECTED REQUEST
─────────────────

Access Token
     ↓
  protect()
     ↓
JWT valid?
     ↓
GET /tasks ✅


ACCESS TOKEN EXPIRES
────────────────────

Refresh Token
     ↓
  refresh()
     ↓
Verify JWT
     ↓
Check Session
     ↓
Create new Access Token ✅


LOGOUT
──────

Refresh Token
     ↓
Find Session
     ↓
revoked: true
     ↓
Clear both cookies
Functions to memorize
Function	Job
signAccessToken()	Creates access token
signRefreshToken()	Creates refresh token
hashToken()	Hashes refresh token
createSendToken()	Creates tokens, session, cookies
protect()	Verifies access token for protected routes
refresh()	Checks refresh token + session and creates new access token
logout()	Revokes session and clears cookies
Session model	Stores and controls refresh sessions

The most important mental model is:

Access token = access the API.
Refresh token = get another access token.
Session = backend control over the refresh token.

✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅

If interviewer says: “Explain your authentication system”

A strong answer would be:

“When a user logs in, I verify their credentials. Then I create a short-lived access token and a longer-lived refresh token. The access token is used by authentication middleware to access protected routes. I hash the refresh token and store the hash in a Session document associated with the user. The raw refresh token stays in an HttpOnly cookie. When the access token expires, the refresh endpoint verifies the refresh token and checks that its database session exists, is not revoked, and is not expired. If everything is valid, it issues a new access token. On logout, I revoke the session and clear the cookies.”

That answer already demonstrates that you understand the architecture.

If they go deeper, think in this order
LOGIN
  ↓
Why signAccessToken()?
→ Need short-lived credential for protected APIs.

Why signRefreshToken()?
→ Need longer-lived credential to obtain another access token.

Why hashToken()?
→ Don't store the raw refresh credential in MongoDB.

Why Session.create()?
→ Backend needs a record/control of valid refresh sessions.

Why user field in Session?
→ Connect the session to its owner.

Why expiresAt?
→ Session shouldn't live forever.

Why revoked?
→ Backend can cancel a session.

Why HttpOnly?
→ Browser JavaScript cannot directly read the token cookie.

Why protect()?
→ Protected routes need to verify authentication.

Why refresh()?
→ Access token expired, but valid session can issue another.

Why logout() changes revoked to true?
→ Clearing the browser cookie alone doesn't invalidate the server-side session.
If they show you a line of code

Don't panic about syntax. Ask yourself three questions:

1. WHAT does this line do?
2. WHY do we need it?
3. WHAT happens next?

For example:

const refreshTokenHash = hashToken(refreshToken);

You explain:

“This hashes the raw refresh token. We don't want to store the raw token in the database. Next, I can use this hash to find the corresponding Session.”

Then:

const session = await Session.findOne(...)

You explain:

“Now I'm checking whether this refresh token corresponds to an active session in MongoDB. If the session doesn't exist or was revoked, I reject the refresh request.”

That's much more important than memorizing punctuation.

The relationships you should understand
User
 │
 ├── Tasks
 │     └── user/owner → User._id
 │
 └── Sessions
       └── user → User._id

One user can have many tasks.

One user can also have many sessions:

Adam
├── Chrome session
├── iPhone session
└── Work laptop session

That relationship is why later you can implement things like logout one device or logout all devices.

And you're not finished yet

Day 1–2 gives you the foundation:

DAY 1
Access Token
Refresh Token
Expiration
Refresh endpoint
Cookies
protect()

        ↓

DAY 2
Session model
Refresh-token hashing
Session creation
Session validation
Session revocation on logout

        ↓

DAY 3
Refresh-token rotation
Revocation
Proper token lifecycle

        ↓

DAY 4
Complete/secure flow
+ whatever remaining security cases are in your plan

So I wouldn't try to memorize the entire controller right now. Finish Day 3 and Day 4 first. Then do one dedicated interview exercise where you start at /login and explain every function in sequence: what it receives → what it does → why → what happens next.

Once you can draw and explain this from memory:

Login
 ↓
Access + Refresh
 ↓
Session
 ↓
Protected API
 ↓
Access expires
 ↓
Refresh
 ↓
Session check
 ↓
New Access
 ↓
Logout
 ↓
Revoke Session

you'll be in a much better position for detailed junior authentication questions than someone who merely memorized the code.


Day 2 — Concepts I Now Know
Refresh endpoint — /auth/refresh uses the refresh token to create a new access token.
Session storage — the refresh token is hashed and connected to a MongoDB session.
Revocation — revoked: true means the backend deliberately disables that refresh session.
Proper logout — logout revokes the refresh session and clears the accessToken and refreshToken cookies.
Access-token logout limitation — revoking the refresh session prevents it from creating future access tokens, but an access token that was already issued may remain valid until its short expiration time.

Your Day 2 material explicitly shows revoked: false becoming revoked: true after logout and explains that the session has been cancelled.

✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
Day 3 rotation

before move to rotation learn token words used in code :
riable names and overall architecture otherwise stay exactly the same.

The 8 token words I want you to know
sign = create a JWT.
verify = check a JWT.
decoded = information taken out of a valid JWT.
hash = one-way transformed version of the refresh token.
session = database record controlling the refresh token.
revoked = session disabled or not.
rotation = replace Refresh A with Refresh B.
cookie = where the client stores/sends the token.

If these 8 words are clear, the large controller becomes much easier to read.
// // ==========
Here is the short + detailed + easy version.

Your refresh code is basically doing only 4 things:

GET TOKEN
↓
CHECK TOKEN
↓
CREATE NEW TOKENS
↓
SAVE + SEND
1. Get refresh token
const refreshToken = req.cookies.refreshToken;

Human meaning:

Get the refresh token from the cookie.

Think:

Cookie → Refresh A

If it does not exist:

if (!refreshToken)

Human meaning:

No refresh token? Stop and return 401.

2. Check Refresh A
const decoded = jwt.verify(
  refreshToken,
  process.env.REFRESH_TOKEN_SECRET
);

Human meaning:

Check if Refresh A is valid, signed by my backend, and not expired.

decoded.id means:

Get the user ID stored inside the token.

Then:

const refreshTokenHash = hashToken(refreshToken);

Human meaning:

Convert Refresh A into hash(A).

Why?

Because MongoDB stores the hash, not the raw refresh token.

Then:

const session = await Session.findOne({
  refreshTokenHash,
  revoked: false,
});

Human meaning:

Find a session with hash(A) and make sure it is still active.

So:

Refresh A
↓
hash(A)
↓
MongoDB
↓
Session found?
↓
revoked = false?

Then:

if (session.expiresAt < new Date())

Human meaning:

Make sure the database session is not expired.

3. Create new tokens

Day 2 already had:

const newAccessToken = signAccessToken(user._id);

Human meaning:

Create a new short-lived access token.

Think:

Access B

Day 3 adds:

const newRefreshToken = signRefreshToken(user._id);

Human meaning:

Create a new refresh token.

Think:

Refresh B

Then:

const newRefreshTokenHash =
  hashToken(newRefreshToken);

Human meaning:

Convert Refresh B into hash(B).

4. Replace A with B

This is the most important Day 3 line:

session.refreshTokenHash =
  newRefreshTokenHash;

Human meaning:

Replace hash(A) in MongoDB with hash(B).

Before:

MongoDB = hash(A)

After:

MongoDB = hash(B)

Therefore:

Refresh A ❌
Refresh B ✅

That is rotation.

Then:

session.expiresAt =
  new Date(Date.now() + 5 * 60 * 1000);

Human meaning:

Give the new refresh session another 5 minutes.

Then:

await session.save();

Human meaning:

Save the new hash(B) and expiration into MongoDB.

5. Send new tokens
res.cookie("accessToken", newAccessToken, ...)

Human meaning:

Give the client Access B.

Then:

res.cookie("refreshToken", newRefreshToken, ...)

Human meaning:

Replace Refresh A cookie with Refresh B.

Now everything matches:

Client:
Refresh B

MongoDB:
hash(B)

So the full human-language flow is:

Get Refresh A
↓
Verify A
↓
Hash A
↓
Find A's active session
↓
Create Access B
↓
Create Refresh B
↓
Hash B
↓
Replace hash(A) with hash(B)
↓
Save
↓
Send Access B
↓
Send Refresh B

The one sentence to memorize is:

Refresh A comes in, I check it, create Refresh B, store hash(B), and send B back.

And the key Day 3 idea is:

A → B

A ❌
B ✅

That is refresh-token rotation.

// // ======
blueprint
REFRESH TOKEN ROTATION

1. Get A
2. Verify A
3. Hash A
4. Find session
5. Create Access B
6. Create Refresh B
7. Hash B
8. Replace hash
9. Save
10. Send B

✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅

# Day 4 — Browser + Frontend Authentication

## Goal

Day 4 connects your backend authentication to your frontend.

Main flow:

Frontend calls /tasks
↓
Access token valid?
↓
YES → 200 ✅

NO → 401
↓
apiFetch calls /auth/refresh
↓
Backend creates new tokens
↓
apiFetch retries /tasks
↓
200 ✅

That is the main thing to understand.

---

## 1. HttpOnly

httpOnly: true

Means:

JavaScript cannot directly read the token ❌

Browser can still send the token ✅

Backend can read the token ✅

Easy memory:


HttpOnly = JS cannot read cookie


---

## 2. Secure


secure: process.env.NODE_ENV === "production"


Means:


Development
http://localhost
↓
secure = false

Production
https://myapp.com
↓
secure = true


Easy memory:


Secure = HTTPS only


Do not force:


secure: true


on normal localhost HTTP because the browser may refuse to send the cookie.

---

## 3. SameSite


sameSite: "lax"


Controls when the browser can send cookies across sites.

Simple idea:


strict
↓
very restrictive

lax
↓
balanced / normal choice

none
↓
allows cross-site cookies


For your project:


sameSite: "lax"


Easy memory:


SameSite = controls cross-site cookie sending


---

## 4. Your Cookie Settings

Your cookies should now look like:


res.cookie("accessToken", newAccessToken, {
  maxAge: 30 * 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
});

res.cookie("refreshToken", newRefreshToken, {
  maxAge: 5 * 60 * 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
});


Remember:


HttpOnly
↓
JS cannot read

Secure
↓
HTTPS in production

SameSite
↓
controls cross-site cookies


---

## 5. CORS + credentials

Frontend:


credentials: "include"


Backend:


cors({
  origin: "http://localhost:3001",
  credentials: true,
});


Think:


FRONTEND
credentials: "include"

        ↕

BACKEND
credentials: true


Meaning:


Browser is allowed to send cookies
between your frontend and backend.

---

# 6. apiFetch Before Day 4

Before automatic refresh:

apiFetch("/tasks")
↓
GET /tasks
↓
Access expired
↓
401
↓
throw error ❌


We want to improve that.

---

# 7. Automatic Refresh

Your `apiFetch()` now does:


apiFetch("/tasks")
↓
GET /tasks
↓
401
↓
POST /auth/refresh
↓
new Access + Refresh tokens
↓
retry GET /tasks
↓
200 ✅


Important code:

if (
  response.status === 401 &&
  retry &&
  endpoint !== "/auth/refresh"
) {
  // call /auth/refresh
}

Human meaning:


Did request fail with 401?
↓
YES

Are we allowed to refresh?
↓
YES

Is this NOT already /auth/refresh?
↓
YES

Try refresh


Then:


if (refreshResponse.ok) {
  // repeat original request
}


Meaning:

t
Refresh worked
↓
try /tasks again


# 8. Why `retry` Exists


retry = true


Means:


This request is allowed
to try refresh.

We don't want:


401
↓
refresh
↓
401
↓
refresh
↓
401
↓
refresh forever ❌


We want:


Original request
↓
401
↓
try refresh once
↓
if it fails
↓
STOP


Easy memory:


retry = permission to try refresh



# 9. Why apiFetch Handles It

Your components should stay simple.

Dashboard:


apiFetch("/tasks");


Not:


Dashboard
↓
check token
↓
refresh
↓
retry

Profile
↓
check token
↓
refresh
↓
retry

Tasks
↓
check token
↓
refresh
↓
retry


Instead:


Dashboard ─┐
Tasks ─────┤
Profile ───┤
           ↓
        apiFetch
           ↓
 authentication logic


Easy memory:


Components ask for data.

apiFetch handles authentication problems.




# 10. Test Day 4

Run:


Terminal 1
Backend
npm run dev



Terminal 2
Frontend
npm run dev


Then:


Login
↓
Dashboard
↓
tasks load ✅
↓
wait 30+ seconds
↓
load tasks again


Behind the scenes:


/tasks
↓
401

/auth/refresh
↓
200

/tasks
↓
200


You should stay logged in.

That proves automatic refresh works.

----

# 11. Browser DevTools

Open:


F12
↓
Application / Storage
↓
Cookies

Check:

accessToken
refreshToken

HttpOnly
Secure
SameSite
Expires


Then:

F12
↓
Network


After access token expires, you want to see:

/tasks          401
/auth/refresh   200
/tasks          200


Perfect result ✅

---

# Day 4 — What You Must Remember

Only memorize these ideas:


HttpOnly
=
JavaScript cannot read token


Secure
=
HTTPS only


SameSite
=
controls cross-site cookies


credentials: "include"
=
browser sends cookies


401
=
access token failed/expired


/auth/refresh
=
get new tokens


retry
=
try original request again

And the most important flow:


GET /tasks
↓
401
↓
apiFetch
↓
POST /auth/refresh
↓
Access B + Refresh B
↓
retry GET /tasks
↓
200 ✅


That is Day 4.

✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
DAY 5 — FINAL AUTH REVIEW

Login
↓
Access Token + Refresh Token
↓
Access Token protects /tasks
↓
Access expires
↓
401
↓
Frontend apiFetch calls /auth/refresh
↓
Backend checks refresh token + Session
↓
Rotate Refresh A → Refresh B
↓
Create new Access Token
↓
Retry /tasks
↓
200 ✅
↓
Logout
↓
Revoke Session
↓
Clear cookies


And remember only these file jobs:
authController
→ login / refresh / logout

authMiddleware
→ verify access token

Session model
→ control refresh token

apiFetch
→ handle 401 + refresh + retry

task routes
→ use protect()

✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅

# DAY 6 — PRODUCTION SECURITY PART 1

## Goal

Day 6 protects the **entrance of the backend API**.

We added:

Helmet

↓

CORS

↓

Rate Limiting

↓

Request Size Limit

---

# 1. Helmet

Code:

js
app.use(helmet());


Purpose:

Adds security-related HTTP response headers.

Human meaning:


Request
   ↓
Express
   ↓
Helmet
   ↓
Security headers added
   ↓
Response


Easy memory:


Helmet = security HTTP headers


We tested it in:


F12
↓
Network
↓
Request
↓
Headers
↓
Response Headers


We saw headers such as:


Content-Security-Policy
X-Content-Type-Options
X-Frame-Options
Referrer-Policy


That proved Helmet was working.

---

# 2. CORS

Code:

js
app.use(
  cors({
    origin: [
      "http://localhost:3001",
      "https://task-manager-frontend-xi-kohl.vercel.app",
      "https://task-manager-frontend-ig320sio6-frontenddevs-projects-468f5e6e.vercel.app",
    ],
    credentials: true,
  }),
);


Purpose:

Controls which browser frontends are allowed to communicate with the backend.

Easy memory:


CORS
=
Which frontend origin is allowed?


Important:

js
credentials: true


means the backend allows browser credentials such as cookies.

Frontend:

js
credentials: "include"


Backend:

js
credentials: true


Think:


FRONTEND
credentials: "include"

       ↕

BACKEND
credentials: true


CORS is not authentication.

It controls browser cross-origin access.

---

# 3. General Rate Limiting

Code:

js
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);


Purpose:

Stops one client from sending too many requests in a short period.

Human meaning:


Client sends request
       ↓
Rate limiter
       ↓
More than 100 requests
within 15 minutes?
       ↓
NO → continue ✅
YES → 429 Too Many Requests ❌


Important words:


windowMs
=
how long is the time window?

limit
=
how many requests are allowed?


Our example:


15 minutes
+
100 requests


We tested it in the browser and saw:


RateLimit-Limit: 100
RateLimit-Remaining: ...
RateLimit-Policy: 100;w=900


That proved the limiter was active.

Easy memory:


Rate limiting
=
too many requests → block


---

# 4. Request Size Limit

Before:

js
app.use(express.json());


Now:

js
app.use(express.json({ limit: "10kb" }));


Purpose:

Stops clients from sending unnecessarily huge JSON request bodies.

Human meaning:


JSON request
     ↓
10 KB or smaller?
     ↓
YES → parse + continue ✅
NO → reject ❌


Example normal Task Manager request:

json
{
  "title": "Learn Express"
}


Very small ✅

But someone sending a huge JSON request:


Huge request
   ↓
Request-size limit
   ↓
Reject ❌


Easy memory:


Request-size limit
=
don't accept huge JSON bodies


Important:

We removed the second:

js
app.use(express.json());


because we only need:

js
app.use(express.json({ limit: "10kb" }));


---

# DAY 6 — COMPLETE REQUEST FLOW
After Day 6:

REQUEST
   ↓
Helmet
   ↓
Security headers
   ↓
CORS
   ↓
Allowed frontend origin?
   ↓
General Rate Limiter
   ↓
Too many requests?
   ↓
Request Size Limit
   ↓
JSON too large?
   ↓
cookieParser
   ↓
Routes
   ↓
Authentication
   ↓
Controller
   ↓
MongoDB

---

# Day 6 — What You Must Remember
Only memorize these ideas:

Helmet
=
security HTTP headers

CORS
=
controls which browser frontend
can communicate with the backend

Rate Limiting
=
limits how many requests
a client can send

429
=
Too Many Requests

Request Size Limit
=
reject oversized JSON requests

And recognize these lines:

js
app.use(helmet());
↓
Add security headers

js
app.use(cors(...));
↓
Control allowed frontend origins

js
app.use("/api", apiLimiter);
↓
Rate-limit all /api routes

js
app.use(express.json({ limit: "10kb" }));
↓
Limit JSON request size
---
# One Sentence Summary

Day 6 protects the API entrance by adding security headers,
controlling browser origins, limiting request frequency,
and rejecting oversized JSON requests.

// // =======================================
# Day 7 — Protect User Input + Login

## 1. Validation

**Validation = Is the user's input acceptable?**

Before data reaches the controller/database, check it.


USER INPUT
   ↓
Zod Validation
   ↓
Valid?
   ├── NO → 400 ❌
   └── YES → Controller ✅


In our project we use **Zod**, not `express-validator`.
Examples:

z.string().email()
z.string().min(3)
z.boolean()

Zod schemas protect:

* signup
* login
* create task
* update task

`.strict()` also rejects unexpected fields.
---

## 2. Sanitization
**Sanitization = clean / normalize user input.**
We also do this with **Zod**.
Example:


name: z.string().trim()

email: z
  .string()
  .trim()
  .toLowerCase()
  .email()

Example:

"   Adam   "
     ↓ trim()
"Adam"


"   ADAM@GMAIL.COM   "
        ↓
trim + lowercase
        ↓
"adam@gmail.com"

Do **not** trim passwords because passwords should normally remain exactly as the user entered them.
Easy memory:

Validation   = CHECK data
Sanitization = CLEAN data

---
## 3. NoSQL Injection Protection
MongoDB has special operators such as:

$ne
$gt
$in
$regex

An attacker may try to make their input behave like a MongoDB query.
### Bad ❌
User.findOne(req.body);
This gives too much control to the user.
### Good ✅

User.findOne({
  email: req.body.email,
});

**You control the query structure.**
The user only provides the value.
Also enable this once in `config/database.js`:
mongoose.set("sanitizeFilter", true);
Meaning:
sanitizeFilter
=
extra protection for MongoDB query filters

But it is only an **extra layer**.
Most important rule:

Never blindly pass req.body or req.query
directly into a MongoDB query.

---
## 4. Login Brute-Force Protection
A brute-force attack means repeatedly guessing passwords:

password1 ❌
password2 ❌
password3 ❌
password4 ❌
...

So login gets its own limiter:

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
});

Meaning:

windowMs
→ 15-minute window

limit: 5
→ allow only a small number of failed attempts

skipSuccessfulRequests: true
→ successful login does not remain counted

Login route:

router.post(
  "/login",
  validate(loginSchema),
  loginLimiter,
  login
);

Flow:

POST /login
   ↓
Zod validation + sanitization
   ↓
Valid?
   ├── NO → 400 ❌
   └── YES
          ↓
     loginLimiter
          ↓
Too many attempts?
   ├── YES → 429 ❌
   └── NO
          ↓
       login()

---
# General Limiter vs Login Limiter

GENERAL LIMITER
= Is someone abusing my whole API?

LOGIN LIMITER
= Is someone repeatedly trying to log in?

Both are useful because they have different jobs.
---
# Final Day 7 Flow

REQUEST
   ↓
Helmet
   ↓
CORS
   ↓
General Rate Limiter
   ↓
Request Size Limit
   ↓
Route
   ↓
Zod Validation + Sanitization
   ↓
If /login → Login Limiter
   ↓
Controller / Authentication
   ↓
Safe Explicit MongoDB Query
   ↓
Mongoose sanitizeFilter
   ↓
MongoDB


## What to memorize

VALIDATION
= Is the input acceptable?
SANITIZATION
= Clean / normalize the input
NoSQL INJECTION PROTECTION
= Never give user input control of MongoDB queries
BRUTE-FORCE PROTECTION
= Limit repeated failed login attempts

And recognize:
.trim()
→ remove surrounding spaces
.toLowerCase()
→ normalize  such as email
.strict()
→ reject unexpected fields
mongoose.set("sanitizeFilter", true);
→ extra MongoDB filter protection
skipSuccessfulRequests: true
→ successful login should not stay counted like failed attempts

### Day 7 in one sentence
**Check and clean user input, control what reaches MongoDB, protect MongoDB queries, and stop repeated login attacks.**

// // =================================
day 8 Docker
Docker Day 8 — Easy Step-by-Step Summary

STEP 1 — Install what Docker needs on Windows
Install/check:

WSL 2
Docker Desktop

Then make sure Docker Desktop is running.

Check Docker:
docker --version
docker compose version

Test it:
docker run hello-world

If you see:
Hello from Docker!
Docker is working.

STEP 2 — Go to your Express project
Open the terminal inside your project:
task-manager-api/
Make sure your normal app works first:
npm start

Then stop it:
Ctrl + C

STEP 3 — Create Dockerfile
Beside package.json, create:
Dockerfile

Put:
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "start"]

Easy meaning:

Node
 ↓
App folder
 ↓
Copy package files
 ↓
Install dependencies
 ↓
Copy code
 ↓
Port 3000
 ↓
Start app

Remember:

RUN npm ci
→ happens while building IMAGE

CMD ["npm", "start"]
→ happens when CONTAINER starts
STEP 4 — Create .dockerignore

Create:
.dockerignore
Put:

node_modules
npm-debug.log
.git
.gitignore
coverage
.env

Meaning:
Don't copy these files into the Docker image.

Especially:
node_modules
→ Docker installs its own dependencies

.env
→ Don't put secrets inside the image

STEP 5 — Build the IMAGE
Run:
docker build -t task-manager-api .
Meaning:

Project + Dockerfile
        ↓
docker build
        ↓
IMAGE
task-manager-api

Check images:

docker images

Important:

IMAGE = prepared application
IMAGE = not running yet
STEP 6 — Run the IMAGE as a CONTAINER

Run:
docker run --name task-manager-container --env-file .env -p 3001:3000 task-manager-api

Meaning:

IMAGE
task-manager-api
      ↓
docker run
      ↓
CONTAINER
task-manager-container
      ↓
Express running

For your ports:

Windows 3001
     ↓
Docker 3000
     ↓
Express

So in Postman:

http://localhost:3001

Remember:

-p 3001:3000

HOST : CONTAINER

STEP 7 — Check the container
Running containers:
docker ps

All containers:
docker ps -a

STEP 8 — If there is an error
First:
docker ps -a

Then:
docker logs task-manager-container

Think:
docker ps -a
→ Is my container running or stopped?

docker logs
→ What happened inside my app?

STEP 9 — Stop, start, or delete the container
Stop:
docker stop task-manager-container

Start the same container again:
docker start task-manager-container

Delete the container:
docker rm task-manager-container

Deleting the container does not delete the image.

IMAGE
task-manager-api
still exists
The ONE Docker Flow to Remember
PROJECT
   ↓
Dockerfile
   ↓
docker build
   ↓
IMAGE
   ↓
docker run
   ↓
CONTAINER
   ↓
PORT
   ↓
POSTMAN

Or even shorter:

PROJECT → BUILD → IMAGE → RUN → CONTAINER

Questions to Know Before Day 2
What is Docker?
→ Runs software in isolated containers.

What is an image?
→ Packaged app/template.

What is a container?
→ Running image.

What is Dockerfile?
→ Instructions for building an image.

What does docker build do?
→ Creates an image.

What does docker run do?
→ Creates/starts a container from an image.

What does -p 3001:3000 mean?
→ Windows 3001 → container 3000.

Why .dockerignore?
→ Prevent unnecessary/private files from being copied.

What does docker ps do?
→ Shows running containers.

Container has a problem. First things to check?
→ docker ps / docker ps -a
→ docker logs

For Day 8, this is enough. The most important relationship is:
docker build
→ creates IMAGE

docker run
→ creates/runs CONTAINER from that IMAGE

You do not need to memorize every option such as --env-file or --name before moving to Day 9.

so :
If u write:
docker ps
shows nothing, then run:
docker ps -a

Find your stopped container, for example:
task-manager-container
Then start it:
docker start task-manager-container

Check again:
docker ps

If it is running, check the logs:
docker logs task-manager-container
// =================================
Day 9 continue Docker
Your Day 9 really has only two applications:

1. Your Express API
2. MongoDB

Everything else—image, container, network, port, volume, Compose—is just Docker helping those two applications run and communicate. Your own notes describe Day 9 as running the API and MongoDB together, connecting them through a network, and preserving Mongo data with a volume.
1. Start before Docker

Without Docker, your project is basically:

Postman
   ↓
Express API
   ↓
MongoDB

Your API is your Node/Express program:

server.js
routes
controllers
models
middleware
...

MongoDB is the database.

Those are the actual applications.

Docker did not invent:

API
MongoDB

Docker only gives them environments to run inside.
2. What is an IMAGE?

Think:

    Image = prepared package

An image is not running.

For your API, Docker builds an image containing roughly:

Linux
Node.js
your Express code
node_modules
startup instructions

Your Dockerfile creates that.

Your project
     ↓
Dockerfile
     ↓
docker build
     ↓
API IMAGE

With Compose, you saw an image named something like:

task-manager-api-api

Don't let that long name confuse you.

Just think:

task-manager-api-api
= my Express API image

For MongoDB, you did not create the image yourself.

Docker downloaded:

mongo:8

So now you have two images:

IMAGE #1
task-manager-api-api
= packaged Express API

IMAGE #2
mongo:8
= packaged MongoDB

Your notes use the same mental model: image is the ready application package, and a container is what runs from it.
3. What is a CONTAINER?

This is the most important distinction:

IMAGE
= ready package

CONTAINER
= that package running

Think:

Image          Container

blueprint  →   actual house

or:

class      →   object

So:

API image
task-manager-api-api
        ↓
      RUN
        ↓
API container
task-manager-api-api-1

And:

Mongo image
mongo:8
   ↓
 RUN
   ↓
Mongo container
task-manager-api-mongo-1

The long container names you saw:

task-manager-api-api-1

task-manager-api-mongo-1

are mostly automatically generated by Compose.
For learning, ignore the long names.

Think simply:

API container

Mongo container

That's enough.
4. What is api then?

This is where the names get confusing.

In your compose.yaml:

services:
  api:
    ...

  mongo:
    ...

You chose two service names:

api

mongo

A service is basically:

    The description of one application that Compose should run.

So:

service: api
     ↓
uses your Dockerfile
     ↓
API image
     ↓
API container

And:

service: mongo
     ↓
uses mongo:8 image
     ↓
Mongo container

So don't mix these:

API
= your Express application

api
= its Compose service name

task-manager-api-api
= its Docker image

task-manager-api-api-1
= its running container

They are related, but they are not four different applications.

They are four names describing different layers of your same API.
5. Do the same for Mongo

MongoDB
= database software

mongo
= Compose service name

mongo:8
= Docker image

task-manager-api-mongo-1
= running Mongo container

27017
= MongoDB's port

Again: only one actual database application.

Docker just gives it several labels.
6. Your entire Day 9 in one picture

This is the picture I want you to remember:

YOUR WINDOWS COMPUTER
────────────────────────────────────

Postman
   |
   | localhost:3000
   |
   v

DOCKER
────────────────────────────────────

┌────────────────────────────┐
│ API CONTAINER              │
│                            │
│ Node.js                    │
│ Express                    │
│ Your Task Manager code     │
│                            │
│ listens on port 3000       │
└────────────┬───────────────┘
             |
             | mongo:27017
             |
        DOCKER NETWORK
             |
             v
┌────────────────────────────┐
│ MONGO CONTAINER            │
│                            │
│ MongoDB                    │
│ listens on port 27017      │
└────────────┬───────────────┘
             |
             v
       MONGO VOLUME
             |
             v
      users / tasks / data

That is almost the whole Docker Day 9.
7. Now understand PORT

A port is just a door number.

Your API listens on:

3000

MongoDB listens on:

27017

Imagine two apartments:

API apartment
door 3000

Mongo apartment
door 27017

Postman wants to reach your API:

Postman
   ↓
localhost:3000

Meaning:

    On my Windows computer, go through port 3000.

Your Compose file has:

ports:
  - "3000:3000"

Meaning:

Windows port 3000
       ↓
API container port 3000

That's why Postman works at:

http://localhost:3000

8. Why doesn't Mongo need localhost?

Because the API and Mongo are both already inside Docker.

They communicate through the Docker network.

API container
     ↓
Docker network
     ↓
Mongo container

So your API doesn't say:

localhost:27017 ❌

because inside the API container:

localhost
= myself, the API container

Instead it says:

mongo:27017 ✅

Why mongo?

Because your service is named:

mongo:

So Docker knows:

mongo
= that Mongo service

Your notes identify this exact rule as the main Day 9 networking concept.
9. What is the NETWORK?

Very simple:

    Network = private road between containers.

Without it:

API     Mongo
 ❌
can't communicate

With Docker's network:

API ←────────→ Mongo

Compose automatically created:

task-manager-api_default

You saw it with:

docker network ls

Again, ignore the long name.

Think:

task-manager-api_default
= private network for my API + Mongo

Its job:

API can find Mongo
Mongo can receive requests from API

That's it.
10. What is a VOLUME?

The volume is not another application.

It's just:

    Permanent storage for MongoDB data.

Imagine the Mongo container as a temporary office.

Inside it you create:

User: Adam
Task: Learn Docker

If the office is destroyed, you don't want the paperwork destroyed too.

So Docker keeps the database files somewhere separate:

Mongo container
      ↓
mongo-data volume
      ↓
users
tasks
sessions
database files

This is why your test worked.

You did:

Create task
    ↓
docker compose down
    ↓
old Mongo container removed
    ↓
docker compose up
    ↓
new Mongo container created
    ↓
same volume attached
    ↓
old task still exists ✅

That proves:

Container
= disposable

Volume
= persistent

This is exactly the persistence test described in your lesson.
11. What is Docker Compose?

Now Compose becomes much easier.

Without Compose you would have to manually tell Docker:

Build API image

Run API container

Download Mongo image

Run Mongo container

Create network

Connect API to network

Connect Mongo to network

Create volume

Attach volume to Mongo

Set environment variables

Map API port

That's annoying.

So you write all of that once in:

compose.yaml

Then:

docker compose up

means roughly:

    Docker, read my file and create my whole backend environment.

So:

compose.yaml
      ↓
Docker Compose
      ↓
API container
+
Mongo container
+
Network
+
Volume
+
Ports
+
Environment variables

Your notes summarize this as Compose running multiple containers together.
12. The names that confused you

Here is your exact project translated into plain English:
What you see	What it really means
api	name of your Express service
mongo	name of your Mongo service
task-manager-api-api	API image
mongo:8	Mongo image
task-manager-api-api-1	running API container
task-manager-api-mongo-1	running Mongo container
task-manager-api_default	network joining them
task-manager-api_mongo-data	permanent Mongo data storage
3000	Express API port
27017	MongoDB port
localhost:3000	Windows/Postman → API
mongo:27017	API container → Mongo container

You do not need to memorize the long generated names.

Memorize:

api
mongo
3000
27017
network
volume

13. Image vs container again

This is the one distinction I want completely clear:

IMAGE
= software prepared to run

Examples:

task-manager-api-api
mongo:8

Then:

CONTAINER
= image currently running

Examples:

task-manager-api-api-1
task-manager-api-mongo-1

Think:

mongo:8 IMAGE
      ↓
Docker runs it
      ↓
Mongo CONTAINER
      ↓
MongoDB is running

And:

API IMAGE
    ↓
Docker runs it
    ↓
API CONTAINER
    ↓
Express server is running

14. API is not the same as image/container

This is important.

Your API is your software:

Node.js
Express
routes
controllers
models

Docker image is the package containing that API.

Container is the running package.

So:

YOUR API
   ↓
put into
   ↓
DOCKER IMAGE
   ↓
run as
   ↓
DOCKER CONTAINER

Similarly:

MongoDB software
      ↓
put into
      ↓
mongo:8 image
      ↓
run as
      ↓
Mongo container

15. Day 8 vs Day 9

This may help you connect everything.
Day 8

You learned:

My API
   ↓
Dockerfile
   ↓
Image
   ↓
Container

Only your Express API was Dockerized.

MongoDB was still outside Docker / Atlas.

Postman
   ↓
API container
   ↓
Internet
   ↓
Mongo Atlas

Day 9

Now MongoDB also lives in Docker:

Postman
   ↓
API container
   ↓
Docker Network
   ↓
Mongo container
   ↓
Volume

And Compose manages everything.

That is the difference.
16. The five things to actually memorize

Don't memorize 30 Docker words.

For now, memorize only this:

1. IMAGE
   = package ready to run

2. CONTAINER
   = running image

3. COMPOSE
   = manages multiple containers

4. NETWORK
   = containers talk to each other

5. VOLUME
   = keeps data

Then add ports:

3000
= API door

27017
= Mongo door

And addresses:

Postman → API
localhost:3000

API → Mongo
mongo:27017

That's enough.
Your final mental picture

Whenever someone says Docker, picture this:

                   DOCKER COMPOSE
                        |
        ┌───────────────┴───────────────┐
        |                               |
        v                               v
   API IMAGE                       MONGO IMAGE
        |                             mongo:8
        v                               |
 API CONTAINER                         v
        |                        MONGO CONTAINER
        |                               |
        └────── DOCKER NETWORK ─────────┘
                                        |
                                        v
                                     VOLUME
                                        |
                                        v
                                      DATA

And from outside Docker:

POSTMAN
   |
localhost:3000
   |
   v
API container
   |
mongo:27017
   |
   v
Mongo container


if you want to check that both backend containers exist, go to the backend folder terminal:
check that both backend containers exist, go to the backend folder terminal:
then:
docker compose ps

You should see two services:

SERVICE   STATUS
api       Up
mongo     Up

You can also run:

docker ps

and you should see containers similar to:

task-manager-api-api-1
task-manager-api-mongo-1

Think of them like this:
task-manager-api-api-1
= your backend Express container

task-manager-api-mongo-1
= your MongoDB container

So yes — right now Docker is managing the backend side:

task-manager-api
   ↓
Docker Compose
   ↓
API container + Mongo container


So your current setup is:

task-manager/
│
├── task-manager-frontend/
│   └── runs normally with npm run dev
│
└── task-manager-api/
    └── Docker Compose
        ├── API container ✅
        │   └── task-manager-api-api-1
        │
        └── Mongo container ✅
            └── task-manager-api-mongo-1
If you can explain that one picture in your own words, you understand the important part of Day 9. You do not need to memorize the generated names like task-manager-api-api-1.

 You should be comfortable with commands like:
 docker compose up --build
# Build/rebuild the images if needed, then start all services from compose.yaml.
# Use this when you changed code, dependencies, Dockerfile, or want a fresh rebuild.

docker compose up
# Start all services from compose.yaml without forcing a rebuild.
# Use this when nothing important changed in the image.

docker compose down
# Stop and remove the Compose containers and network.
# Named volumes usually stay, so your MongoDB data stays.

docker compose ps
# Show the containers/services for this Compose project.
# Use it to check if api and mongo are running.

docker compose logs
# Show logs from all Compose services.
# Useful for seeing what is happening in api + mongo together.

docker compose logs api
# Show logs only from the api service.
# Useful when your Express backend has an error.

docker ps
# Show all currently running Docker containers on your computer.
# Not only this project.

docker images
# Show Docker images stored on your computer.
# Example: task-manager-api-api and mongo:8.

docker volume ls
# Show Docker volumes.
# Useful for checking that your Mongo persistent storage exists.

docker network ls
# Show Docker networks.
# Useful for checking the Compose network that connects api and mongo.

Easy memory:

up --build = rebuild + start
up         = start
down       = stop/remove Compose containers
ps         = what is running?
logs       = what is happening?
images     = prepared packages
volumes    = saved data
networks   = container communication

// =================================================================
// Practice :
Use port 3000 for everything today so the flow stays simple.

Your practice should be:

Create Dockerfile
      ↓
Build IMAGE
      ↓
Check IMAGE
      ↓
Run CONTAINER
      ↓
Check CONTAINER
      ↓
Test in Postman
      ↓
Stop/remove standalone container
      ↓
Create compose.yaml
      ↓
Start API + MongoDB
      ↓
Test in Postman
      ↓
Test VOLUME

This follows the same Docker → image → container → Compose progression from your notes.

Part 1 — Create the Dockerfile

Inside your backend project, create:

Dockerfile

Put:

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "start"]

Human translation:

FROM node:20-alpine
→ Give my container Node.js 20.

WORKDIR /app
→ Work inside a folder called /app.

COPY package*.json ./
→ Copy package.json and package-lock.json.

RUN npm ci
→ Install my Node packages.

COPY . .
→ Copy my backend code.

EXPOSE 3000
→ My Express app uses port 3000.

CMD ["npm", "start"]
→ When the container starts, start my backend.

Your notes use this same Dockerfile structure.

Easy memory:

Node
↓
Folder
↓
Packages
↓
Install
↓
Code
↓
Port
↓
Start
Part 2 — Create .dockerignore

Create:

.dockerignore

Add:

node_modules
npm-debug.log
.git
.gitignore
coverage
.env

Human translation:

Don't copy these files into my Docker image.

Especially:

node_modules
→ Docker installs its own packages.

.env
→ Don't put secrets inside the image.
Part 3 — Build your IMAGE

Run:

docker build -t task-manager-api .

Human translation:

docker build
→ Build an image.

-t task-manager-api
→ Name the image task-manager-api.

.
→ Use the Dockerfile/project in this folder.

Think:

My Project
+
Dockerfile
↓
docker build
↓
IMAGE

So:

docker build
= creates IMAGE
Part 4 — Check your image

Run:

docker images

Human translation:

Show me the Docker images on my computer.

You should see:

task-manager-api

Remember:

IMAGE
= application prepared and ready to run

It is not running yet.

Part 5 — Create and run a CONTAINER

Now take your image and run it:

docker run --name task-manager-container --env-file .env -p 3000:3000 task-manager-api

Let's translate it.

docker run
Create and start a container.
--name task-manager-container
Give my container this name:
task-manager-container
--env-file .env
Give my .env variables to the container.

For example:

PORT
DATABASE_URL
JWT_SECRET
-p 3000:3000

Very important:

HOST : CONTAINER

3000 : 3000

Meaning:

Windows port 3000
        ↓
Container port 3000
        ↓
Express

So Postman uses:

http://localhost:3000
task-manager-api
Use the task-manager-api IMAGE.

Complete picture:

task-manager-api IMAGE
        ↓
docker run
        ↓
task-manager-container
        ↓
Express :3000
        ↓
localhost:3000

Your earlier notes used the same command structure; you're simply keeping the host side at 3000 too.

Part 6 — Check the container

Open another terminal:

docker ps

Human translation:

Show me containers that are currently running.

You should see:

task-manager-container

If you want running and stopped containers:

docker ps -a

Human translation:

Show me ALL containers.

Easy:

docker ps
= running

docker ps -a
= all
Part 7 — Check logs

Run:

docker logs task-manager-container

Human translation:

Show me what my backend/container is saying.

You may see:

MongoDB connected
Server running on port 3000

Junior debugging memory:

docker ps
→ Is it running?

docker logs container-name
→ What happened?
Part 8 — Test in Postman

Now test your normal API.

For example:

POST
http://localhost:3000/api/auth/signup

Then:

POST
http://localhost:3000/api/auth/login

Then:

POST
http://localhost:3000/api/tasks

Then:

GET
http://localhost:3000/api/tasks

If they work:

Postman
↓
localhost:3000
↓
Docker Container
↓
Express
↓
Database

Your single-container Docker practice is working.

Part 9 — Stop the old container before Compose

Before using Compose, stop your standalone container because both would try to use port 3000.

Run:

docker stop task-manager-container

Human translation:

Stop this running container.

Then remove it:

docker rm task-manager-container

Human translation:

Delete this container.

Important:

Deleting container
≠
deleting image

Your image still exists:

docker images

You should still see:

task-manager-api
Part 10 — Now create compose.yaml

Create:

compose.yaml

Add:

services:

  api:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      DATABASE_URL: mongodb://mongo:27017/task-manager
    depends_on:
      - mongo

  mongo:
    image: mongo:8
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:

This matches the Compose setup from your notes.

Now understand it piece by piece.

Part 11 — services
services:

Human translation:

These are the applications/containers
Docker Compose should manage.

You have:

api
mongo

So:

Docker Compose
├── API
└── MongoDB
Part 12 — API service
api:
  build: .

Human translation:

Use my Dockerfile
and build my Express API.

Then:

ports:
  - "3000:3000"

Human translation:

Windows 3000
↓
API container 3000

Postman:

localhost:3000
Part 13 — .env
env_file:
  - .env

Human translation:

Give my .env variables
to my API container.
Part 14 — API → MongoDB

This line is extremely important:

environment:
  DATABASE_URL: mongodb://mongo:27017/task-manager

Why mongo?

Because MongoDB is another Docker container.

Inside your API container:

localhost
= API container itself

So this would be wrong:

mongodb://localhost:27017

Instead:

mongo

is the Compose service name:

mongo:

Therefore:

Postman → API
localhost:3000

API → MongoDB
mongo:27017

Your notes specifically identify this as the key networking rule.

Easy memory:

From Windows:
localhost

Container → Container:
service name
Part 15 — Mongo service
mongo:
  image: mongo:8

Human translation:

Start MongoDB using the existing
MongoDB version 8 Docker image.

Difference:

API
→ build: .
→ because YOU created the API

Mongo
→ image: mongo:8
→ Mongo already has an image
Part 16 — Volume ⭐

Now this:

mongo:
  volumes:
    - mongo-data:/data/db

And at the bottom:

volumes:
  mongo-data:
Why do we need this?

Imagine you signup:

User:
Adam

Then create:

Task:
Learn Docker

MongoDB saves this data.

But Docker containers are designed so they can be removed and recreated.

Without a volume, you don't want your important database files tied only to the Mongo container.

So we create:

mongo-data

Think:

Mongo Container
      ↓
   /data/db
      ↓
mongo-data Volume
      ↓
     DATA

Mongo normally stores its database files at:

/data/db

This:

- mongo-data:/data/db

means:

Connect Docker volume "mongo-data"

to

MongoDB's /data/db folder.

So:

Container
= MongoDB application

Volume
= MongoDB saved data

Your notes describe the volume exactly as persistent storage separate from the Mongo container.

Part 17 — Start Docker Compose

Run:

docker compose up --build

Human translation:

Read compose.yaml

Build/rebuild my API image

Start API container

Start MongoDB container

Create network

Create/connect volume

Think:

docker compose up --build
= BUILD + START
Part 18 — Check Compose

Open another terminal:

docker compose ps

Human translation:

Show me the services
for this Compose project.

You want:

api      Up
mongo    Up

You can also run:

docker ps

But:

docker compose ps

is nicer when checking this specific project.

Part 19 — Test everything in Postman

Now repeat:

Signup
↓
Login
↓
Create Task
↓
Get Tasks

Use:

http://localhost:3000

For example:

POST http://localhost:3000/api/auth/signup
POST http://localhost:3000/api/auth/login
POST http://localhost:3000/api/tasks
GET  http://localhost:3000/api/tasks

Now your flow is:

POSTMAN
   ↓
localhost:3000
   ↓
API Container
   ↓
Docker Network
   ↓
mongo:27017
   ↓
Mongo Container
   ↓
Volume
   ↓
Data
Part 20 — Now prove the volume works ⭐⭐⭐

This is the best part of today's practice.

First make sure you created:

User
+
Task

in Postman.

Then run:

docker compose down
What does down mean?

Human translation:

Stop my Compose project
and remove its containers.

Approximately:

API container removed
Mongo container removed
Network removed

BUT

Volume stays ✅

So your data should still exist.

Your notes specifically distinguish down from down -v this way.

Part 21 — Start it again

Now run:

docker compose up

Human translation:

Create/start the containers again
using my existing images/configuration.

Notice:

docker compose up

not:

docker compose up --build

because you didn't change your code/Dockerfile.

Think:

up
= start

up --build
= rebuild + start
Part 22 — Check your data

After:

docker compose up

go back to Postman.

Try logging in with the same user.

Then:

GET /api/tasks

If your old task is still there:

Volume works ✅

What happened?

OLD Mongo container
       ↓
    deleted

NEW Mongo container
       ↓
    created
       ↓
connects to SAME
mongo-data volume
       ↓
old user + old tasks
still exist ✅

That's the easiest way to truly understand a Docker volume.

Be careful with down -v

Normal:

docker compose down

means:

Stop/remove containers
Remove network
KEEP volume
KEEP database data

But:

docker compose down -v

means:

Stop/remove containers
Remove network
REMOVE volume
Database data can disappear

Easy memory:

down
= containers gone, data stays

down -v
= containers gone + volume gone
Your complete practice today

Do this in this exact order:

# 1. Build image
docker build -t task-manager-api .

# 2. Check image
docker images

# 3. Run container
docker run --name task-manager-container --env-file .env -p 3000:3000 task-manager-api

# 4. Check container
docker ps

# 5. Check logs
docker logs task-manager-container

# 6. Test API in Postman
# localhost:3000

# 7. Stop standalone container
docker stop task-manager-container

# 8. Remove standalone container
docker rm task-manager-container

# 9. Start API + Mongo with Compose
docker compose up --build

# 10. Check Compose
docker compose ps

# 11. Test Signup/Login/Create/Get in Postman

# 12. Stop/remove Compose containers
docker compose down

# 13. Start them again
docker compose up

# 14. Test login/get tasks again
# Old data should still exist
The one picture to remember
Dockerfile
   ↓
docker build
   ↓
IMAGE
   ↓
docker run
   ↓
CONTAINER


Then:


             DOCKER COMPOSE
                   ↓
        ┌──────────┴──────────┐
        ↓                     ↓
   API Container        Mongo Container
        │                     │
        └──── NETWORK ────────┘
                              │
                           VOLUME
                              │
                             DATA

For your junior level, if you can perform these steps and explain what each command is doing in simple words, you understand the important Docker basics.

// // ======================================
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
// // ======================================
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
// // ======================================
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
Day 10
Day 10 — Advanced REST API Design
Short Study Version

The main idea is:

URL = resource
HTTP method = action

1. REST Resource Naming

Good:

GET    /tasks
POST   /tasks
GET    /tasks/:id
PATCH  /tasks/:id
DELETE /tasks/:id

Avoid:

/getTasks
/createTask
/updateTask
/deleteTask

Use plural resource names:

/tasks
/users

Authentication routes like these are fine:

/auth/login
/auth/logout
/auth/signup
/auth/refresh

2. HTTP Methods
GET     → Read
POST    → Create
PATCH   → Update part
PUT     → Replace/update whole resource
DELETE  → Delete

Example:

{
  "completed": true
}

Only one field changes, so:

PATCH /tasks/:id

is the correct choice.

3. Important HTTP Status Codes
200 → Success
201 → Created
204 → Success, no response body

400 → Bad request / invalid data
401 → Not logged in / not authenticated
403 → Logged in, but not allowed
404 → Resource not found
409 → Conflict
429 → Too many requests
500 → Server error

Easy memory:

401 → Who are you?
403 → I know who you are, but you can't do this.

Creating something:

res.status(201)

Getting something successfully:

res.status(200)

4. API Versioning ⭐

Instead of:

/api/tasks

use:

/api/v1/tasks

In app.js:

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/tasks", taskRoutes);

Why?

Later you can create:

/api/v2/tasks

without immediately breaking clients still using:

/api/v1/tasks

Easy memory:

v1 = API version 1

Your rate limiter can still stay:

app.use("/api", apiLimiter);

because /api/v1/... still begins with /api.

5. Pagination

Example:

?page=3&limit=10

Code:

const page = Number(req.query.page) || 1;
const limit = Number(req.query.limit) || 100;
const skip = (page - 1) * limit;

Meaning:

page  → which page?
limit → how many results?
skip  → how many documents to skip?

Example:

page = 3
limit = 10

skip = (3 - 1) × 10
skip = 20

MongoDB skips the first 20 and returns the next 10.

6. Filtering

Example:

/tasks?completed=true

Code:

if (req.query.completed !== undefined) {
  filter.completed =
    req.query.completed === "true";
}

Meaning:

completed=true
      ↓
only completed tasks

7. Sorting
const sort =
  req.query.sort || "-createdAt";

Remember:

createdAt  → oldest → newest
-createdAt → newest → oldest

Example:

/tasks?sort=-createdAt

means:

newest tasks first.

8. Searching ⭐

Example:

/tasks?search=docker

For your project:

if (req.query.search) {
  const searchRegex =
    new RegExp(req.query.search, "i");

  filter.$or = [
    { title: searchRegex },
    { description: searchRegex },
  ];
}

Flow:

?search=Express
      ↓
req.query.search
      ↓
new RegExp("Express", "i")
      ↓
search title OR description

"i" means case-insensitive:

express
Express
EXPRESS

can all match.

$or means:

title matches
OR
description matches

For your project, the notes recommend the new RegExp(...) version because the $regex/$options approach caused a CastError in your setup.

Important search rule

No matching tasks:

{
  "status": "success",
  "results": 0,
  "data": {
    "tasks": []
  }
}

Use:

200 + []

Not 404.

Why?

The /tasks resource exists; there are simply zero matches.

But:

GET /tasks/:id

and that specific task does not exist:

404

Easy:

List/search has no results → 200 + []
Specific resource missing  → 404

9. Combine Everything ⭐

Example:

GET /api/v1/tasks?search=docker&completed=false&sort=-createdAt&page=1&limit=5

Meaning:

search=docker
→ search for docker

completed=false
→ incomplete tasks only

sort=-createdAt
→ newest first

page=1
limit=5
→ first page, maximum 5 results

Think of the flow as:

Tasks
 ↓
User ownership
 ↓
Filtering
 ↓
Searching
 ↓
Sorting
 ↓
Pagination
 ↓
Response

10. Consistent Responses ⭐

Your API should be predictable.

For example:

{
  "status": "success",
  "results": 5,
  "pagination": {},
  "data": {
    "tasks": []
  }
}

Keep names consistent:

status
results
pagination
data

Don't randomly change between:

data
result
taskData
information

The exact format is less important than consistency.

11. Consistent Errors ⭐

Professional flow:

AppError
   ↓
asyncHandler
   ↓
errorHandler
   ↓
JSON error response

Instead of manually doing:

return res.status(403).json(...)

prefer:

return next(
  new AppError(
    "You do not have permission to perform this action",
    403
  )
);

Why?

All errors go through the same central:

errorHandler

12. Invalid ID vs Missing Resource

These are different.

Malformed ID:

/tasks/abc

should be:

400 Invalid resource ID

Code:

if (err.name === "CastError") {
  err.statusCode = 400;
  err.status = "fail";
  err.message = "Invalid resource ID";
}

But a valid-looking MongoDB ID that simply does not exist should be:

404 Task not found

Easy:

Bad ID format   → 400
Valid ID missing → 404

13. Idempotency

Idempotent means:

Repeating the same request gives the same intended final state.

Usually:

GET     ✅
PUT     ✅
DELETE  ✅
POST    ❌ usually
PATCH   ⚠ depends

Example:

POST /orders

twice could create:

Order 1
Order 2

So POST is usually not idempotent.

But repeatedly:

DELETE /tasks/123

still leaves the final state:

Task 123 does not exist.

For junior level, understand the concept; you don't need to build an idempotency system yet.

14. API Design Reasoning ⭐ Interview Important

Why:

GET /tasks

instead of:

GET /getTasks

Because:

/tasks = resource
GET = action

Why:

PATCH /tasks/:id

Because you're changing part of a task.

Why:

POST /tasks → 201

Because a new resource was created.

Why:

GET /tasks/:id → 404

Because that specific resource could not be found.

Why:

/tasks?completed=true

instead of:

/completedTasks

Because completed is a filter on tasks, not a different resource.

⭐ The Most Important Things to Remember
Resource URLs: /tasks, not /getTasks
Methods: GET read, POST create, PATCH partial update, DELETE remove
Statuses: 200, 201, 400, 401, 403, 404, 500
Version API: /api/v1/tasks
Pagination: page, limit, skip
Filter: ?completed=false
Sort: ?sort=-createdAt
Search: ?search=docker
No search results: 200 + []
Specific missing task: 404
Bad MongoDB ID: 400
Keep success/error responses consistent
Use centralized AppError → errorHandler
Understand basic idempotency
Be able to explain WHY your API is designed this way
Final example to understand
GET /api/v1/tasks?search=docker&completed=false&sort=-createdAt&page=1&limit=5
GET
→ read

/api
→ API

/v1
→ version 1

/tasks
→ resource

search=docker
→ search

completed=false
→ filter

sort=-createdAt
→ newest first

page=1&limit=5
→ pagination

If you can read this URL, build it, test it in Postman, and explain why it is designed this way, you understand the important part of Advanced REST API Design for your strong-junior level.
//=========================================
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
//=========================================
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
//=========================================
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
//=========================================
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
Day 11
Day 11 — Architecture + Swagger/OpenAPI
Short Study Version

There are 2 main topics:

1. Services + Repositories Architecture
2. Swagger / OpenAPI

The goal is not to memorize enterprise architecture.

The goal is to understand:

Why each layer exists and what job each layer does.

PART 1 — Architecture
1. Old Architecture

Your older structure was roughly:

Route
  ↓
Controller
  ↓
Model
  ↓
MongoDB

Example:

GET /api/v1/tasks
        ↓
taskRoutes.js
        ↓
taskController.getTasks
        ↓
Task.find(...)
        ↓
MongoDB

This is completely fine for small projects.

The problem is that controllers can become too big.

2. New Layered Architecture ⭐

Now:

Route
   ↓
Controller
   ↓
Service
   ↓
Repository
   ↓
Model
   ↓
MongoDB

Easy memory:

Route       → URL + method + middleware
Controller  → HTTP / req / res
Service     → business logic
Repository  → database queries
Model       → schema
Utility     → reusable helpers

This is the most important thing to remember.

3. Human Example

Request:

GET /api/v1/tasks?completed=true

Think:

Route
→ Which endpoint was called?

Controller
→ Give service req.user and req.query

Service
→ What is this user allowed to see?
→ completed=true?
→ which page?
→ what search/filter?

Repository
→ Ask MongoDB for the data

MongoDB
→ Return documents

Then the result travels back:

MongoDB
   ↑
Repository
   ↑
Service
   ↑
Controller
   ↑
JSON response

4. New Folders

Add:

services/
    taskService.js

repositories/
    taskRepository.js

So your project becomes roughly:

controllers/
services/
repositories/
models/
routes/
utils/
app.js
server.js

For learning, refactor Tasks only.

Don't refactor the entire application just because you can.

That would be over-engineering.

5. Repository Layer ⭐

Think:

Repository = database worker

The repository is the layer that directly talks to Mongoose.

Example:

const Task = require("../models/taskModel");

Common functions:

findTasks()
countTasks()
findOneTask()
createTask()
updateTask()
deleteTask()

Easy table:

Repository	Meaning	Mongoose
findTasks()	get many	Task.find()
countTasks()	count	Task.countDocuments()
findOneTask()	get one	Task.findOne()
createTask()	create	Task.create()
updateTask()	update	Task.findOneAndUpdate()
deleteTask()	delete	Task.findOneAndDelete()

Repository Example
exports.findTasks = async ({
  filter,
  sort,
  skip,
  limit,
}) => {
  return Task.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

Meaning:

find matching tasks
      ↓
sort them
      ↓
skip old pages
      ↓
return requested amount

Important:

Repository can know:

Task.find()
Task.create()
Task.findOneAndUpdate()

Repository should NOT know:

req
res
req.user
res.status()

6. Why Repository?

Without repository:

const tasks = await Task.find(filter)
  .sort(sort)
  .skip(skip)
  .limit(limit);

may live inside your controller.

With repository:

const tasks =
  await taskRepository.findTasks({
    filter,
    sort,
    skip,
    limit,
  });

Why?

Because the controller/service doesn't need to know exactly how MongoDB performs the query.

This is called:

Separation of concerns

7. Service Layer ⭐

Think:

Service = application/business logic

Example:

const buildUserFilter = (user) => {
  const filter = {};

  if (user.role !== "admin") {
    filter.user = user._id;
  }

  return filter;
};

Meaning:

Admin
→ can see all tasks

Normal user
→ only their own tasks

That is a business rule, so it belongs in the service.

8. Service Handles Things Like
permissions
filtering
searching
sorting
pagination
page validation
ownership
business rules

Example:

exports.getTasks = async (user, query) => {

Notice:

user
query

Not:

req
res

Why?

Because the service should not depend on Express.

Controller gives:

req.user
req.query

to the service:

taskService.getTasks(
  req.user,
  req.query
);

9. Important Service Flow

For getTasks:

1. Pagination
2. Build user filter
3. completed filter
4. search
5. count tasks
6. calculate pages
7. sorting
8. repository gets tasks
9. return result

Example:

const tasks =
  await taskRepository.findTasks({
    filter,
    sort,
    skip,
    limit,
  });

Service does NOT call:

Task.find()

directly.

That's the repository's job.

10. Controller Layer ⭐

Think:

Controller = HTTP

Controller knows:

req
res
req.body
req.params
req.query
req.user
status codes
JSON responses

Example:

exports.getTasks = catchAsync(
  async (req, res) => {

    const result =
      await taskService.getTasks(
        req.user,
        req.query
      );

    res.status(200).json({
      status: "success",
      results: result.tasks.length,
      pagination: result.pagination,
      data: {
        tasks: result.tasks,
      },
    });
  }
);

Controller's job is now simple:

receive HTTP request
       ↓
call service
       ↓
send HTTP response

11. CRUD Flow
Create

Service:

exports.createTask =
  async (user, taskData) => {
    return taskRepository.createTask({
      ...taskData,
      user: user._id,
    });
  };

Important business rule:

new task
→ belongs to authenticated user

Controller sends:

201 Created

Get One Task

Service builds:

{
  _id: id,
  user: userId
}

Meaning:

Find this task only if it belongs to this user.

This helps prevent users from accessing somebody else's task.

Update

Flow:

Controller
→ passes user + id + req.body

Service
→ applies ownership/business rules

Repository
→ Task.findOneAndUpdate()

Success:

200 OK

Delete

Flow:

Controller
→ Service
→ Repository
→ MongoDB

Success:

204 No Content

No response body.

12. Routes Stay Simple

Example:

router
  .route("/")
  .get(taskController.getTasks)
  .post(taskController.createTask);

router
  .route("/:id")
  .get(taskController.getTask)
  .patch(taskController.updateTask)
  .delete(taskController.deleteTask);

Routes shouldn't contain business logic or database code.

13. Controller vs Service vs Repository ⭐ Interview Question

Memorize this:

Controller
→ HTTP

Service
→ business logic

Repository
→ database

More detail:

Controller:
req
res
status codes
JSON

Service:
permissions
ownership
filters
search
rules

Repository:
Task.find()
Task.create()
Task.update()
Task.delete()

14. Separation of Concerns

Bad:

Controller
├── HTTP
├── permissions
├── search
├── pagination
├── database
├── business logic
└── response

Better:

Controller → HTTP
Service    → logic
Repository → database

That is:

Separation of concerns

15. DRY

DRY means:

Don't Repeat Yourself

Instead of writing this five times:

if (user.role !== "admin") {
  filter.user = user._id;
}

create:

buildUserFilter(user)

and reuse it.

16. Utility Functions

Utilities are generic reusable helpers.

Examples:

asyncHandler()
sendEmail()
generateToken()
formatDate()
sanitizeInput()

Usually don't put core Task-specific business logic in utils.

17. Dependencies

Easy flow:

Controller
   ↓ depends on
Service
   ↓ depends on
Repository
   ↓ depends on
Model

For junior level, that's enough.

You do not need advanced dependency injection frameworks yet.

18. When Should You Use This Architecture?

Useful when:

controllers become large
business rules grow
complex permissions
multiple DB operations
e-commerce
booking systems
SaaS
payment systems

Don't use 5 layers for something simple like:

GET /health

returning:

{
  "status": "ok"
}

That would be over-engineering.

PART 2 — Swagger / OpenAPI
19. OpenAPI vs Swagger ⭐

Very important:

OpenAPI
→ standard/format that describes an API

Swagger UI
→ webpage that displays that documentation

Easy memory:

OpenAPI = description

Swagger UI = visual documentation + testing page

20. Why Use Swagger?

Imagine another developer sees:

POST /api/v1/tasks

They may ask:

What body do I send?
Do I need JWT?
Which fields are required?
What status code comes back?
What errors are possible?

Swagger puts all of that in one place.

21. Install Swagger
npm install swagger-ui-express swagger-jsdoc

Purpose:

swagger-jsdoc
→ generates OpenAPI documentation

swagger-ui-express
→ shows the documentation in Express

22. Create Swagger Config

Create:

docs/
   swagger.js

Basic version:

const swaggerJsdoc =
  require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "Task Manager API",
      version: "1.0.0",
      description:
        "REST API for managing users and tasks",
    },

    servers: [
      {
        url:
          "http://localhost:3000/api/v1",
      },
    ],
  },

  apis: ["./routes/*.js"],
};

const swaggerSpec =
  swaggerJsdoc(options);

module.exports = swaggerSpec;

23. Swagger Config Meaning

Remember:

openapi
→ OpenAPI specification version

info
→ information about your API

servers
→ where your API runs

apis
→ where Swagger should look for comments

Important difference:

openapi: "3.0.3"

means:

OpenAPI standard version

while:

version: "1.0.0"

means:

your Task Manager API version

24. Add Swagger UI to Express

In app.js:

const swaggerUi =
  require("swagger-ui-express");

const swaggerSpec =
  require("./docs/swagger");

Then:

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

Put it before your 404 handler.

Otherwise the 404 handler may catch:

/api-docs

25. Open Swagger

Run server and visit:

http://localhost:3000/api-docs

At first it may be mostly empty.

That's normal until you document routes.

26. Swagger Comments

Swagger comments document the route.

They do not change how Express works.

Example concept:

POST /auth/login

summary
requestBody
required fields
responses

Your actual Express route still remains:

router.post(
  "/login",
  authController.login
);

Swagger only explains how to use it.

27. Important OpenAPI Keywords

You do NOT need to memorize all the syntax.

Understand these:

tags
→ groups endpoints

summary
→ short description

requestBody
→ JSON/body client sends

parameters
→ query or path values

responses
→ possible API responses

security
→ authentication

schema
→ data structure

This is enough for strong-junior level.

28. JWT in Swagger

Define JWT once:

components: {
  securitySchemes: {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  },
}

Human meaning:

Authorization: Bearer JWT_TOKEN

Then protected routes use:

security:
  - bearerAuth: []

29. Swagger GET Tasks

Swagger can document query parameters like:

completed
search
sort
page
limit

So Swagger can build something like:

GET /tasks?completed=false&page=1&limit=5

for you.

This makes the API much easier for other developers to understand and test.

30. Testing Protected Routes in Swagger

Typical flow:

1. Login
2. Get JWT
3. Click Authorize
4. Enter token
5. Open GET /tasks
6. Try it out
7. Execute

Swagger sends the real request just like Postman.

31. Express :id vs OpenAPI {id} ⭐

Very important:

Express:

/tasks/:id

OpenAPI:

/tasks/{id}

Easy memory:

Express → :id
OpenAPI → {id}

32. Typical Swagger Documentation

You may document:

POST /auth/login

GET /tasks

POST /tasks

PATCH /tasks/{id}

DELETE /tasks/{id}

And include:

authentication
body
query parameters
path parameters
success responses
error responses

33. Keep Swagger Accurate ⭐

If Swagger says:

DELETE → 204

but your API actually returns:

200

then your documentation is wrong.

Swagger documentation should match your real API:

required fields
JWT
errors
status codes
response bodies
query parameters

34. Swagger components

Think:

components = reusable Swagger pieces

Example:

components
├── securitySchemes
└── schemas

securitySchemes:

authentication

schemas:

reusable data structures

Example Task schema:

Task
├── _id
├── title
├── description
├── completed
├── user
├── createdAt
└── updatedAt

Then instead of writing the Task structure repeatedly:

$ref: '#/components/schemas/Task'

Meaning:

Use the Task structure already defined in components.

This is also DRY.

35. Swagger Does NOT Create Your API

Very important:

Swagger does not replace:

Express
Controllers
Services
Repositories
MongoDB

Your actual API still works through those.

Swagger only:

describes it
shows documentation
lets developers test it

Easy memory:

Swagger = instruction manual + testing page for your API.

⭐ Final Architecture Memory
REQUEST
   ↓
ROUTE
Which URL/method?
   ↓
CONTROLLER
HTTP / req / res
   ↓
SERVICE
Business logic
   ↓
REPOSITORY
Database queries
   ↓
MODEL
Schema
   ↓
MONGODB
Data

And separately:

OpenAPI
   ↓
describes the API

Swagger UI
   ↓
shows documentation
   ↓
lets developers test endpoints

⭐ What You Really Need to Memorize
Architecture
Route      = routing
Controller = HTTP
Service    = business logic
Repository = database
Model      = schema
Swagger
OpenAPI     = API description standard
Swagger UI  = visual + interactive documentation

requestBody = client sends
parameters  = query/path values
responses   = API returns
security    = authentication
schemas     = reusable data structures
components  = reusable Swagger pieces
Most Important Interview Answer

If asked:

What is the difference between Controller, Service, and Repository?

Say:

Controller handles HTTP requests and responses. The Service contains application/business logic. The Repository handles database operations. Separating them keeps the code cleaner, easier to maintain, and prevents controllers from becoming too large.

That is essentially the strong-junior understanding you need from Day 11. You do not need to memorize every Swagger YAML line or every repository pattern.

//===========================================
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅

🟢 WEEK 3 — LOGGING + FILES + JOBS + DEPLOYMENT
Day 12 — Professional Logging with Pino

Day 12 — Professional Logging with Pino
Short Study Version

The full logging flow is:

Client / Postman
      ↓
Express receives request
      ↓
pino-http creates request logger + Request ID
      ↓
Controller
      ↓
Service
      ↓
Repository / MongoDB
      ↓
Response
      ↓
Pino logs status + response time
1. What Is Logging?

Logging means recording what happens inside your application.

Basic:

console.log("Server started");

Professional logging stores useful structured information:

{
  "reqId": "abc123",
  "userId": "123",
  "taskId": "456",
  "msg": "Task created"
}

Then you can search by:

reqId
userId
taskId
status

This makes production debugging much easier.

2. Structured Logging ⭐

Avoid putting everything inside one string:

logger.info(
  `User ${userId} created task ${taskId}`
);

Better:

logger.info(
  {
    userId,
    taskId,
  },
  "Task created"
);

Why?

Because:

userId
taskId

become separate searchable fields.

That is called:

Structured logging

3. Why Pino Instead of console.log()?

console.log():

plain text
harder to search
no standard levels
no request tracking
no automatic HTTP logging

Pino:

structured JSON
log levels
timestamps
request IDs
HTTP logging
error information
redaction
production-friendly

pino-pretty makes development logs easier for humans to read.

4. Pino Log Levels ⭐

Remember:

trace → extremely detailed
debug → developer details
info  → normal important event
warn  → unusual / client problem
error → something failed
fatal → application cannot continue

Examples:

logger.debug("Building task filter");

logger.info("Server started");

logger.warn("Task not found");

logger.error({ err }, "Database query failed");

logger.fatal({ err }, "Database connection failed");

If level is:

info

Pino records:

info
warn
error
fatal

but ignores:

debug
trace

5. Don't Use error for Everything

Example:

Task not found
→ 404
→ WARN

But:

MongoDB crashes unexpectedly
→ 500
→ ERROR

Easy rule:

4xx → usually WARN
5xx → usually ERROR

6. Install Pino

Backend:

npm install pino pino-http
npm install --save-dev pino-pretty

Meaning:

pino
→ main logger

pino-http
→ Express/HTTP logging

pino-pretty
→ pretty development logs

7. Create logger.js

Create:

utils/logger.js

Basic version:

const pino = require("pino");

const logger = pino();

module.exports = logger;

Then other files can use:

const logger = require("./utils/logger");

8. Replace Server console.log()

Instead of:

console.log("MongoDB connected");

use:

logger.info("MongoDB connected successfully");

Server startup:

logger.info(
  { port: PORT },
  "Server started"
);

Startup failure:

logger.fatal(
  { err: error },
  "MongoDB connection failed"
);

Then:

process.exit(1);

9. Development vs Production Logging ⭐

Your logger can have two modes.

Development:

pretty
readable
debug logs
good for developer

Example:

INFO: Server started
    port: 3000

Production:

structured JSON
less noise
good for servers/logging tools

Example:

{
  "level": 30,
  "port": 3000,
  "msg": "Server started"
}

Easy memory:

development = pretty logs
production  = JSON logs

10. Logger Configuration

Important idea:

const isProduction =
  process.env.NODE_ENV === "production";

Then:

level:
  process.env.LOG_LEVEL ||
  (isProduction ? "info" : "debug");

Meaning:

If LOG_LEVEL exists
→ use it

Otherwise:
production  → info
development → debug

You do not need to memorize the full config.

Understand what it does.

11. Timestamp

Use:

timestamp:
  pino.stdTimeFunctions.isoTime

You get readable time such as:

2026-09-10T14:31:20.321Z

Useful when debugging exactly when something failed.

12. Connect Pino to Express ⭐

Use:

const pinoHttp =
  require("pino-http");

const logger =
  require("./utils/logger");

Then:

app.use(
  pinoHttp({
    logger,
  })
);

Important:

Put Pino middleware before routes.

Correct flow:

Request
  ↓
Pino middleware
  ↓
express.json()
  ↓
routes
  ↓
controller

13. Automatic HTTP Logging

Now Pino can automatically log:

HTTP method
URL
status code
response time
request information

Example:

GET /api/v1/tasks
200
45ms

This helps find slow endpoints.

Example:

/users/me → 80ms
/tasks    → 4200ms
/login    → 110ms

Immediately you know:

/tasks is slow

14. Request ID ⭐ Very Important

When hundreds of requests happen together, you need to know which logs belong together.

A Request ID gives one request a unique ID:

abc-123

Everything related to that request can use the same ID.

Example:

Controller  → abc-123
Service     → abc-123
Repository  → abc-123
Database    → abc-123

Then search:

abc-123

and see the whole request story.

15. Generate Request IDs

Import:

const {
  randomUUID,
} = require("node:crypto");

Then:

genReqId(req, res) {
  const existingId =
    req.headers["x-request-id"];

  const id =
    existingId || randomUUID();

  res.setHeader(
    "X-Request-Id",
    id
  );

  return id;
}

Meaning:

Existing request ID?
→ use it

No ID?
→ create UUID

Then send ID back to client.

16. req.log ⭐

After using pino-http, every request gets:

req.log

Inside a controller:

req.log.info("Getting tasks");

Easy rule:

Inside controller / route / middleware
→ req.log

Outside a request
→ logger

Examples:

Controller request
→ req.log.info()

Server startup
→ logger.info()

Why?

Because req.log already knows the current request and Request ID.

17. debug vs info

Fetching tasks happens all the time:

req.log.debug(
  {
    userId: req.user._id,
  },
  "Fetching tasks"
);

Use debug for:

filters
query building
internal details
developer debugging

Use info for important normal events:

req.log.info(
  {
    taskId: task._id,
    userId: req.user._id,
  },
  "Task created"
);

Easy memory:

debug → detailed developer info
info  → important normal event

18. Don't Over-Log

Bad:

entered controller
before database
database started
database finished
sending response

Too much noise.

Ask:

Will this log actually help me debug, investigate, or understand the system?

If not, don't add it.

19. Log Level Based on HTTP Status

Use:

customLogLevel(req, res, err) {
  if (
    err ||
    res.statusCode >= 500
  ) {
    return "error";
  }

  if (res.statusCode >= 400) {
    return "warn";
  }

  return "info";
}

Result:

200 → INFO
201 → INFO

400 → WARN
401 → WARN
403 → WARN
404 → WARN

500 → ERROR

20. Error Logging ⭐

Your error handler should first decide the final status code, then log.

Flow:

Error arrives
    ↓
Set default status
    ↓
Identify special error
    ↓
Change status if needed
    ↓
Log final error
    ↓
Send response

Why?

A bad MongoDB ID might initially look like:

500

but after checking CastError, it becomes:

400

You want to log:

WARN 400

not:

ERROR 500

21. Error Handler Logging

For server errors:

req.log.error(
  {
    err,
  },
  "Unexpected server error"
);

Pino can log:

error type
message
stack trace

For client/operational errors:

req.log.warn(
  {
    statusCode: err.statusCode,
    message: err.message,
  },
  "Request failed"
);

Usually no giant stack trace needed for a normal 404.

22. Two Error Logs Can Be Normal

You may see:

WARN: Request failed

from your error handler.

Then:

WARN: request completed

from pino-http.

They have different jobs:

Request failed
→ WHY did it fail?

Request completed
→ WHAT request finished,
  status,
  response time

Both are useful.

23. Operational vs Programmer Error ⭐
Operational error

The application works correctly, but a normal problem happened.

Examples:

Wrong password       → 401
Invalid input        → 400
Task not found       → 404
Email already exists → 409

Usually:

WARN
Programmer/server error

Your code has an unexpected bug.

Examples:

ReferenceError
TypeError
broken code
unexpected database/server failure

Usually:

500
ERROR

Easy:

Operational
→ expected problem
→ usually 4xx
→ WARN

Programmer/server
→ unexpected bug/failure
→ usually 500
→ ERROR

24. Never Log Sensitive Data ⭐⭐⭐

Never blindly do:

req.log.info(req.body);

The body could contain:

{
  "email": "user@example.com",
  "password": "secret123"
}

Now the password could be saved in your logs.

Avoid logging:

passwords
JWT/access tokens
refresh tokens
cookies
Authorization header
API keys
database secrets
credit-card information
session IDs
unnecessary personal information

Safe examples:

requestId
userId
taskId
route
statusCode
responseTime

25. Pino Redaction

Pino can automatically hide sensitive values.

Example config:

redact: {
  paths: [
    "req.headers.authorization",
    "req.headers.cookie",
    "password",
    "passwordConfirm",
    "body.password",
    "body.passwordConfirm",
    "token",
  ],
  censor: "[REDACTED]",
}

Meaning:

Pino finds sensitive field
        ↓
replace value with
        ↓
[REDACTED]

Understand the concept; don't memorize every path.

26. Child Logger .child()

You can create:

const log =
  req.log.child({
    userId: req.user._id,
  });

Meaning:

req.log
+
userId
=
child logger

Then:

log.info("Task created");
log.debug("Building query");

automatically include:

request ID
userId

Easy memory:

req.log
→ logger for this request

req.log.child({ userId })
→ same logger + remembers userId

Use it to avoid repeating the same data everywhere.

27. Logging Inside Service

You do not have to log inside every service.

If needed:

Controller:

const task =
  await taskService.createTask(
    data,
    req.log
  );

Service:

const createTask =
  async (data, log) => {
    log.debug("Creating task");

    return taskRepository.create(data);
  };

Important:

Don't pass:

taskService.createTask(req);

Better:

taskService.createTask(data, log);

Why?

The service should not depend on Express.

Easy:

Need logging in service
→ pass log

Don't need logging in service
→ don't add it

28. What Should You Actually Log?

Useful places:

server startup
database connected
database connection failure
important login failures
task created
task deleted
unexpected 500 errors
HTTP requests
HTTP status
response time
request ID

Use debug for temporary/internal details:

filters
queries
internal flow

Don't add 100 logs everywhere.

29. What Pino Gives You

With your setup:

✓ timestamps
✓ structured logging
✓ HTTP requests
✓ HTTP responses
✓ response time
✓ method
✓ URL
✓ status
✓ request IDs
✓ log levels
✓ development pretty logs
✓ production JSON logs
✓ error stack information
✓ sensitive-data redaction

That's already a strong professional logging setup.

30. Final Pino Middleware Pattern

The important structure is:

app.use(
  pinoHttp({
    logger,

    genReqId(req, res) {
      const existingId =
        req.headers["x-request-id"];

      const id =
        existingId || randomUUID();

      res.setHeader(
        "X-Request-Id",
        id
      );

      return id;
    },

    customLogLevel(
      req,
      res,
      err
    ) {
      if (
        err ||
        res.statusCode >= 500
      ) {
        return "error";
      }

      if (
        res.statusCode >= 400
      ) {
        return "warn";
      }

      return "info";
    },
  })
);

Remember middleware order:

const app = express()
       ↓
Pino middleware
       ↓
express.json()
       ↓
routes

⭐ Final Memory Sheet
Pino
Pino
= professional structured logger

pino-http
= HTTP/Express logging

pino-pretty
= pretty development logs
Levels
debug → developer details
info  → normal important event
warn  → expected/unusual problem
error → unexpected failure
fatal → app cannot continue
HTTP
2xx → INFO
4xx → WARN
5xx → ERROR
Logger choice
Inside HTTP request
→ req.log

Outside HTTP request
→ logger
Request ID
Request ID
= unique ID for one request
= connects logs across layers
.child()
req.log.child({ userId })

= same request logger
+ automatically remembers userId
Security
Never log:
passwords
tokens
cookies
API keys
payment info
secrets
Development vs Production
Development
→ pretty + debug logs

Production
→ structured JSON + less noise
⭐ Interview Answers

Why Pino instead of console.log()?

Pino provides structured JSON logs, log levels, timestamps, request IDs, error information, and HTTP logging. Structured logs are easier to search and analyze in production.

What is a Request ID?

A unique ID for one HTTP request that lets us connect logs from the controller, service, repository, and other parts of the system.

Difference between debug and info?

debug is detailed developer information that is usually disabled in production. info is an important normal application event we usually keep.

What should be an error log?

Unexpected server or infrastructure failures, especially 5xx errors.

What should you never log?

Passwords, tokens, cookies, API keys, payment information, and other sensitive data.

If you understand those points and can use logger, req.log, Request IDs, levels, redaction, and pino-http, you have the important strong-junior knowledge from Day 12.

// =========================================
✅✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅✅

Day 13
Day 13 — File Uploads + Cloud Storage
Short Study Version

The full flow is:

User uploads image
      ↓
multipart/form-data
      ↓
Authentication
      ↓
Multer receives + validates file
      ↓
Controller
      ↓
Service
      ↓
Cloudinary stores image
      ↓
Repository saves URL + publicId
      ↓
MongoDB
      ↓
API returns updated user
1. JSON vs File Upload

Normal JSON:

{
  "name": "Adam",
  "email": "adam@example.com"
}

uses:

Content-Type: application/json

and Express handles it with:

app.use(express.json());

But images are binary files.

So file uploads normally use:

multipart/form-data

Easy memory:

express.json()
→ JSON

Multer
→ files / form-data

2. req.body, req.file, req.files

You already know:

req.body

for normal form/text data.

Multer adds:

req.file
→ one uploaded file

req.files
→ multiple uploaded files

Important properties:

originalname → original filename
mimetype     → file type
size         → file size
buffer       → actual file data in memory

You do not need to memorize everything inside req.file.

3. Install Multer
npm install multer

Multer processes:

multipart/form-data

requests.

4. Basic Multer Setup

Create:

middleware/uploadMiddleware.js

Basic:

const multer = require("multer");

const storage =
  multer.memoryStorage();

const upload = multer({
  storage,
});

const uploadProfileImage =
  upload.single("image");

Meaning:

memoryStorage()
→ keep file temporarily in RAM

upload.single("image")
→ accept ONE file named "image"

Then:

image
  ↓
req.file

5. Postman File Upload

Use:

Body
 ↓
form-data

Then:

KEY     TYPE    VALUE
image   File    profile.jpg

Very important:

upload.single("image")

means the Postman field must also be:

image

Not:

photo

Also let Postman create the multipart Content-Type automatically.

6. Validate File Type + Size ⭐

For profile images, allow only:

JPEG
PNG
WEBP

Example:

const allowedTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

Use:

fileFilter

to control allowed file types.

And:

limits: {
  fileSize: 5 * 1024 * 1024,
}

means:

Maximum size = 5MB

Easy memory:

storage
→ where file temporarily goes

fileFilter
→ which files are allowed

limits
→ maximum file size

7. Test Valid AND Invalid Files

You should test:

JPG     → accepted
PNG     → accepted
WEBP    → accepted

PDF     → rejected
TXT     → rejected
> 5MB   → rejected

Strong juniors test both:

valid input
+
invalid input

8. Memory Storage vs Disk Storage

Multer can use:

multer.memoryStorage()

or:

multer.diskStorage()

Memory:

Request
  ↓
RAM
  ↓
Cloudinary

Disk:

Request
  ↓
uploads folder
  ↓
Cloudinary
  ↓
delete temporary file

For small profile images:

memoryStorage + 5MB limit

is a good choice.

Don't allow huge files because they use server RAM.

9. Why Cloudinary?

You could save images locally, but your API server should not normally be your permanent image library.

Better:

Express
  ↓
Cloudinary
  ↓
stores actual image

Then MongoDB stores only:

image URL
publicId

Example:

Cloudinary
→ actual profile.jpg

MongoDB
→ https://res.cloudinary.com/.../profile.jpg

10. Cloudinary Credentials

You need:

cloud name
API key
API secret

Put them in .env:

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

And make sure:

.env

is inside:

.gitignore

Never put your API secret in:

frontend code
GitHub
hard-coded JavaScript

11. Cloudinary Config

Create:

config/cloudinary.js

Main idea:

.env
 ↓
Cloudinary config
 ↓
Cloudinary SDK authenticated

You do not need to memorize the exact config syntax.

12. Cloudinary Service

Create:

services/cloudinaryService.js

Its main jobs:

uploadImage()
deleteImage()

Flow:

Multer file.buffer
      ↓
stream
      ↓
Cloudinary

You do not need deep knowledge of Node streams yet.

Understand:

file.buffer
→ actual image data in memory

13. Cloudinary Result ⭐

After upload, Cloudinary gives useful values such as:

uploaded.secure_url
uploaded.public_id

Easy memory:

secure_url
→ show/find image

public_id
→ manage/delete image

Example:

URL
→ frontend displays image

publicId
→ Cloudinary can replace/delete image

14. Save Image Info in User Model

Add something like:

profileImage: {
  url: String,
  publicId: String,
}

MongoDB stores:

{
  "profileImage": {
    "url": "https://...",
    "publicId": "task-manager/profile-images/abc123"
  }
}

MongoDB does not store millions of image bytes.

It stores information about the image.

15. Keep Layered Architecture

Keep:

Route
 ↓
Controller
 ↓
Service
 ↓
Repository
 ↓
Model
 ↓
MongoDB

For users:

userRoutes
 ↓
userController
 ↓
userService
 ↓
userRepository
 ↓
User model

16. Repository Job

Repository handles database operations.

Example:

updateProfileImage(
  userId,
  profileImage
)

internally uses something like:

User.findByIdAndUpdate(...)

Remember:

Repository
= database work

Don't duplicate functions if you already have something like:

findById()

Reuse it.

17. Service Job ⭐

The service handles the important business logic.

Profile image flow:

1. Make sure file exists

2. Find user

3. Remember old image publicId

4. Upload new image to Cloudinary

5. Save new URL + publicId in MongoDB

6. If DB update fails:
   delete newly uploaded image

7. If user had old image:
   delete old Cloudinary image

8. Return updated user

18. Why Cleanup Matters ⭐

Imagine:

Cloudinary upload ✅
MongoDB update ❌

Without cleanup:

new image remains in Cloudinary
but MongoDB doesn't use it

That becomes an:

orphaned image

So:

Upload new image
      ↓
DB update fails
      ↓
delete uploaded image

This is strong-junior thinking.

19. Replacing Old Image

If user already has:

photo-1.jpg

and uploads:

photo-2.jpg

your app should:

Upload photo-2
      ↓
Update MongoDB
      ↓
Delete photo-1

MongoDB should point only to the newest image.

20. Logging in the Service

This is a good place to pass:

req.log

because useful events can happen:

upload success
cleanup failure
old image deletion failure

Don't log:

file.buffer
API secret
password
token

Safe examples:

userId
publicId

You do not need to pass log into every service—only where it is useful.

21. Controller Should Stay Small

Controller should mainly do:

receive request
     ↓
call service
     ↓
send response

Example concept:

const user =
  await userService.updateProfileImage(
    req.user._id,
    req.file,
    req.log
  );

Controller should NOT know:

how Cloudinary works
how MongoDB updates user
how old image gets deleted

Easy:

Controller → HTTP
Service    → business logic
Repository → database

22. Route Order ⭐

Example:

router.patch(
  "/me/profile-image",
  protect,
  uploadProfileImage,
  updateProfileImage
);

Order:

PATCH /me/profile-image
        ↓
protect
        ↓
Multer
        ↓
controller

Authentication comes first.

Why?

Unauthorized users should not be allowed to use your upload endpoint.

23. Final Upload Architecture
Frontend / Postman
      ↓
PATCH /users/me/profile-image
      ↓
Authentication
      ↓
Multer
- multipart/form-data
- one file
- type validation
- 5MB limit
      ↓
Controller
      ↓
User Service
      ↓
Cloudinary + Repository
                  ↓
                MongoDB

That's the architecture you need to understand.

24. Handle Multer Errors

If file is too large, Multer may produce:

LIMIT_FILE_SIZE

You can convert that into:

413 Payload Too Large

with a message like:

Image must be 5MB or smaller.

Continue using your centralized error handler rather than writing separate try/catch + res.status() everywhere.

25. Final Testing Checklist ⭐

Test:

JPEG                 → 200
PNG                  → 200
WEBP                 → 200

PDF                  → 400
TXT                  → 400
Over 5MB             → 413
No image             → 400
No authentication    → 401

Replace image        → 200
Old Cloudinary image → removed
MongoDB              → new URL/publicId

Testing invalid cases is part of professional development.

26. MIME Type Security

Checking:

file.mimetype

is good junior-level validation.

But understand:

The client can potentially lie about file metadata.

Levels:

Beginner
→ accept everything ❌

Junior
→ check mimetype + size ✅

Higher-security production
→ inspect real file contents/signatures too

You don't need advanced binary validation yet.

27. Never Make Multer Global

Don't do:

app.use(upload.any());

for your whole application.

Instead:

router.patch(
  "/me/profile-image",
  uploadProfileImage,
  ...
);

Only use upload middleware on routes that actually accept files.

⭐ What You Need to Remember
multipart/form-data
→ used for file uploads

Multer
→ receives and validates uploaded files

req.file
→ one uploaded file

req.files
→ multiple uploaded files

upload.single("image")
→ accept one file named image

memoryStorage()
→ temporarily keep file in RAM

file.buffer
→ actual file data

fileFilter
→ allowed file types

limits.fileSize
→ maximum size

Cloudinary
→ stores actual image

secure_url
→ display image

public_id
→ manage/delete image

MongoDB
→ stores URL + publicId

⭐ Final Mental Model

This is the main thing to understand:

User selects image
      ↓
multipart/form-data
      ↓
Authentication
      ↓
Multer receives file
      ↓
validate type + size
      ↓
req.file
      ↓
Controller
      ↓
Service
      ↓
file.buffer sent to Cloudinary
      ↓
Cloudinary stores image
      ↓
returns secure_url + public_id
      ↓
Repository saves them in MongoDB
      ↓
old image deleted if necessary
      ↓
updated user returned

And memorize these four especially:

upload.single("image")
→ receive one file named image

req.file
→ uploaded file

file.buffer
→ actual image data

secure_url
→ show image

public_id
→ manage/delete image

That is the important strong-junior version of Day 13. You do not need to memorize Cloudinary config syntax, advanced streams, AWS S3, chunked uploads, or video processing yet.

// =======================================
✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅

Day 14 Short version but easy
Day 14 is really just this:

Create task
   ↓
Save task in MongoDB
   ↓
Add notification job to queue
   ↓
Return task to user
   ↓
Worker processes notification separately

That is the main idea.

1. Your old createTask

Before background jobs, your service was basically:

exports.createTask = async (user, taskData) => {
  return taskRepository.createTask({
    ...taskData,
    user: user._id,
  });
};

Human translation:

Create the task in MongoDB
↓
Wait until task is created
↓
Return the task

Very simple.

2. Now we add one extra thing

New version:

exports.createTask = async (user, taskData) => {
  const task = await taskRepository.createTask({
    ...taskData,
    user: user._id,
  });

  await taskQueue.add(
    "task-created-notification",
    {
      taskId: task._id.toString(),
      userId: user._id.toString(),
      title: task.title,
    }
  );

  return task;
};

Human translation:

1. Create task in MongoDB

2. Put a notification job in the queue

3. Return task

That is all your service is doing.

3. What does this line mean?
const task = await taskRepository.createTask({
  ...taskData,
  user: user._id,
});

Human translation:

Create the real task in MongoDB.

This part is normal. You already know it.

4. What does taskQueue.add() mean?
await taskQueue.add(
  "task-created-notification",
  {
    taskId: task._id.toString(),
    userId: user._id.toString(),
    title: task.title,
  }
);

Human translation:

Add a new piece of background work to the queue.

This does not send the notification itself.

It only says:

"Here is a job.
Someone should process it."
5. What is a Job?

This is the job:

{
  taskId: task._id.toString(),
  userId: user._id.toString(),
  title: task.title,
}

Human translation:

This is the information the Worker will need later.

So:

taskId

means:

Which task?

userId

means:

Which user?

title

means:

What is the task title?

6. What is the Queue?

You created:

const taskQueue = new Queue(
  "task-notifications",
  {
    connection: redisConnection,
  }
);

Human translation:

Create a queue called task-notifications.

Think only like this:

task-notifications
↓
jobs waiting

The Queue itself does not perform the work.

It only holds jobs waiting to be processed.

7. What is Redis doing?

This part:

connection: redisConnection

Human translation:

Store the queue jobs in Redis.

So:

taskQueue.add(...)
↓
Redis stores the job

Very important:

Queue = waiting line

Redis = where BullMQ keeps the waiting jobs

8. What is the Worker?

Your Worker starts like this:

const taskWorker = new Worker(
  "task-notifications",
  async (job) => {
    // do background work
  },
  {
    connection: redisConnection,
  }
);

Human translation:

Listen to the task-notifications queue.

When a job appears, take it and run this function.

So:

Redis has job
↓
Worker sees job
↓
Worker runs async (job) => {}
9. Why does Worker use the same name?

Queue:

new Queue("task-notifications")

Worker:

new Worker("task-notifications")

They must match.

Human translation:

Queue:
"Put jobs inside task-notifications"

Worker:
"I listen to task-notifications"

If the names are different, the Worker is listening to another queue.

10. What is job.data?

You added this:

await taskQueue.add(
  "task-created-notification",
  {
    taskId: task._id.toString(),
    title: task.title,
  }
);

Then Worker gets:

job.data

So inside Worker:

job.data.taskId

means:

Give me the taskId that the service put into the job.

And:

job.data.title

means:

Give me the task title from the job.

Simple flow:

Service:
queue.add({
  taskId,
  title
})

        ↓

Worker:
job.data.taskId
job.data.title

11. Your Worker code in simple form

Forget the bigger version for a moment.

Think of it like this:

const taskWorker = new Worker(
  "task-notifications",

  async (job) => {
    console.log(job.data);

    await new Promise((resolve) => {
      setTimeout(resolve, 3000);
    });

    console.log("Job finished");
  },

  {
    connection: redisConnection,
  }
);

Human translation:

A job comes in
↓
Read job.data
↓
Do the background work
↓
Finish

That is the Worker.

12. What happens when you POST a task?

You send:

POST /api/v1/tasks

Then:

Controller
↓
Service

Service does:

const task =
  await taskRepository.createTask(...);

Meaning:

Save task.

Then:

await taskQueue.add(...);

Meaning:

Save background job in Redis.

Then:

return task;

Meaning:

Give task back to controller.

Then controller sends:

res.status(201).json(...)

Meanwhile Worker processes the queued job separately.

Full code flow:

POST /tasks
↓
Controller
↓
taskService.createTask()
↓
MongoDB saves task
↓
taskQueue.add()
↓
Redis stores job
↓
return task
↓
201 response

Separate:

Redis
↓
Worker
↓
job.data
↓
background work

This is the single most important Day 14 flow.

13. Why do we use await taskQueue.add()?

This line:

await taskQueue.add(...)

can be confusing.

It means:

Wait until Redis has successfully stored the job.

It does not mean:

Wait until Worker finishes the job.

So:

await queue.add()
↓
job stored in Redis
↓
continue

NOT:

await queue.add()
↓
wait 3 seconds
↓
Worker finishes
↓
continue

14. What if Worker is OFF?

Suppose Worker is not running.

You create task.

Service still does:

await taskRepository.createTask(...);

Task goes to MongoDB.

Then:

await taskQueue.add(...);

Job goes to Redis.

But Worker is off.

So:

MongoDB
→ task exists

Redis
→ job waiting

Worker
→ off

Later Worker starts.

Then:

Redis
↓
Worker
↓
waiting job processed

This proves Worker is separate from your API.

15. API and Worker are two separate processes

API:

npm start

Human translation:

Run Express and receive HTTP requests.

Worker:

npm run worker:tasks

Human translation:

Run the process that waits for queue jobs.

So:

API
→ receives POST /tasks

Worker
→ processes task-notifications jobs

They are separate.

16. What are retries?

You can add:

await taskQueue.add(
  "task-created-notification",
  data,
  {
    attempts: 3,
  }
);

Human translation:

If Worker fails, BullMQ can try the job again.

attempt 1
↓
failed
↓
attempt 2
↓
failed
↓
attempt 3

attempts: 3

means:

Maximum 3 tries.

17. What is backoff?
backoff: {
  type: "exponential",
  delay: 1000,
}

Human translation:

Don't retry immediately. Wait before trying again.

So:

fail
↓
wait
↓
retry

Easy:

attempts
= how many tries

backoff
= waiting between tries

18. What is delay?
{
  delay: 10000
}

Human translation:

Don't let Worker process this job until about 10 seconds later.

So:

queue.add()
↓
Redis stores job
↓
wait 10 seconds
↓
Worker processes it

That's all delay means.

19. Don't worry about Redis cache yet

Your Day 14 file also talks about:

SET
GET
DEL
TTL
cache
sessions
rate limiting

You only need basic understanding.

For your BullMQ code, the important thing is:

Redis
= BullMQ's storage for jobs

You do not need to think about caching while trying to understand the Worker.

20. The code in plain English

This:

const taskQueue =
  new Queue(
    "task-notifications",
    {
      connection: redisConnection,
    }
  );

means:

Create a queue called task-notifications and store its jobs in Redis.

This:

await taskQueue.add(
  "task-created-notification",
  {
    taskId: task._id.toString(),
    title: task.title,
  }
);

means:

Add a notification job to that queue.

This:

new Worker(
  "task-notifications",
  async (job) => {
    // work
  }
);

means:

Listen to that queue and process its jobs.

This:

job.data.taskId

means:

Read taskId from the job.

This:

attempts: 3

means:

Try up to 3 times.

This:

delay: 10000

means:

Wait about 10 seconds before processing.

The only picture I want you to memorize
taskService.createTask()
        ↓
Create task in MongoDB
        ↓
taskQueue.add(...)
        ↓
Redis stores job
        ↓
Service returns task
        ↓
User gets 201


SEPARATELY:


Redis has job
      ↓
Worker gets job
      ↓
job.data
      ↓
Worker does background work
      ↓
completed

And the easiest sentence is:

taskQueue.add() puts work into Redis. Worker takes that work from Redis and performs it separately from the API request.

If you understand that sentence, you understand the core of Day 14.
// =================================
Day 14 — short version but little more detail
Background Jobs + Redis
Easy Short Version
1. First understand the problem

Normally when you create a task:

Postman
   ↓
Route
   ↓
Controller
   ↓
Service
   ↓
Repository
   ↓
MongoDB
   ↓
Response

Example:

Create task → save to MongoDB → return 201

This is your normal request flow.

But imagine after creating the task you also want to:

send email
send notification
generate report
resize image

If you do this:

await createTask();
await sendNotification();

and notification takes 4 seconds, the user waits 4 seconds.

Better:

Create task
   ↓
Add notification job to queue
   ↓
Return response immediately

Then separately:

Queue
  ↓
Worker
  ↓
Send notification
Easy rule

Ask:

Do I need this work finished before sending the response?

If yes:

normal request

If no:

background job

2. The 4 words you MUST understand ⭐
Job

A Job is one piece of work.

Example:

Send notification for Task 123

It may contain:

{
  taskId: "123",
  userId: "456",
  title: "Learn Redis"
}
Queue

A Queue is the waiting line.

Queue
├── Job 1
├── Job 2
├── Job 3
└── Job 4
Worker

A Worker takes jobs from the queue and performs them.

Queue
  ↓
Job
  ↓
Worker
  ↓
Do the work
Redis

Redis stores the queue/job information for BullMQ.

Easy memory:

Job    = work to do
Queue  = waiting line
Redis  = keeps the jobs
Worker = does the jobs

The most important sentence:

The API creates the job, Redis keeps the job, and the Worker performs the job.

3. What is Redis?

For now, think of Redis as a very fast temporary data store.

Basic idea:

KEY → VALUE

Example:

"name" → "Adam"
"user:123" → "Adam"

Think of it like a fast JavaScript object:

{
  name: "Adam",
  city: "Anaheim"
}

4. Basic Redis Commands

Remember only these first:

SET → save
GET → read
DEL → delete

Example:

SET name Adam
GET name
DEL name

That's enough basic Redis CRUD for your level.

5. TTL

TTL means:

Time To Live

It means:

How long should this Redis data exist?

Example:

SET verification-code 123456
EXPIRE verification-code 10

Means:

delete this key after 10 seconds

Or:

SET verification-code 123456 EX 10

Useful for:

verification codes
sessions
cache
rate limiting
temporary data

Easy memory:

Normal SET
→ stays until deleted

SET + TTL
→ disappears automatically later

6. Redis Cache

Cache means:

Temporary copy of data used to avoid slower work.

Without cache:

Request
  ↓
MongoDB
  ↓
Result

With Redis:

Request
  ↓
Redis
  ↓
Found?
  ↓ YES
Return quickly

If Redis doesn't have it:

Redis miss
   ↓
MongoDB
   ↓
Get data
   ↓
Save copy in Redis
   ↓
Return

Important:

MongoDB = main database
Redis cache = fast temporary copy

Redis does not replace MongoDB in your Task Manager.

7. Cache Invalidation

Imagine Redis has:

Task title = Learn Redis

Then MongoDB changes it to:

Learn BullMQ

Redis still has the old value.

So you may need:

DEL task:123

Then next request gets fresh data from MongoDB.

This is called:

Cache invalidation

Easy:

Database changes
      ↓
Cache may be old
      ↓
delete/update cache

8. What Is BullMQ?

BullMQ is the Node.js library that gives us:

Queues
Jobs
Workers
Retries
Delays
Scheduled jobs

It uses Redis underneath.

Install:

npm install bullmq

9. Redis Connection

You create:

config/redis.js

Its only job is basically:

"Redis is located here."

Example idea:

const redisConnection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT)
};

Important:

Inside Docker:

REDIS_HOST=redis

because redis is the Docker service name.

Outside Docker, localhost may be:

127.0.0.1

10. Queue

Create:

queues/taskQueue.js

Concept:

const taskQueue =
  new Queue("task-notifications", {
    connection: redisConnection
  });

Meaning:

Create a waiting line called task-notifications and use Redis to store its jobs.

Easy:

taskQueue.js
= defines the waiting line

11. Worker

Create:

workers/taskWorker.js

Worker listens to:

task-notifications

and processes jobs from that queue.

Important:

Queue name:
task-notifications

Worker name:
task-notifications

They must match.

Flow:

Queue
"task-notifications"
       ↓
Worker
"task-notifications"

12. job.data

When adding a job:

{
  taskId: "abc123",
  title: "Learn Redis"
}

Worker receives it through:

job.data

So:

job.data.taskId

gives:

abc123

and:

job.data.title

gives:

Learn Redis

Easy flow:

queue.add(DATA)
      ↓
Redis
      ↓
Worker
      ↓
job.data

13. API and Worker Are Different Processes ⭐

You run your API:

npm start

And Worker:

npm run worker:tasks

Think:

npm start
→ Express API keeps running

npm run worker:tasks
→ Worker keeps listening

So the Worker terminal staying open is normal.

It is waiting for jobs.

14. Docker Architecture

Your Docker setup becomes roughly:

MongoDB
Redis
API
Worker

Both API and Worker connect to Redis.

        Redis
       ↙     ↘
     API    Worker

But:

API
→ adds jobs

Worker
→ processes jobs

15. Add Background Job to Your Service

Your normal service first creates the task:

const task =
  await taskRepository.createTask(...);

Then:

await taskQueue.add(
  "task-created-notification",
  {
    taskId: task._id.toString(),
    userId: user._id.toString(),
    title: task.title
  }
);

Then:

return task;

New architecture:

Controller
   ↓
Service
 ↙     ↘
Repository Queue
   ↓       ↓
MongoDB   Redis
            ↓
          Worker

The controller does not need to change.

That's good architecture.

16. Why await queue.add()?

This confused many people.

await queue.add(...)

does not mean:

Wait until the Worker finishes.

It means:

Wait until Redis successfully accepts/stores the job.

So:

await queue.add()
→ wait for "job stored"

NOT:

wait for "job completed"

The API can return while the Worker is still working.

17. Most Important Test ⭐

Create a task.

You should receive the response quickly:

POST /tasks
    ↓
201 response

Meanwhile Worker:

Background job started
      ↓
3 seconds
      ↓
Notification processed
      ↓
Job completed

This proves the slow work is happening separately.

18. What If Worker Is OFF?

This is one of the most important concepts.

Suppose:

API    ON
Redis  ON
Worker OFF

Create task:

Task saved in MongoDB ✅

Job added to Redis ✅

Worker processing ❌

The job waits.

Then later:

Worker ON

Redis gives it the waiting job:

Redis
 ↓
Worker
 ↓
process job
 ↓
completed

This proves:

The Worker is separate from the API.

And:

Redis keeps the job while the Worker is unavailable.

19. Job States

Know these:

waiting
→ waiting for worker

active
→ worker is processing

completed
→ success

failed
→ error

delayed
→ waiting until later

Typical:

waiting
  ↓
active
  ↓
completed

or:

waiting
  ↓
active
  ↓
failed

20. Retries

Imagine email service fails temporarily.

Without retry:

Fail
 ↓
finished ❌

Better:

Fail
 ↓
wait
 ↓
try again

Example:

{
  attempts: 3
}

means:

try up to 3 times

21. Backoff

Backoff means:

How long to wait before retrying.

Example:

backoff: {
  type: "exponential",
  delay: 1000
}

Think roughly:

1 sec
2 sec
4 sec
...

Useful when:

email provider is down
external API overloaded
temporary service problem

Easy:

attempts
= how many tries

backoff
= wait between tries

22. Delayed Jobs

A delayed job means:

Don't process it yet.

Example:

{
  delay: 10000
}

means:

wait about 10 seconds

Flow:

Add job
  ↓
delayed
  ↓
10 seconds
  ↓
waiting
  ↓
Worker

Useful for reminders.

23. Scheduled Jobs

Scheduled jobs run automatically at a future/repeated time.

Examples:

Every morning
→ send reminders

Every Sunday
→ clean old data

Flow:

Scheduler
   ↓
creates job
   ↓
Queue
   ↓
Worker

You only need to understand this for now.

24. Other Redis Uses

Redis is not only for BullMQ.

Common uses:

Cache
Sessions
Rate limiting
Queues
Temporary codes
Counters

For sessions:

session:abc
→ userId
→ TTL 7 days

For rate limiting:

rate-limit:IP
→ count
→ TTL 15 minutes

In bigger systems, multiple API servers can share the same Redis counters.

25. BullMQ Manages Redis for You

You normally do NOT manually create BullMQ Redis keys.

You just use:

queue.add()

and:

new Worker()

BullMQ handles the queue information in Redis.

26. Never Put Secrets in Job Data ⭐

Bad:

queue.add("email", {
  password,
  accessToken,
  refreshToken
});

Why?

Because job data goes into Redis.

Avoid:

passwords
JWT secrets
access tokens
refresh tokens
credit cards
API secrets

Better:

{
  userId,
  taskId
}

27. Keep Job Data Small

Bad:

{
  hugeUserObject,
  hugeTaskArray,
  hugeSettingsObject
}

Better:

{
  userId: "123"
}

Then the Worker can fetch what it needs.

Easy rule:

Put enough information in the job to identify the work, not your entire application state.

28. Idempotency ⭐

Retries mean a job might run more than once.

Imagine:

Charge $100

Job succeeds, but system thinks it failed and retries:

$100
+
$100
=
$200 ❌

So ask:

If this job runs twice, will something bad happen?

That is the basic idea of:

Idempotency

You only need the concept for now.

29. Real Problem: MongoDB Success, Redis Failure

Your code does:

Create task in MongoDB
      ↓
queue.add()

Imagine:

MongoDB ✅
Redis ❌

The task may exist, but queueing fails.

This is a real distributed-systems problem.

For now just understand:

Saving to MongoDB and adding to Redis are two separate operations.

You do not need advanced solutions like Transactional Outbox yet.

30. Graceful Worker Shutdown

Instead of instantly killing the Worker:

Kill Worker immediately ❌

you can tell it:

finish/close cleanly ✅

That's called:

Graceful shutdown

You should understand the idea; don't memorize the code yet.

31. async/await Is NOT a Background Job

This:

await sendEmail();

means:

wait here until email finishes

This:

await queue.add(...);

means:

store job so another Worker can do it

So:

async/await
≠
background jobs

Very important.

32. setTimeout Is NOT a Proper Queue

This:

setTimeout(() => {
  sendEmail();
}, 10000);

runs inside your Node process.

If Node crashes:

timer can disappear

With BullMQ + Redis:

job exists in Redis

so it can survive separately from the API process.

33. When Should You Use Background Jobs?

Good examples:

send email
send notification
resize image
generate PDF
generate report
scheduled reminders
large processing
external API retry

Usually NOT for:

password validation
authorization
finding data needed now
creating required database record

Main rule:

Do I need this result before responding to the user?

If no, it may be a good background job.

⭐ Final Architecture
Normal request
Postman
   ↓
Route
   ↓
Middleware
   ↓
Controller
   ↓
Service
   ↓
Repository
   ↓
MongoDB
   ↓
Response
Background side
Service
   ↓
queue.add()
   ↓
BullMQ Queue
   ↓
Redis
   ↓
Worker
   ↓
Background work
   ↓
Completed / Failed / Retry

⭐ Redis Memory Sheet
Redis
├── Key/Value
│   SET / GET / DEL
│
├── TTL
│   temporary data
│
├── Cache
│   fast temporary copy
│
├── Sessions
│   temporary session state
│
├── Rate limiting
│   counters
│
├── Queues
│   BullMQ jobs
│
└── Cache invalidation
    delete stale data

You do NOT need to become a Redis expert yet.

⭐ BullMQ Memory Sheet
Job
= work

Queue
= waiting line

Redis
= stores queue/job information

Worker
= performs work

attempts
= number of tries

backoff
= wait between retries

delay
= run later

scheduler
= create jobs automatically later/repeatedly

⭐ The 5 Most Important Things to Understand
Background jobs are for work the user does not need to wait for.
BullMQ uses Redis to keep jobs.
The API adds jobs; the Worker performs them.
If the Worker stops, Redis can keep the job waiting until the Worker comes back.
await queue.add() waits only until the job is queued — not until the Worker finishes.

If you understand those five points plus Job → Queue → Redis → Worker, you already understand the hardest part of Day 14 at a strong-junior level.

// =================================================
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅
✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅

Day 15 