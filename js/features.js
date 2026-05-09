/**
 * GoldrArt Premium Features
 * #2 Confetti, #3 Recently Viewed
 * #10 Page Transitions, #14 Quick View Hover, #16 Mini Cart Preview, #17 Wishlist Share
 */

const ENABLE_SOCIAL_PROOF_TOASTS = false;

// Polyfill for Element.closest() compatibility
if (!Element.prototype.closest) {
  Element.prototype.closest = function(s) {
    if (!this) return null;
    let el = this;
    do {
      if (typeof el.matches === 'function' && el.matches(s)) return el;
      el = el.parentElement;
    } while (el);
    return null;
  };
}

// Safe selector helper
function safeClosest(target, selector) {
  if (!target || typeof target.closest !== 'function') return null;
  return target.closest(selector);
}

// ============================================================
// #2 CONFETTI - Gold particle burst animation
// ============================================================
function spawnConfetti(x, y) {
  const colors = ['#b8912b', '#d4af37', '#e6c86b', '#f7dfb3', '#ffd86a'];
  const particleCount = 28;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'confetti-particle';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    const angle = (Math.random() * Math.PI * 2);
    const velocity = 4 + Math.random() * 8;
    let vx = Math.cos(angle) * velocity;
    let vy = Math.sin(angle) * velocity - 3;
    
    let px = x, py = y;
    const duration = 1200 + Math.random() * 600;
    const startTime = Date.now();
    
    document.body.appendChild(particle);
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress > 1) {
        particle.remove();
        return;
      }
      
      px += vx;
      py += vy;
      vy += 0.15; // gravity
      
      particle.style.left = px + 'px';
      particle.style.top = py + 'px';
      particle.style.opacity = String(1 - progress);
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
}

// Hook confetti into "Own This Piece" button clicks
document.addEventListener('click', (e) => {
  const btn = safeClosest(e.target, '.btn:not(.admin-btn):not(.gold-btn)');
  if (btn && (btn.textContent.includes('Own This Piece') || btn.id === 'pm_add')) {
    const rect = btn.getBoundingClientRect();
    spawnConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
  }
});

// ============================================================
// #3 RECENTLY VIEWED - Track last 6 viewed products
// ============================================================
const RECENTLY_VIEWED_KEY = 'gold_recently_viewed';
const MAX_RECENT = 6;

function trackProductView(product) {
  try {
    let recent = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
    // Remove if already exists, then add to front
    recent = recent.filter(p => p.id !== product.id);
    recent.unshift({
      id: product.id,
      title: product.title,
      img: product.img || 'mini.png',
      category: product.category || 'Other'
    });
    // Keep only last 6
    recent = recent.slice(0, MAX_RECENT);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(recent));
  } catch (e) {
    console.warn('trackProductView failed', e);
  }
}

function renderRecentlyViewed() {
  try {
    const recent = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || '[]');
    if (recent.length === 0) return;
    
    const main = document.querySelector('main') || document.querySelector('.container');
    if (!main) return;
    
    // Check if section already exists
    let section = document.getElementById('recentlyViewedSection');
    if (!section) {
      section = document.createElement('div');
      section.id = 'recentlyViewedSection';
      section.className = 'category';
      section.style.marginTop = '28px';
      section.innerHTML = '<h3>Recently Viewed</h3>';
      
      const row = document.createElement('div');
      row.className = 'product-row';
      row.style.display = 'flex';
      row.style.gap = '16px';
      row.style.overflowX = 'auto';
      row.style.paddingBottom = '8px';
      
      section.appendChild(row);
      main.appendChild(section);
    }
    
    const row = section.querySelector('.product-row');
    row.innerHTML = '';
    
    recent.forEach(item => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.style.minWidth = '180px';
      card.style.flex = '0 0 auto';
      
      const product = findItemById(item.id);
      if (!product) return;
      
      card.innerHTML = `
        <div class="card-decor"></div>
        <img src="${item.img}" alt="${item.title}" style="cursor:pointer;">
        <h4>${item.title}</h4>
        <div class="cat-label">${item.category}</div>
        <div class="price">EGP ${product.variants && product.variants[0] ? product.variants[0].price : product.price || 0}</div>
        <button class="btn" style="margin-top:auto;width:100%;">View</button>
      `;
      
      card.querySelector('img').addEventListener('click', () => {
        showImageLightbox(item.img, product);
      });
      
      card.querySelector('.btn').addEventListener('click', () => {
        openProductModal(product);
      });
      
      row.appendChild(card);
    });
  } catch (e) {
    console.warn('renderRecentlyViewed failed', e);
  }
}

// Hook tracking into showImageLightbox and openProductModal + wishlist import
// These run after DOMContentLoaded so app.js (defer) has already initialized
document.addEventListener('DOMContentLoaded', () => {
  // Wait a tick to ensure app.js defer has run
  setTimeout(() => {
    // Patch showImageLightbox
    if (typeof showImageLightbox === 'function') {
      const _origLightbox = showImageLightbox;
      window.showImageLightbox = function(url, product) {
        if (product && product.id) trackProductView(product);
        _origLightbox(url, product);
      };
    }

    // Patch openProductModal
    if (typeof openProductModal === 'function') {
      const _origModal = openProductModal;
      window.openProductModal = function(product) {
        if (product && product.id) trackProductView(product);
        _origModal(product);
      };
    }

    // Patch renderFavorites to inject share button
    if (typeof renderFavorites === 'function') {
      const _origFav = renderFavorites;
      window.renderFavorites = function() {
        _origFav();
        addWishlistShareButton();
      };
    }

    // Patch renderCatalog to render recently viewed after
    if (typeof renderCatalog === 'function') {
      const _origCatalog = renderCatalog;
      window.renderCatalog = function() {
        _origCatalog();
        setTimeout(() => renderRecentlyViewed(), 350);
      };
    }

    // Import wishlist from URL if present
    importWishlistFromUrl();

    // Render recently viewed
    renderRecentlyViewed();

  }, 0);

  // Social proof toasts disabled by request
  if (ENABLE_SOCIAL_PROOF_TOASTS) {
    setTimeout(() => {
      showSocialProofToast();
      const scheduleNext = () => {
        setTimeout(() => {
          showSocialProofToast();
          scheduleNext();
        }, 25000 + Math.floor(Math.random() * 20000));
      };
      scheduleNext();
    }, 8000);
  }
});

// ============================================================
// #10 PAGE TRANSITIONS - Smooth fade-in on page load
// ============================================================
document.documentElement.style.setProperty('--page-in-duration', '350ms');
// #14 QUICK VIEW HOVER CARD - Mini popup on product hover
// ============================================================
let hoverCardTimeout = null;

function createQuickViewCard(product, x, y) {
  // Remove existing
  const existing = document.getElementById('quickViewCard');
  if (existing) existing.remove();
  
  const card = document.createElement('div');
  card.id = 'quickViewCard';
  card.className = 'quick-view-card';
  
  const variant = product.variants && product.variants[0];
  const price = variant ? variant.price : product.price;
  const size = variant ? variant.size : 'Default';
  
  card.innerHTML = `
    <div style="padding:12px;font-size:13px">
      <strong style="color:var(--gold);display:block;margin-bottom:6px">${product.title}</strong>
      <div style="color:#ddd;font-size:12px;margin-bottom:8px">${size} • EGP ${price}</div>
      <button class="btn" style="width:100%;font-size:13px;padding:8px 12px">Add to Cart</button>
    </div>
  `;
  
  // Position near cursor, but keep within viewport
  card.style.position = 'fixed';
  card.style.zIndex = '500';
  
  document.body.appendChild(card);
  
  // Calculate position
  let top = y - 120;
  let left = x - 110;
  
  if (top < 10) top = y + 20;
  if (left < 10) left = 10;
  if (left + 220 > window.innerWidth) left = window.innerWidth - 230;
  
  card.style.top = top + 'px';
  card.style.left = left + 'px';
  
  // Wire add to cart button
  card.querySelector('.btn').addEventListener('click', (e) => {
    e.stopPropagation();
    addToCart(Object.assign({}, product, {
      chosen: product.variants && product.variants[0] ? product.variants[0] : getDefaultVariant(product),
      qty: 1
    }));
    card.remove();
  });
}

// Only enable on desktop
if (window.innerWidth > 768) {
  document.addEventListener('mouseenter', (e) => {
    const card = safeClosest(e.target, '.product-card');
    if (!card) return;
    
    clearTimeout(hoverCardTimeout);
    
    hoverCardTimeout = setTimeout(() => {
      const product = window._lastHoveredProduct;
      if (product) {
        const rect = card.getBoundingClientRect();
        createQuickViewCard(product, rect.right, rect.top + rect.height / 2);
      }
    }, 300);
  }, true);
  
  document.addEventListener('mouseleave', (e) => {
    const card = safeClosest(e.target, '.product-card');
    if (card) {
      clearTimeout(hoverCardTimeout);
      const quickView = document.getElementById('quickViewCard');
      if (quickView) quickView.remove();
    }
  }, true);
}

// Track hovered product when card is hovered (set from renderCatalog or similar)
document.addEventListener('mouseenter', (e) => {
  const card = safeClosest(e.target, '.product-card');
  if (card && card.dataset.productId) {
    window._lastHoveredProduct = findItemById(card.dataset.productId);
  }
}, true);

// ============================================================
// #16 MINI CART PREVIEW - Hover on cart icon
// ============================================================
function showMiniCartPreview() {
  if (!CART || CART.length === 0) return;
  
  const existing = document.getElementById('miniCartPreview');
  if (existing) existing.remove();
  
  const lastItem = CART[CART.length - 1];
  const preview = document.createElement('div');
  preview.id = 'miniCartPreview';
  preview.className = 'mini-cart-preview';
  
  preview.innerHTML = `
    <div style="display:flex;gap:10px;align-items:flex-start">
      <img src="${lastItem.img || 'mini.png'}" alt="${lastItem.title}" style="width:60px;height:60px;object-fit:cover;border-radius:6px">
      <div style="flex:1;font-size:13px">
        <strong style="color:var(--gold);display:block">${lastItem.title}</strong>
        <div style="color:#bbb;margin:4px 0">Qty: ${lastItem.qty || 1}</div>
        <div style="color:var(--gold);font-weight:900">EGP ${lastItem.price || 0}</div>
        <div style="color:#aaa;font-size:11px;margin-top:4px">Cart: ${CART.length} item(s)</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(preview);
  
  // Position above cart button
  const cartBtn = document.getElementById('cartBtn');
  if (cartBtn) {
    const rect = cartBtn.getBoundingClientRect();
    preview.style.position = 'fixed';
    preview.style.bottom = (window.innerHeight - rect.top + 12) + 'px';
    preview.style.right = '20px';
  }
  
  // Hide on mouse leave
  setTimeout(() => {
    if (preview && preview.parentNode) preview.remove();
  }, 3000);
}

document.addEventListener('mouseenter', (e) => {
  if (safeClosest(e.target, '#cartBtn')) {
    showMiniCartPreview();
  }
}, true);

// ============================================================
// #17 WISHLIST SHARE LINK - Encode wishlist in URL
// ============================================================
function generateWishlistShareLink() {
  try {
    if (!WISHLIST || WISHLIST.length === 0) {
      showToast('Wishlist is empty', 2500);
      return;
    }
    
    const ids = WISHLIST.map(item => item.id).filter(Boolean);
    const encoded = btoa(JSON.stringify(ids));
    const shareUrl = window.location.origin + window.location.pathname + '?wishlist=' + encoded;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('Wishlist link copied! Share with friends 💝', 3500);
    }).catch(() => {
      showToast('Link: ' + shareUrl, 5000);
    });
  } catch (e) {
    console.warn('generateWishlistShareLink failed', e);
  }
}

// Add share button to favorites modal
function addWishlistShareButton() {
  setTimeout(() => {
    const favList = document.getElementById('favList');
    if (!favList) return;
    
    // Check if share button already exists
    if (favList.querySelector('#wishlistShareBtn')) return;
    
    const shareBtn = document.createElement('button');
    shareBtn.id = 'wishlistShareBtn';
    shareBtn.className = 'btn';
    shareBtn.textContent = '💝 Share Wishlist';
    shareBtn.style.width = '100%';
    shareBtn.style.marginTop = '12px';
    
    shareBtn.addEventListener('click', generateWishlistShareLink);
    
    // Insert after favorite list
    const modal = favList.closest('.modal');
    if (modal) {
      const actions = modal.querySelector('.modal-actions') || modal.querySelector('[style*="display:flex"]');
      if (actions) {
        actions.insertBefore(shareBtn, actions.firstChild);
      } else {
        favList.parentNode.insertBefore(shareBtn, favList.nextSibling);
      }
    }
  }, 100);
}

// Intercept renderFavorites — moved to main DOMContentLoaded block below

function importWishlistFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('wishlist');
    if (!encoded) return;
    
    const ids = JSON.parse(atob(encoded));
    if (!Array.isArray(ids)) return;
    
    let imported = 0;
    ids.forEach(id => {
      const product = findItemById(id);
      if (product && !WISHLIST.find(w => w.id === id)) {
        WISHLIST.push({
          id: product.id,
          title: product.title,
          img: product.img || 'mini.png',
          category: product.category || 'Other'
        });
        imported++;
      }
    });
    
    if (imported > 0) {
      saveWishlist();
      showToast(`Imported ${imported} items to your wishlist! 💝`, 4000);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  } catch (e) {
    console.warn('importWishlistFromUrl failed', e);
  }
}
