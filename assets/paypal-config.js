/* Public PayPal configuration only. Paste your PayPal public Client ID below. */
window.GolfchePayPalConfig = {
  // Find this in PayPal Developer Dashboard > Apps & Credentials. Never paste a secret here.
  clientIdSandbox: 'YOUR_PAYPAL_SANDBOX_PUBLIC_CLIENT_ID',
  clientIdLive: 'YOUR_PAYPAL_LIVE_PUBLIC_CLIENT_ID',
  // true selects the sandbox app's public Client ID; false selects the live app's ID.
  sandbox: true,
  currency: 'USD'
};
