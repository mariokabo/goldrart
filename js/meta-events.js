// Meta Pixel auto-event tracking for all main actions
(function(){
  // Helper: fire fbq event if available
  function fireMetaEvent(event, params) {
    if (typeof fbq === 'function') {
      try { fbq('track', event, params || {}); } catch(e) {}
    }
  }

  // Map button id/class/text to Meta event
  const eventMap = [
    // id/class, event, optional: value/currency
    {match:/add.*cart|cart.*add|own.*piece|checkoutBtn|add-to-cart|cartBtn/i, event:'AddToCart'},
    {match:/fav|wishlist|add.*wish|add.*fav/i, event:'AddToWishlist'},
    {match:/register|sign.*up|subscribe|start.*trial|complete.*registration/i, event:'CompleteRegistration'},
    {match:/contact|waQuick|waFloat|contact.*us|msg|message|whatsapp/i, event:'Contact'},
    {match:/searchBtn|search.*button|بحث|search/i, event:'Search'},
    {match:/applyCoupon|apply.*coupon/i, event:'InitiateCheckout'},
    {match:/buy|purchase|pay|buy.*now|purchase.*now/i, event:'Purchase'},
    {match:/sendOrder|submit|submit.*application/i, event:'SubmitApplication'},
    {match:/schedule|book|حجز|موعد/i, event:'Schedule'},
    {match:/customize|تخصيص|configure/i, event:'CustomizeProduct'},
    {match:/donate|تبرع/i, event:'Donate'},
    {match:/find.*location|location.*find/i, event:'FindLocation'},
    {match:/lead|client|عميل/i, event:'Lead'},
    {match:/start.*trial/i, event:'StartTrial'},
    {match:/subscribe/i, event:'Subscribe'},
    {match:/payment|pay|add.*payment/i, event:'AddPaymentInfo'},
    {match:/view.*content|عرض.*محتوى/i, event:'ViewContent'},
  ];

  // Attach event listeners to all buttons/links
  function attachMetaTracking() {
    // Buttons
    document.querySelectorAll('button, input[type=button], input[type=submit], a').forEach(function(btn){
      // Only attach once
      if (btn._metaTracked) return;
      btn._metaTracked = true;
      btn.addEventListener('click', function(e){
        let txt = (btn.textContent||btn.value||'').toLowerCase();
        let id = btn.id||'';
        let cls = btn.className||'';
        let matched = false;
        for (let i=0;i<eventMap.length;i++) {
          if (eventMap[i].match.test(txt) || eventMap[i].match.test(id) || eventMap[i].match.test(cls)) {
            fireMetaEvent(eventMap[i].event);
            matched = true;
            break;
          }
        }
        // fallback: always track ViewContent for any button click
        if (!matched) fireMetaEvent('ViewContent');
      }, true);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachMetaTracking);
  } else {
    attachMetaTracking();
  }
})();
