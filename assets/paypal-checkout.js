(function(){
  'use strict';
  var config = window.GolfchePayPalConfig || {};
  var button = document.querySelector('.cart-checkout');
  var status = document.getElementById('checkout-status');
  var cartKey = 'golfche-space-cart-v1';
  var clientId = config.sandbox ? config.clientIdSandbox : config.clientIdLive;
  var configReady = clientId && clientId.indexOf('YOUR_PAYPAL_') !== 0;
  if(!button || !status) return;

  function readOrderItems(){
    var cart = [];
    try { cart = JSON.parse(localStorage.getItem(cartKey) || '[]'); } catch(error) { cart = []; }
    if(!Array.isArray(cart) || !cart.length) throw new Error('Your cart is empty. Add an item before checkout.');
    var products = window.GolfcheProducts || [];
    var items = cart.map(function(row){
      var product = products.filter(function(item){return item.slug === row.slug;})[0];
      var price = product && (product.salePrice || product.price);
      if(!product || !price || !Number.isInteger(row.quantity) || row.quantity < 1) throw new Error('A cart item has no valid price yet. Please review your cart.');
      if(String(price.currency).toUpperCase() !== config.currency) throw new Error('All cart items must be priced in '+config.currency+' for PayPal checkout.');
      var cents = Math.round(Number(price.amount) * 100);
      if(!Number.isFinite(cents) || cents < 1) throw new Error('A cart item has an invalid price. Please review your cart.');
      return {name:String(product.name).slice(0,127), quantity:row.quantity, unitCents:cents};
    });
    return items;
  }
  function paypalItems(){
    return readOrderItems().map(function(item){return {name:item.name,quantity:String(item.quantity),unit_amount:{currency_code:config.currency,value:(item.unitCents/100).toFixed(2)}};});
  }
  function totalCents(items){return items.reduce(function(sum,item){return sum+item.unitCents*item.quantity;},0);}
  function setError(error){
    status.textContent = error && error.message ? error.message : 'PayPal could not complete checkout. Please try again or contact us.';
  }
  if(!configReady){
    button.disabled = true;
    status.textContent = 'Add your public PayPal '+(config.sandbox?'sandbox':'live')+' Client ID in assets/paypal-config.js to enable checkout.';
    return;
  }
  var sdkUrl = 'https://www.paypal.com/sdk/js?client-id='+encodeURIComponent(clientId)+'&currency='+encodeURIComponent(config.currency)+'&intent=capture';
  var sdk = document.createElement('script');
  sdk.src = sdkUrl;
  sdk.async = true;
  sdk.onload = function(){
    if(!window.paypal){setError();return;}
    var container = document.createElement('div');
    container.id = 'paypal-button-container';
    button.insertAdjacentElement('afterend',container);
    button.hidden = true;
    window.paypal.Buttons({
      createOrder:function(data,actions){
        try {
          var items = readOrderItems();
          var total = totalCents(items);
          var lineItems = paypalItems();
          return actions.order.create({purchase_units:[{description:'Golfche Space digital products',items:lineItems,amount:{currency_code:config.currency,value:(total/100).toFixed(2),breakdown:{item_total:{currency_code:config.currency,value:(total/100).toFixed(2)}}}}]});
        } catch(error) { setError(error); return Promise.reject(error); }
      },
      onApprove:function(data,actions){
        status.textContent = 'Payment approved. Capturing your order…';
        return actions.order.capture().then(function(details){
          localStorage.removeItem(cartKey);
          window.location.href = 'thanks.html?order_id='+encodeURIComponent(details.id || data.orderID || '');
        }).catch(setError);
      },
      onCancel:function(){status.textContent='Checkout was cancelled. Your cart is still here if you want to try again.';},
      onError:setError
    }).render('#paypal-button-container').catch(setError);
    status.textContent = config.sandbox ? 'Sandbox test mode is on. Secure checkout with PayPal.' : 'Secure checkout with PayPal.';
    button.addEventListener('click',function(){
      try { readOrderItems(); status.textContent='Choose PayPal to continue to secure checkout.'; }
      catch(error) { status.textContent=error.message; }
    });
  };
  sdk.onerror = function(){setError(new Error('PayPal checkout could not load. Check your connection and try again.'));};
  document.head.appendChild(sdk);
})();
