// Minimal Pesapal API 3.0 client: auth token, IPN registration, order submission and status checks.
// Docs: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json/api-reference

export class PesapalError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// GetTransactionStatus status_code values.
export const pesapalStatus = { invalid: 0, completed: 1, failed: 2, reversed: 3 };

export function createPesapalClient(config, { fetch: fetchImpl = fetch } = {}) {
  let cachedToken = null;
  let ipnIdPromise = null;

  async function call(path, { method = "GET", token, body } = {}) {
    let response;
    try {
      response = await fetchImpl(`${config.baseUrl}${path}`, {
        method,
        headers: { Accept: "application/json", "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(20000)
      });
    } catch (error) {
      throw new PesapalError(`Could not reach Pesapal: ${error.message}`);
    }
    const raw = await response.text();
    let data;
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw }; }
    // Pesapal often reports errors with HTTP 200 and an `error` object in the body.
    const error = data?.error;
    if (!response.ok || (error && (error.code || error.message))) {
      throw new PesapalError(error?.message || error?.code || `Pesapal request failed (${response.status})`, { status: response.status, body: data });
    }
    return data;
  }

  async function token() {
    if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
    const data = await call("/api/Auth/RequestToken", { method: "POST", body: { consumer_key: config.consumerKey, consumer_secret: config.consumerSecret } });
    if (!data.token) throw new PesapalError("Pesapal did not return an access token", { body: data });
    // Tokens last 5 minutes; refresh 30 seconds early so one never expires mid-request.
    const expiry = Date.parse(data.expiryDate);
    cachedToken = { value: data.token, expiresAt: (Number.isNaN(expiry) ? Date.now() + 5 * 60 * 1000 : expiry) - 30 * 1000 };
    return cachedToken.value;
  }

  async function lookUpOrRegisterIpn(url) {
    const auth = await token();
    const list = await call("/api/URLSetup/GetIpnList", { token: auth });
    const existing = Array.isArray(list) && list.find((entry) => entry.url === url && entry.ipn_id);
    if (existing) return existing.ipn_id;
    const created = await call("/api/URLSetup/RegisterIPN", { method: "POST", token: auth, body: { url, ipn_notification_type: "GET" } });
    if (!created.ipn_id) throw new PesapalError("Pesapal did not return an IPN id", { body: created });
    console.log(`Registered Pesapal IPN ${url} (ipn_id ${created.ipn_id}). Set PESAPAL_IPN_ID=${created.ipn_id} in .env to skip this lookup.`);
    return created.ipn_id;
  }

  return {
    // Resolves the IPN id Pesapal needs on every order, registering our IPN URL the first time.
    ipnId(url) {
      if (config.ipnId) return Promise.resolve(config.ipnId);
      ipnIdPromise ??= lookUpOrRegisterIpn(url).catch((error) => {
        ipnIdPromise = null;
        throw error;
      });
      return ipnIdPromise;
    },

    // Creates a payment request. The customer pays on the returned redirectUrl (M-Pesa, Airtel Money, card, ...).
    async submitOrder({ merchantReference, amount, description, callbackUrl, cancellationUrl, notificationId, billingAddress }) {
      const data = await call("/api/Transactions/SubmitOrderRequest", {
        method: "POST",
        token: await token(),
        body: {
          id: merchantReference,
          currency: config.currency,
          amount,
          description: description.slice(0, 100),
          callback_url: callbackUrl,
          cancellation_url: cancellationUrl,
          notification_id: notificationId,
          billing_address: billingAddress
        }
      });
      if (!data.order_tracking_id || !data.redirect_url) throw new PesapalError("Pesapal did not return a payment link", { body: data });
      return { trackingId: data.order_tracking_id, redirectUrl: data.redirect_url };
    },

    async transactionStatus(trackingId) {
      const data = await call(`/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(trackingId)}`, { token: await token() });
      return {
        statusCode: Number(data.status_code),
        description: data.payment_status_description ?? null,
        amount: data.amount === undefined || data.amount === null ? null : Number(data.amount),
        currency: data.currency ?? null,
        paymentMethod: data.payment_method ?? null,
        confirmationCode: data.confirmation_code ?? null,
        merchantReference: data.merchant_reference ?? null,
        raw: data
      };
    }
  };
}
