
function mpesaError(message, safeToRetry = true) {
  const error = new Error(message);
  error.safeToRetry = safeToRetry;
  return error;
}

const getBaseUrl = () => {
  if (process.env.MPESA_ENV === "production") {
    return "https://api.safaricom.co.ke";
  }

  return "https://sandbox.safaricom.co.ke";
};

function requiredEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw mpesaError(`Missing environment variable: ${name}`, true);
  }

  return value;
}

export function normalizeKenyanPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (/^07\d{8}$/.test(digits) || /^01\d{8}$/.test(digits)) {
    return `254${digits.slice(1)}`;
  }

  if (/^2547\d{8}$/.test(digits) || /^2541\d{8}$/.test(digits)) {
    return digits;
  }

  if (/^\+254[17]\d{8}$/.test(String(value || "").trim())) {
    return String(value).trim().replace("+", "");
  }

  throw new Error("Enter a valid Kenyan Safaricom phone number.");
}

export async function getMpesaAccessToken() {
  const key = requiredEnv("MPESA_CONSUMER_KEY");
  const secret = requiredEnv("MPESA_CONSUMER_SECRET");

  const credentials = Buffer.from(`${key}:${secret}`).toString("base64");

  let response;
  let data;

  try {
    response = await fetch(
      `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${credentials}`,
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    data = await response.json();
  } catch (error) {
    throw mpesaError(
      "Unable to authenticate with M-Pesa. No STK payment request was sent.",
      true
    );
  }

  if (!response.ok || !data?.access_token) {
    console.error("Daraja OAuth error:", data);
    throw mpesaError(
      "Unable to authenticate with M-Pesa. No STK payment request was sent.",
      true
    );
  }

  return data.access_token;
}

export async function initiateStkPush({
  phoneNumber,
  amount,
  orderId,
}) {
  const shortcode = requiredEnv("MPESA_SHORTCODE");
  const passkey = requiredEnv("MPESA_PASSKEY");
  const callbackUrl = requiredEnv("MPESA_CALLBACK_URL");

  if (!callbackUrl.startsWith("https://")) {
    throw mpesaError("M-Pesa callback URL must use HTTPS.", true);
  }

  if (!Number.isSafeInteger(amount) || amount < 1) {
    throw mpesaError("Payment amount must be a positive whole number.", true);
  }

  const phone = normalizeKenyanPhone(phoneNumber);

  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:Z.]/g, "")
    .slice(0, 14);

  const password = Buffer.from(
    `${shortcode}${passkey}${timestamp}`
  ).toString("base64");

  // OAuth happens before STK initiation. Its failure is safe to retry
  // because no customer payment prompt has been submitted.
  const accessToken = await getMpesaAccessToken();

  const transactionType =
    process.env.MPESA_TRANSACTION_TYPE || "CustomerPayBillOnline";

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: transactionType,
    Amount: amount,
    PartyA: phone,
    PartyB: shortcode,
    PhoneNumber: phone,
    CallBackURL: callbackUrl,
    AccountReference: `NITUME${String(orderId).slice(-8)}`,
    TransactionDesc: "NITUME delivery order",
  };

  let response;

  try {
    response = await fetch(
      `${getBaseUrl()}/mpesa/stkpush/v1/processrequest`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000),
      }
    );
  } catch (error) {
    // Safaricom may have received the request even if our connection
    // timed out or disconnected before we received its response.
    throw mpesaError(
      "The M-Pesa request outcome is unknown. Safaricom may have received it.",
      false
    );
  }

  let data;

  try {
    data = await response.json();
  } catch (error) {
    throw mpesaError(
      "Safaricom's STK response could not be read. The request outcome is unknown.",
      false
    );
  }

  if (!response.ok) {
    console.error("Daraja STK HTTP error:", data);

    throw mpesaError(
      data?.errorMessage ||
        data?.ResponseDescription ||
        "Safaricom rejected the STK request.",
      response.status < 500
    );
  }

  if (String(data?.ResponseCode) !== "0") {
    console.error("Daraja STK initiation rejected:", data);

    // An explicit Daraja rejection is a definite unsuccessful initiation.
    if (data?.ResponseCode !== undefined && data?.ResponseCode !== null) {
      throw mpesaError(
        data?.errorMessage ||
          data?.ResponseDescription ||
          "M-Pesa could not initiate the payment.",
        true
      );
    }

    // A success-shaped response without a checkout ID is ambiguous.
    throw mpesaError(
      "Safaricom returned an incomplete STK response. The request outcome is unknown.",
      false
    );
  }

  if (!data.CheckoutRequestID) {
    throw mpesaError(
      "Safaricom accepted the request but did not return a checkout ID. Reconciliation is required.",
      false
    );
  }

  return {
    merchantRequestId: data.MerchantRequestID,
    checkoutRequestId: data.CheckoutRequestID,
    customerMessage: data.CustomerMessage || "Payment prompt sent.",
  };
}

export function parseMpesaCallback(body) {
  const callback = body?.Body?.stkCallback;

  if (
    !callback ||
    typeof callback.CheckoutRequestID !== "string" ||
    callback.CheckoutRequestID.length === 0
  ) {
    throw new Error("Invalid M-Pesa callback.");
  }

  const items = callback.CallbackMetadata?.Item || [];

  const metadata = {};

  for (const item of items) {
    if (item?.Name) {
      metadata[item.Name] = item.Value;
    }
  }

  return {
    checkoutRequestId: callback.CheckoutRequestID,
    merchantRequestId: callback.MerchantRequestID || null,
    resultCode: Number(callback.ResultCode),
    resultDescription: String(callback.ResultDesc || ""),
    amount: Number(metadata.Amount),
    receiptNumber: metadata.MpesaReceiptNumber
      ? String(metadata.MpesaReceiptNumber)
      : null,
    phoneNumber: metadata.PhoneNumber
      ? String(metadata.PhoneNumber)
      : null,
    transactionDate: metadata.TransactionDate
      ? String(metadata.TransactionDate)
      : null,
  };
}
