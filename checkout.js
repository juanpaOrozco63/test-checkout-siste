// Checkout de Sistecrédito para Tienda Nube.
// Usa el bootstrap real del storefront de Tienda Nube (LoadCheckoutPaymentContext) y registra
// un PaymentOptions.ExternalPayment, que es el tipo correcto para un medio de pago que redirige
// al dominio del proveedor (Sistecrédito) en vez de capturar datos de tarjeta en el checkout.
//
// IMPORTANTE: Checkout.processPayment(extraData) dispara en el backend de Tienda Nube una
// llamada server-to-server a nuestro process_payment_api (ver ProcessPaymentController). Esa
// implementación todavía SIMULA el resultado (no llama a la pasarela real de Sistecrédito) —
// ver .cloud/planning/propuesta-integracion-sistecredito-tiendanube.md (hallazgo HIGH-06).
(function () {
  'use strict';

  function waitForBootstrap() {
    if (typeof LoadCheckoutPaymentContext !== 'undefined') {
      LoadCheckoutPaymentContext(initSistecredito);
    } else {
      setTimeout(waitForBootstrap, 100);
    }
  }

  function initSistecredito(Checkout, PaymentOptions) {
    var sistecreditoOption = new PaymentOptions.ExternalPayment({
      id: 'sistecredito',
      version: 'v2',
      onSubmit: function (callback) {
        var extraData = {
          email: Checkout.getData ? Checkout.getData('order.contact.email') : undefined,
          callback_urls: Checkout.getData ? Checkout.getData('callbackUrls.success') : undefined
        };

        Checkout.processPayment(extraData)
          .then(function (payment) {
            if (payment && payment.redirect_url) {
              window.parent.location.href = payment.redirect_url;
            }
            if (typeof callback === 'function') callback();
          })
          .catch(function (error) {
            var message =
              (error && error.response && error.response.data && error.response.data.message) ||
              'No fue posible iniciar el pago con Sistecrédito.';
            if (Checkout.showErrorCode) {
              Checkout.showErrorCode(message);
            } else {
              console.error('Sistecredito checkout error:', message);
            }
          });
      }
    });

    Checkout.addPaymentOption(sistecreditoOption);
  }

  waitForBootstrap();
})();
