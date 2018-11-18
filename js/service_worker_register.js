// Some browser do not support service worker so if the browser support service worker then
// register the service worker at page load .
if (navigator.serviceWorker) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(reg) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', reg.scope);
    }, function(err) {
      // registration failed
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}
