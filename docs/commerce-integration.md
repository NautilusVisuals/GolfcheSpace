# PayPal checkout and digital delivery

## Browser checkout setup

The product cart uses the PayPal JavaScript SDK Smart Payment Buttons. Configure only public Client IDs in `assets/paypal-config.js`; never put a PayPal secret in this repository. `sandbox: true` selects the sandbox Client ID, while `false` selects the live Client ID. Product prices in the product catalogue must be confirmed and use USD before checkout can create an order. PayPal order line items and totals are calculated from the current cart and its catalogue prices.

On approval, the page captures the PayPal order, clears the browser cart, then redirects to `thanks.html` with the PayPal order ID. A successful client-side capture confirms payment, but it does not securely deliver digital files. Any file committed to or deployed by GitHub Pages can be reached publicly, so keep paid files and permanent download links out of this repository.

The thank-you page currently says: “Check your PayPal email, we send your download link within 24 hours.” Edit that placeholder to match the actual fulfillment process before launch.

## Automatic delivery options

### Serverless verification and temporary links

Use a Netlify Function or Cloudflare Worker to verify the captured order with PayPal's server API, confirm the products and amount, and return or email a short-lived download URL from private object storage.

**Pros:** delivery can be automated; files stay out of the public site; links can expire; the server can independently validate the order.

**Cons:** requires backend code, secure storage for PayPal credentials and files, deployment configuration, and ongoing monitoring. Never put the PayPal secret in browser code or this static repository.

### Hosted digital-product checkout

Host the products and checkout with Payhip, Gumroad, or Lemon Squeezy, then link to or embed that provider's checkout instead of the custom PayPal cart.

**Pros:** less custom backend work; providers commonly handle payment records, receipts, and download delivery.

**Cons:** fees and platform rules apply; checkout branding and customer data are controlled partly by the provider; embedding or linking may require updating the product catalogue and customer journey.

Neither automatic-delivery option is implemented here. Choose one before promising instant downloads.
