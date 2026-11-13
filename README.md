# NITUME Delivery App

NITUME is a responsive web application for requesting shopping, errands,
and simple delivery services in **Ruaka and Gathigi Estate, Kenya**.
Customers can submit and track requests, receive notifications, and pay
through M-Pesa. An administrator manages incoming requests, shopping
costs, delivery progress, and service settings.

This README is based on the project structure and implementation details
established during development. Check the repository's current source
files and deployment environment before changing production
configuration: some provider-specific values (especially Firebase web
configuration and production Daraja credentials) are intentionally not
reproduced here.

------------------------------------------------------------------------

## Contents

-   [Project overview](#project-overview)
-   [Main features](#main-features)
-   [Technology](#technology)
-   [Repository layout](#repository-layout)
-   [Requirements](#requirements)
-   [Run locally](#run-locally)
-   [Environment configuration](#environment-configuration)
-   [How the application works](#how-the-application-works)
-   [Order lifecycle](#order-lifecycle)
-   [M-Pesa payments](#m-pesa-payments)
-   [Notifications](#notifications)
-   [Customer support](#customer-support)
-   [Deployment](#deployment)
-   [Operational checklist](#operational-checklist)
-   [Troubleshooting](#troubleshooting)
-   [Security and maintenance](#security-and-maintenance)

## Project overview

NITUME provides a single web experience that works on desktop and mobile
browsers. The public home page can be viewed without signing in.
Authentication is required when a visitor enters protected customer or
administrator functions.

The service is designed around a local delivery operation:

-   **Service area:** Ruaka and Gathigi Estate.
-   **Service types:** shopping, errands, and simple delivery requests.
-   **Pricing:** the cost of items purchased for a customer is separate
    from the NITUME delivery fee.
-   **Payments:** M-Pesa STK Push, with payment confirmation controlled
    by the verified Safaricom callback rather than a manual admin
    override.

## Main features

### Customer experience

-   Public home page and service information.
-   Firebase-backed registration and login.
-   Submit a shopping, errand, or delivery request.
-   View and track orders.
-   Edit or cancel an order while it is still `PENDING`.
-   View the shopping cost, delivery fee, and total separately.
-   Pay using M-Pesa STK Push when an order is ready for delivery.
-   Receive in-app and push notifications where browser/device
    permissions allow.
-   Community, profile/details, settings, and help/support pages.
-   Responsive desktop navigation and mobile bottom navigation.

### Administrator experience

-   View incoming and active orders.
-   Accept or reject pending requests.
-   Progress accepted orders through shopping and ready-for-delivery.
-   Enter the shopping cost when shopping is complete.
-   Configure whether requests are being accepted.
-   Configure the operating weather mode (`NORMAL` or `RAIN`).
-   Review payment state; successful M-Pesa payment is confirmed by the
    callback integration.

## Technology

The application uses:

-   **Frontend:** React and Vite.
-   **Routing:** React Router.
-   **Authentication:** Firebase Authentication.
-   **Backend:** Node.js and Express.
-   **Database:** MongoDB with Mongoose.
-   **Push notifications:** Firebase Cloud Messaging (FCM) and a service
    worker.
-   **Payments:** Safaricom Daraja M-Pesa STK Push.
-   **Frontend hosting:** Vercel.
-   **Backend hosting:** Render.

Known deployment endpoints:

  ------------------------------------------------------------------------------------------------------
  Component                           Address
  ----------------------------------- ------------------------------------------------------------------
  Frontend                            `https://delivery-one-smoky.vercel.app`

  Backend                             `https://delivery-y1yc.onrender.com`

  Backend health check                `https://delivery-y1yc.onrender.com/health`

  M-Pesa callback                     `https://delivery-y1yc.onrender.com/api/payments/mpesa/callback`
  ------------------------------------------------------------------------------------------------------

The health endpoint should be checked against the current backend
implementation if the route changes.

## Repository layout

The project has a frontend and backend in one repository. The main
working directory used during development was `~/delivery-app`.

``` text
delivery-app/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Request.jsx
│   │   ├── Orders.jsx
│   │   ├── Community.jsx
│   │   ├── Settings.jsx
│   │   ├── Help.jsx
│   │   ├── services/
│   │   │   ├── api.jsx
│   │   │   └── support.js
│   │   └── context/
│   │       └── AuthContext.jsx
│   └── public/
│       └── [static assets and service worker]
└── backend/
    ├── server.js
    ├── config/
    ├── middleware/
    ├── models/
    ├── routes/
    └── services/
```

This is an indicative layout, not a complete file manifest. Use the
actual repository tree as the authority if files have since been renamed
or added.

## Requirements

Install the following on your development machine:

-   Node.js (use a current supported LTS release).
-   npm.
-   Git.
-   A MongoDB database (MongoDB Atlas is used for the deployed
    application).
-   A Firebase project with Authentication enabled.
-   Firebase Admin credentials for the backend.
-   Safaricom Daraja credentials for M-Pesa testing and, separately,
    production use.

You also need access to the Vercel and Render projects to deploy
changes.

## Run locally

### 1. Get the source

``` bash
git clone https://github.com/Mainascode/delivery.git
cd delivery-app
```

If the cloned directory has a different name, `cd` into that directory
instead.

### 2. Configure the backend

``` bash
cd backend
npm install
```

Create a local `.env` file in `backend/`. Do not commit it. Add the
backend variables listed in [Environment
configuration](#environment-configuration).

Start the backend using the project's configured start script:

``` bash
npm start
```

The deployed backend has used `node server.js` as its start command. If
`npm start` is not defined in the local `backend/package.json`, run:

``` bash
node server.js
```

Keep this terminal running.

### 3. Configure the frontend

Open a second terminal:

``` bash
cd frontend
npm install
```

Create `frontend/.env` (or the environment file convention used by the
Vite project). Set the backend URL and the Firebase web configuration
variables required by the Firebase initialization module.

For local development, the API base URL is typically:

``` dotenv
VITE_API_URL=http://localhost:5000
```

Use the actual port configured by `backend/server.js`. The deployed
frontend has used:

``` dotenv
VITE_API_URL=https://delivery-y1yc.onrender.com
```

The support phone can be overridden with:

``` dotenv
VITE_SUPPORT_PHONE=254100619652
```

Start Vite:

``` bash
npm run dev
```

Open the local URL printed by Vite, commonly `http://localhost:5173`.

### 4. Build the frontend

``` bash
cd frontend
npm run build
```

Vite normally writes the production build to `frontend/dist/`. Resolve
build errors before deploying.

### 5. Check available scripts

The exact scripts are defined by each package's `package.json`. To see
them:

``` bash
cd frontend && npm run
cd ../backend && npm run
```

Do not assume a script exists if it is not listed.

## Environment configuration

**Never put real secrets in this README, source control, screenshots, or
frontend variables.** Vite variables prefixed with `VITE_` are exposed
to the browser bundle and must not contain private keys or passwords.

### Frontend

  -----------------------------------------------------------------------
  Variable                            Purpose
  ----------------------------------- -----------------------------------
  `VITE_API_URL`                      Backend API base URL. Use the local
                                      backend URL during local
                                      development and the Render URL in
                                      production.

  `VITE_SUPPORT_PHONE`                Optional customer support number.
                                      The implementation defaults to
                                      `254100619652` if unset.

  Firebase `VITE_...` variables       Public Firebase web-app
                                      configuration used by the frontend
                                      Firebase initialization code. Use
                                      the exact variable names already
                                      referenced by that code.
  -----------------------------------------------------------------------

Firebase web configuration is not the same as a Firebase Admin private
key. Do not put a service-account private key in the frontend.

### Backend

The following backend configuration names have been used by the M-Pesa
integration or deployment:

  ------------------------------------------------------------------------
  Variable                            Purpose
  ----------------------------------- ------------------------------------
  `MONGODB_URI`                       MongoDB connection string.

  `MPESA_ENV`                         Daraja environment, such as
                                      `sandbox` during testing.

  `MPESA_CONSUMER_KEY`                Daraja consumer key.

  `MPESA_CONSUMER_SECRET`             Daraja consumer secret.

  `MPESA_SHORTCODE`                   Shortcode/till/paybill value
                                      configured for the integration.

  `MPESA_PASSKEY`                     Daraja STK Push passkey.

  `MPESA_CALLBACK_URL`                Public HTTPS callback endpoint
                                      reachable by Safaricom.

  Firebase Admin configuration        Credentials/configuration used by
                                      the backend Firebase Admin
                                      initialization. Follow the exact
                                      names and format in
                                      `backend/config/firebaseAdmin.js`.
  ------------------------------------------------------------------------

The STK transaction type has defaulted to `CustomerPayBillOnline` in the
implementation discussed during development. Do not add a new
environment variable for it unless the current source code has been
changed to read one.

For local sandbox testing, the callback URL must point to a publicly
reachable HTTPS backend endpoint. A local `localhost` URL cannot receive
Safaricom callbacks directly.

### Where to configure production variables

-   **Local:** put private values in ignored `.env` files.
-   **Render:** add backend variables in the Render service's
    Environment settings.
-   **Vercel:** add frontend variables in the Vercel project's
    Environment Variables settings, then redeploy after changing them.

Keep sandbox and production credentials separate. Do not switch
`MPESA_ENV` to production until the live Daraja setup and callback have
been verified.

## How the application works

### Authentication

Firebase Authentication handles customer sign-in. The frontend API
service obtains the signed-in user's Firebase ID token and sends it to
the backend as a Bearer token:

``` http
Authorization: Bearer <Firebase-ID-token>
```

Protected backend routes validate the token through the authentication
middleware. Administrator routes additionally enforce the administrator
role. Never rely only on hiding admin links in the frontend;
authorization must be enforced by the backend.

### API and database

The React frontend calls the Express API using `VITE_API_URL`. The
backend uses Mongoose to read and write MongoDB documents. The backend
can report that it is running without MongoDB configured in some
development situations, but normal order, user, and payment operations
require a working database connection.

### Pricing

The customer's total is calculated from two separate values:

``` text
totalAmount = shoppingCost + deliveryFee
```

-   `shoppingCost` is the cost of goods purchased for the customer.
-   `deliveryFee` is NITUME's service/delivery charge.
-   `totalAmount` is the amount due from the customer.

Do not combine the shopping cost and delivery fee into one field when
entering or explaining an order.

## Order lifecycle

The order statuses used by the application are:

  -----------------------------------------------------------------------
  Status                              Meaning
  ----------------------------------- -----------------------------------
  `PENDING`                           Customer has submitted the request;
                                      it awaits admin action.

  `ACCEPTED`                          Admin has accepted the request.

  `SHOPPING`                          The request is being worked on /
                                      shopping is in progress.

  `READY_FOR_DELIVERY`                Shopping is complete, the cost is
                                      known, and the order is ready for
                                      delivery/payment.

  `COMPLETED`                         The order has been completed.

  `CANCELLED`                         The order has been cancelled.

  `REJECTED`                          The request was rejected.
  -----------------------------------------------------------------------

The intended admin transitions are:

``` text
PENDING
  ├── ACCEPTED
  ├── REJECTED
  └── CANCELLED

ACCEPTED
  ├── SHOPPING
  └── CANCELLED

SHOPPING
  ├── READY_FOR_DELIVERY
  └── CANCELLED

READY_FOR_DELIVERY
  └── CANCELLED
```

After verified payment, the customer completion flow can mark a ready
order as `COMPLETED`, subject to the backend's completion checks.

Operational notes:

-   Customers can edit or cancel an order only while it is `PENDING`.
-   The application prevents a customer from creating a second active
    order while one is already in progress.
-   Cancelled and rejected orders are excluded from the normal customer
    active-order list/detail experience.
-   The admin dashboard treats pending requests as incoming work and
    accepted/shopping/ready orders as active work.
-   The backend must remain the authority for allowed status
    transitions.

## M-Pesa payments

NITUME uses Safaricom Daraja STK Push. The customer initiates payment
from an eligible order using the phone number entered in the payment
interface. Kenyan phone numbers are normalized to the `254...` format
before the STK request.

### Payment flow

1.  Admin moves the order through the workflow and enters the shopping
    cost.
2.  The backend calculates the total using shopping cost plus delivery
    fee.
3.  When the order is `READY_FOR_DELIVERY`, the customer can request an
    STK Push.
4.  The backend sends the STK request to Daraja.
5.  Safaricom prompts the customer's phone.
6.  Safaricom sends the result to the configured public callback URL.
7.  The backend matches the callback to the initiated payment and
    validates the result.
8.  Only a verified successful callback confirms the order payment.
9.  The frontend polls payment status and refreshes the order state.

Relevant routes established during development:

  --------------------------------------------------------------------------------
  Method                  Route                            Purpose
  ----------------------- -------------------------------- -----------------------
  `POST`                  `/api/orders/:id/stk-push`       Initiate an STK Push
                                                           for an eligible order.

  `GET`                   `/api/orders/:id/payment`        Check the payment
                                                           status for an order.

  `POST`                  `/api/payments/mpesa/callback`   Receive Safaricom's
                                                           server-to-server
                                                           callback.
  --------------------------------------------------------------------------------

The callback is intentionally public to Safaricom; it must not require
Firebase user authentication. Protect it through the payment
matching/validation logic and do not expose an admin-only manual
confirmation path as a substitute.

### Payment states

The payment record can use states including:

-   `INITIATED`
-   `PENDING`
-   `SUCCESS`
-   `FAILED`
-   `CANCELLED`
-   `TIMEOUT`
-   `REVIEW_REQUIRED`

The order-level payment state includes:

-   `UNPAID`
-   `CUSTOMER_MARKED_PAID`
-   `CONFIRMED`

A customer-marked-paid state is not proof of payment. The production
business rule is that only a verified M-Pesa callback can set payment to
confirmed. The manual admin payment confirmation endpoint was
deliberately disabled in the implementation discussed during
development.

### Testing safely

-   Keep `MPESA_ENV=sandbox` while testing with sandbox credentials.
-   Verify that the callback URL is publicly accessible over HTTPS.
-   Use the Daraja sandbox tools and test values intended for the
    sandbox environment.
-   Check Render logs and the payment record when an STK request does
    not complete.
-   A failed callback (for example, insufficient funds) is a failed
    payment, not a successful one. The customer should be able to retry
    after resolving the cause.
-   A timeout or missing callback must not be treated as payment
    success.
-   Do not manually edit a payment record to simulate a successful
    production transaction.
-   Do not send fabricated callbacks to the live endpoint.

### Going live

Before changing to production:

1.  Complete the required Safaricom/Daraja production onboarding for the
    correct business shortcode/till arrangement.
2.  Obtain the production consumer key, consumer secret, passkey, and
    required shortcode configuration from Safaricom.
3.  Confirm the transaction type supported by the live account. The
    existing default was `CustomerPayBillOnline`; confirm it is correct
    for the provisioned shortcode/till rather than assuming.
4.  Configure the production callback URL and ensure it is reachable
    from the public internet.
5.  Add production credentials to Render's protected environment
    settings.
6.  Set the environment to production only after the credentials and
    account setup are approved.
7.  Perform a controlled, low-value real payment and verify the
    callback, payment record, order confirmation, and customer UI end to
    end.
8.  Monitor logs and reconcile the first live transactions.

A physical till number alone does not establish that the Daraja
production API credentials and transaction configuration are ready.

## Notifications

The application uses Firebase Cloud Messaging for browser push
notifications and an in-app notification flow.

Implementation details established during development:

-   The frontend registers messaging tokens and sends them to the
    backend.
-   The backend stores device tokens on the user record.
-   Notification preferences are represented by the user's
    `notificationsEnabled` setting.
-   The frontend polls the notifications API periodically (the
    implementation discussed used a 30-second interval).
-   Foreground notifications are shown in the app as a toast.
-   The service worker handles background push notifications.
-   Notification types include order-ready and payment-related events
    such as `READY_FOR_DELIVERY`, `PAYMENT_CONFIRMED`, and
    `PAYMENT_SUBMITTED`.

For push notifications to work, verify all of the following:

-   Firebase Cloud Messaging is enabled for the Firebase project.
-   The frontend Firebase configuration is correct.
-   The VAPID public key is configured in the frontend where the
    messaging token is requested.
-   The service worker is served from the correct public path and loads
    the compatible Firebase messaging libraries expected by the project.
-   The backend Firebase Admin credentials are valid.
-   The browser has permission to show notifications.
-   The token registration and notification API requests are
    authenticated correctly.

Push delivery is subject to browser support, permission settings, device
settings, and network availability. In-app notification history and
browser push are related but distinct mechanisms.

## Customer support

The support contact configured during development is:

-   **Phone:** `+254 100 619652`
-   **WhatsApp:** `https://wa.me/254100619652`
-   **Phone link:** `tel:+254100619652`

The Help page provides WhatsApp and call actions, including a prefilled
message for order-related assistance. The phone number can be overridden
with `VITE_SUPPORT_PHONE`.

If the support number changes, update the environment variable or the
default in `frontend/src/services/support.js`, then rebuild and redeploy
the frontend.

## Deployment

### Backend on Render

The deployed backend has used:

-   Root directory: `backend` (if the Render service is configured for
    the monorepo root, adjust commands accordingly).
-   Runtime: Node.js.
-   Start command: `node server.js`.
-   Database: MongoDB Atlas via `MONGODB_URI`.

Deployment procedure:

1.  Push the reviewed changes to the GitHub repository.
2.  Confirm the Render service's root directory and build/start commands
    match the repository layout.
3.  Confirm all required environment variables are set in Render.
4.  Deploy the latest commit.
5.  Check the Render deployment logs for startup errors and successful
    database connection.
6.  Open the health endpoint.
7.  Test authentication, order creation, admin status updates,
    notifications, and payment endpoints.

Do not paste environment secrets into commit messages, issue trackers,
or logs.

### Frontend on Vercel

The frontend is a Vite application.

Typical Vercel configuration for a monorepo with the frontend as the
project root:

-   Root directory: `frontend`
-   Build command: `npm run build`
-   Output directory: `dist`

Set `VITE_API_URL` to the deployed Render backend URL and set the
Firebase web configuration variables required by the frontend source.

After changing Vite environment variables, trigger a new deployment
because Vite embeds them in the built frontend.

### React Router refresh handling

Because the app uses client-side routes, the hosting platform must serve
the SPA entry point for routes such as `/settings`, `/orders`, and
`/help` when a visitor refreshes or opens a deep link directly. If
Vercel returns `404 NOT_FOUND` for a valid frontend route, configure a
Vercel rewrite to serve `/index.html` for application routes, then
redeploy.

## Operational checklist

### Before opening the service

-   [ ] Public home page loads on desktop and mobile.
-   [ ] Registration and login work.
-   [ ] Protected customer pages redirect unauthenticated visitors to
    login.
-   [ ] Admin routes are protected by backend role checks.
-   [ ] Customer can submit a request with a valid location and request
    description.
-   [ ] Admin can accept, reject, and progress an order through valid
    transitions.
-   [ ] Shopping cost and delivery fee remain separate and total
    correctly.
-   [ ] Customer can see order status changes.
-   [ ] Customer can initiate an M-Pesa payment only when the order is
    eligible.
-   [ ] Failed and timed-out payments remain unconfirmed and can be
    retried safely.
-   [ ] Successful callback confirms the correct payment and order.
-   [ ] Customer can complete an order only when backend payment checks
    pass.
-   [ ] WhatsApp and phone support links open the correct contact.
-   [ ] Notifications work where permissions and device support allow.
-   [ ] Settings for accepting requests and weather mode behave as
    expected.
-   [ ] Vercel deep links and refreshes work.
-   [ ] Render health endpoint and database connection are healthy.
-   [ ] Production credentials are kept out of Git.

### Routine operations

-   Monitor new pending orders and active orders.
-   Keep order statuses accurate.
-   Enter the actual shopping cost before requesting payment.
-   Investigate `REVIEW_REQUIRED` payment records before taking action.
-   Reconcile successful payments with Safaricom records.
-   Check Render logs for callback, database, and notification failures.
-   Review customer support messages and calls.
-   Back up MongoDB data according to the chosen Atlas plan and
    retention policy.

## Troubleshooting

### Frontend cannot reach the backend

1.  Check `VITE_API_URL`.
2.  Confirm the Render service is running.
3.  Open the backend health endpoint.
4.  Check browser developer tools for the failing request and response.
5.  Check Render logs for server errors and CORS configuration.
6.  Rebuild/redeploy Vercel after changing a `VITE_` variable.

### Login works but protected API requests return 401

-   Confirm the frontend sends a current Firebase ID token in the
    `Authorization: Bearer ...` header.
-   Confirm Firebase project configuration matches the backend Firebase
    Admin project.
-   Check backend authentication middleware and Render Firebase Admin
    configuration.
-   Sign out and sign in again if the browser is using an expired
    session.

### Admin page is inaccessible

-   Confirm the user has the administrator role in the backend user
    record.
-   Confirm backend admin middleware is applied to the relevant routes.
-   Do not attempt to solve an authorization issue only by changing
    frontend navigation.

### MongoDB connection fails

-   Check `MONGODB_URI` in the environment where the backend is running.
-   Confirm the Atlas database user and password are correct.
-   Confirm Atlas network access permits the Render service.
-   Check Render logs for the Mongoose connection error.
-   Never print the full connection string in a public log or support
    message.

### M-Pesa prompt does not appear

-   Confirm the order is `READY_FOR_DELIVERY` and unpaid.
-   Confirm the phone number is normalized to a valid Kenyan `254...`
    number.
-   Check the Daraja environment and credentials.
-   Check Render logs for the STK request response.
-   Verify the shortcode, passkey, and transaction type match the Daraja
    environment.
-   Confirm the callback URL is publicly reachable over HTTPS.
-   Check the payment record and callback logs before retrying.

### M-Pesa reports failed or timed out

A failed or timed-out request is not a confirmed payment. Read the
Safaricom result code/description and the matching payment record. The
customer should retry only after the cause has been addressed. Never
mark an order paid merely because the customer received an STK prompt.

### Notifications are not arriving

-   Check browser notification permission and device-level notification
    settings.
-   Confirm the FCM VAPID public key is set in the frontend.
-   Confirm the service worker is registered and served successfully.
-   Confirm the frontend can register its token with the authenticated
    backend endpoint.
-   Confirm Firebase Admin credentials and FCM configuration.
-   Check browser console and Render logs for 401, token, or messaging
    errors.

### Refreshing a route returns 404 on Vercel

Configure the Vercel SPA rewrite so valid client-side routes resolve to
`index.html`. Redeploy and test direct navigation to `/settings`,
`/orders`, and `/help`.

## Security and maintenance

-   Keep `.env` files out of Git. Ensure `.env`, `.env.*` files
    containing secrets, service-account JSON files, and local credential
    files are ignored.
-   If a secret is ever committed or shared, rotate it with the relevant
    provider; deleting it from the latest commit is not enough.
-   Never expose Daraja consumer secrets, passkeys, Firebase Admin
    private keys, MongoDB credentials, or private signing keys in
    frontend code.
-   Validate user input on the backend, not only in React forms.
-   Enforce authentication and role authorization on protected API
    routes.
-   Enforce order state transitions and payment eligibility on the
    backend.
-   Treat Safaricom callbacks as untrusted input until the callback is
    matched to a known payment and all expected values are validated.
-   Keep duplicate callback handling idempotent so the same transaction
    cannot be applied twice.
-   Do not let a customer-supplied status or payment claim confirm an
    order.
-   Use HTTPS for deployed frontend, API, and payment callback traffic.
-   Review dependencies and update them deliberately; test the order and
    payment workflows after upgrades.
-   Back up the database and periodically test that backups can be
    restored.

------------------------------------------------------------------------

## Important implementation note

This guide documents the architecture and workflows established during
development, but it is not a substitute for the live source code. Before
a production change, verify the exact route names, package scripts,
Firebase variable names, Render root directory, Vercel project settings,
and current Daraja requirements in the repository and provider
dashboards. Do not invent missing configuration values or copy secrets
into this document.
