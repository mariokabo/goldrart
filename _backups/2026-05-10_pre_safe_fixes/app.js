const GOLD = '#b8912b';
const IS_ANDROID = /Android/i.test(navigator.userAgent||'');
// enable manual swipe on product rows for Android webview/users
const ALLOW_ROW_DRAG = IS_ANDROID;
// Admin-configurable Google Form URL for Register button
window.GOLDRART_REGISTER_FORM_URL = 'https://forms.gle/dvefp7TT9jiC6VRZ7';

// Enhanced link opening for Android WebView (Kodular) and browsers
function openExternalLink(url, fallbackMode = false) {
  if (!url) return;

  const ua = navigator.userAgent || '';
  const isAndroidWebView = /Android/i.test(ua) && /wv|WebView|; wv\)/i.test(ua);
  const isKodular = typeof window.KodularCreator !== 'undefined';
  const hasAndroidInterface = typeof window.AndroidInterface !== 'undefined';

  console.log('openExternalLink:', { url, isKodular, isAndroidWebView, hasAndroidInterface });

  try {
    // Priority 1: Try Kodular's openUrl
    if (isKodular && window.KodularCreator && typeof window.KodularCreator.openUrl === 'function') {
      console.log('Using KodularCreator.openUrl');
      window.KodularCreator.openUrl(url);
      return;
    }

    // Priority 2: Try custom Android interface
    if (hasAndroidInterface && window.AndroidInterface.openUrl) {
      console.log('Using AndroidInterface.openUrl');
      window.AndroidInterface.openUrl(url);
      return;
    }

    // Priority 3: For WebView, use location.href (most compatible)
    if (isAndroidWebView) {
      console.log('WebView detected, using location.href');
      window.location.href = url;
      return;
    }

    // Priority 4: Normal browser - create link with target _system
    console.log('Normal browser, using link click');
    const link = document.createElement('a');
    link.href = url;
    link.target = '_system'; // Forces external browser on mobile
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try { document.body.removeChild(link); } catch(e) {}
    }, 100);
  } catch (e) {
    console.error('openExternalLink failed:', e);
    // Final fallback - always works
    try { 
      window.location.href = url; 
    } catch (e2) {
      console.error('Final fallback failed:', e2);
    }
  }
}

// Unified category navigation used by sidebar links and section titles
function openCategoryView(categoryName) {
  if (!categoryName) return;
  const s = new URLSearchParams(window.location.search);
  s.set('category', categoryName);
  s.delete('page');
  history.pushState({}, '', '?' + s.toString());
  window._gold_urlCategory = categoryName;
  renderCatalog();
  try { closeDrawer(); } catch (e) {}
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Open WhatsApp chat with message via wa.me URL scheme
function openWhatsAppChat(message, phoneNumber = null) {
  if (!message) return;
  
  const phone = phoneNumber || WA_NUMBER;
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const encodedMsg = encodeURIComponent(message);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
  
  // Detect if running in WebView
  const isWebView = (function() {
    const ua = navigator.userAgent || '';
    // Check for common WebView indicators
    return /wv|WebView|; wv\)/i.test(ua) || 
           typeof window.AndroidInterface !== 'undefined' ||
           typeof window.KodularCreator !== 'undefined';
  })();
  
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  console.log('Opening WhatsApp:', { isWebView, isAndroid, isIOS, url: waUrl });
  
  try {
    // Try Kodular/MIT App Inventor interface first
    if (typeof window.KodularCreator !== 'undefined' && window.KodularCreator.openUrl) {
      console.log('Using KodularCreator.openUrl');
      window.KodularCreator.openUrl(waUrl);
      return;
    }
    
    // Try custom Android interface
    if (typeof window.AndroidInterface !== 'undefined' && window.AndroidInterface.openWhatsApp) {
      console.log('Using AndroidInterface.openWhatsApp');
      window.AndroidInterface.openWhatsApp(cleanPhone, message);
      return;
    }
    
    // For Kodular WebViewer - trigger Page Loaded event
    if (isWebView && isAndroid) {
      console.log('Kodular WebView detected, navigating to WhatsApp URL');
      // هذا سيجعل Page Loaded يتم trigger مع URL واتساب
      window.location.href = waUrl;
      return;
    }
    
    // For WebView, use location.href (most reliable)
    if (isWebView) {
      console.log('WebView detected, using location.href');
      window.location.href = waUrl;
      return;
    }
    
    // For normal mobile browsers, create a link and click it
    if (isAndroid || isIOS) {
      console.log('Mobile browser detected, using link click');
      const link = document.createElement('a');
      link.href = waUrl;
      link.target = '_system'; // Important for mobile
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try { document.body.removeChild(link); } catch(e) {}
      }, 100);
      return;
    }
    
    // For desktop, open in new window
    console.log('Desktop detected, using window.open');
    const newWindow = window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = waUrl;
    }
  } catch (e) {
    console.error('Failed to open WhatsApp:', e);
    // Final fallback - always works in WebView
    window.location.href = waUrl;
  }
}

// Alternative: open in new tab (for desktop)
function openWhatsAppChatNewTab(message, phoneNumber = null) {
  if (!message) return;
  
  const phone = phoneNumber || WA_NUMBER;
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  const encodedMsg = encodeURIComponent(message);
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;
  
  // Try to open in new tab
  const opened = window.open(waUrl, '_blank', 'noopener,noreferrer');
  
  // If blocked, open in same window
  if (!opened || opened.closed || typeof opened.closed === 'undefined') {
    window.location.href = waUrl;
  }
}

// CSV Parser: converts CSV text into rows array (handles quoted fields with commas/newlines)
function parseCSV(text){
  const rows = [];
  let cur = '';
  let row = [];
  let inQuotes = false;
  
  for(let i=0; i<text.length; i++){
    const ch = text[i];
    const next = text[i+1];
    
    if(ch === '"'){
      // Handle escaped quotes
      if(inQuotes && next === '"'){ 
        cur += '"'; 
        i++; 
        continue; 
      }
      // Toggle quote state
      inQuotes = !inQuotes; 
      continue;
    }
    
    if(ch === ',' && !inQuotes){ 
      row.push(cur); 
      cur=''; 
      continue; 
    }
    
    if((ch === '\n' || ch === '\r') && !inQuotes){ 
      if(cur!=='' || row.length>0){ 
        row.push(cur); 
        rows.push(row); 
        row=[]; 
        cur=''; 
      } 
      // Skip consecutive newlines/carriage returns
      while(text[i+1]==='\n' || text[i+1]==='\r') i++; 
      continue; 
    }
    
    cur += ch;
  }
  
  // Push last row if exists
  if(cur!=='' || row.length>0){ 
    row.push(cur); 
    rows.push(row); 
  }
  
  // Remove completely empty rows and trim all fields
  const cleanedRows = rows.filter(r => r && r.length > 0 && r.some(cell => cell && cell.trim())).map(r => r.map(cell => (cell||'').toString().trim()));
  
  console.log('[CSV CLEANUP] Original rows:', rows.length, '→ Cleaned rows:', cleanedRows.length, '(removed', rows.length - cleanedRows.length, 'empty rows)');
  
  return cleanedRows;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000){
  const controller = new AbortController();
  const timeoutId = setTimeout(()=> controller.abort(), timeoutMs);
  try{
    const mergedOptions = Object.assign({}, options, { signal: controller.signal });
    return await fetch(url, mergedOptions);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function loadCatalogFromCSV() {
  try{
    // Try CSV first and use it on every page load (authoritative import)
    // Clear cache to force fresh load from Google Sheets
    console.log('[CATALOG] Force loading from Google Sheets...');
    try{
      let csvResp = null;
      // prefer admin-configured sheet URL (falls back to built-in ID)
      const configuredCsv = await loadSheetUrl();
      // Add cache buster to force fresh data
      const cacheBuster = '&t=' + Date.now();
      // قراءة من تاب products مباشرة
      const csvPaths = [configuredCsv ? configuredCsv + cacheBuster : null, 'https://docs.google.com/spreadsheets/d/1XQ3f00L-DBPqZdE3xlsQK9-ULMk7JiwnIqzlBxzGKoQ/export?format=csv' + cacheBuster];
      for(const p of csvPaths){ try{ if(!p) continue; csvResp = await fetchWithTimeout(p, {cache: 'no-store'}, 10000); if(csvResp && csvResp.ok) break; }catch(e){ csvResp = null; } }
      if(csvResp && csvResp.ok){
        const txt = await csvResp.text(); 
        console.log('[CSV RAW] Total text length:', txt.length, 'bytes');
        const rows = parseCSV(txt);
        console.log('[CSV PARSE] Total rows received from Google Sheets:', rows.length);
        if(rows.length > 0) console.log('[CSV HEADER] Row 0 (header):', rows[0]);
        if(rows.length > 1) console.log('[CSV ROW 1] First data row:', rows[1]);
        if(rows && rows.length>1){
          const header = rows[0].map(h=> (h||'').toString().trim()); const headerLower = header.map(h=>h.toLowerCase()); const groups = {};
          // consult admin CSV mapping if present — this allows arbitrary sheet headers to be mapped to site fields
          const csvMap = loadCsvMapping();
          const findIndex = (vals)=>{ if(!vals) return -1; if(!Array.isArray(vals)) vals=[vals]; for(const v of vals){ if(!v) continue; const lv = v.toString().toLowerCase().trim(); // exact match
              let idx = headerLower.indexOf(lv); if(idx>=0) return idx; // fuzzy contains
              for(let i=0;i<headerLower.length;i++){ if(headerLower[i].includes(lv) || lv.includes(headerLower[i])) return i; }
          } return -1 };
          console.debug('CSV parsed: rows=' + rows.length + ' header=' + header.join(','));
          const idx_id = findIndex([csvMap.id,'id']); const idx_title = findIndex([csvMap.title,'title','name']); const idx_desc = findIndex([csvMap.description,'description','desc','details']);
          // استخدام العمود E (index 4) مباشرة للصور
          let idx_img = 4;
          console.log('[IMAGE] ✅ Using column E (index 4) for product images');
          const idx_price = findIndex([csvMap.price,'price']);
          const idx_cat = findIndex([csvMap.category,'category']);
          const idx_sp = findIndex([
            csvMap.sizes_prices,'sizes_prices','sizes','size_prices','sizes_and_prices','sizes & prices','size & price','size and price','sizes and prices','variants','options'
          ]);
          // additional sheet-powered fields (using mapping if set)
          const idx_featured = findIndex([csvMap.featured,'featured','is_featured','featured_img','featured_image','featured_url','feat','featured_image_url','featured_img_url','show_in_featured']);
          const idx_bg = (() => {
            const found = findIndex([csvMap.bg,'bg','background','bg_url','background_url','background_img','bg_img']);
            if(found>=0) return found;
            return (header && header[6]) ? 6 : -1; // fallback to column G
          })();
          const idx_frame = findIndex([csvMap.frame,'frame','frame_included','frame_info']);
          console.log('[BG] Column index:', idx_bg);
          const parseCSV_rows = rows.length;
          const parsedFeatured = []; let parsedBg = null;
          let processedCount = 0;
          for(let i=1;i<rows.length;i++){
            const r = rows[i];
            // Skip completely empty rows
            if(!r || r.length === 0 || (r.length === 1 && !r[0])) {
              console.log('[CSV SKIP] Row', i, 'is empty, skipping');
              continue;
            }
            processedCount++;
            if(processedCount <= 3 || processedCount % 50 === 0){
              console.log('[CSV DATA] Processing row', i, '- item count:', processedCount, '- row length:', r.length);
            }
            // ignore any incoming id column — generate internal id to avoid exposing sheet ids
            const id = 'r'+i;
            const title = (idx_title>=0 && r[idx_title]) ? r[idx_title] : 'Untitled'; const desc = (idx_desc>=0 && r[idx_desc]) ? r[idx_desc] : '';
            const img = (idx_img>=0 && r[idx_img] && r[idx_img].startsWith('http')) ? r[idx_img] : 'mini.png';
            // parse sizes_prices column formatted like: "100 x 70:6134 | 120 x 80:7997"
            let variants = [];
            if(idx_sp>=0 && r[idx_sp]){
              const spRaw = r[idx_sp].toString();
              const parts = spRaw.split('|').map(s=>s.trim()).filter(Boolean);
              for(const p of parts){
                const [sizePart, pricePart] = p.split(':').map(s=>s && s.trim());
                if(sizePart){ const priceNum = pricePart ? Number(pricePart.toString().replace(/[^0-9\.]/g,'').replace(/,/g,'')) : 0; variants.push({size: sizePart, price: Number(priceNum||0)}); }
              }
            }
            // collect featured entries
            try{
              if(idx_featured>=0 && r[idx_featured]){
                const rawF = (r[idx_featured]||'').toString().trim();
                if(rawF){
                  // if rawF looks like URL(s)
                  const urls = rawF.split(/[|,;\n]+/).map(s=>s.trim()).filter(Boolean);
                  urls.forEach(u=>{
                    if(u.startsWith('http')){
                      parsedFeatured.push({id:'u-'+i+'-'+(Math.random()*1000|0), title: title, img: u, overlay:{text:'',size:'medium',pos:'center'}});
                    } else {
                      // truthy flag: add the product itself to featured
                      const v = rawF.toLowerCase(); if(v==='1' || v==='yes' || v==='true' || v==='featured' || v==='on') parsedFeatured.push({id:'p-'+id,title:title,img:img,overlay:{text:'',size:'medium',pos:'center'}});
                    }
                  });
                }
              }
            }catch(e){ console.warn('featured parse failed for row',i,e); }
            // collect background value if present (first non-empty wins)
            try{ 
              if(!parsedBg && idx_bg>=0 && r[idx_bg]){
                const bgRaw = r[idx_bg].toString().trim();
                if(bgRaw.startsWith('http')){
                  parsedBg = bgRaw;
                  console.log('[BG] Found background at row', i, ':', bgRaw);
                }
              }
            }catch(e){ console.warn('[BG] Parse failed:', e); }

            // fallback to price/description extraction if no variants found
            if(variants.length===0){
              let csvPrice = 0; if(idx_price>=0){ const raw = (r[idx_price]||'').toString(); const num = Number(raw.replace(/[^0-9\.]/g,'').replace(/,/g,'')); if(!isNaN(num) && num>0) csvPrice = num; }
              const descPrice = extractFirstPrice(desc) || 0; const priceNum = csvPrice || descPrice || 0;
              const extVariants = extractVariants(desc);
              if(extVariants && extVariants.length>0){ extVariants.forEach(v=>{ if(!v.price || isNaN(Number(v.price)) || Number(v.price)===0){ v.price = csvPrice || descPrice || v.price || 0 } v.price = Number(v.price||0); }); variants = extVariants; }
              if(variants.length===0) variants = [{size:'Default',price:priceNum}];
            }
            const category = (idx_cat>=0 && r[idx_cat]) ? r[idx_cat] : guessCategory(desc,title);
            const frameInfo = (idx_frame>=0 && r[idx_frame]) ? r[idx_frame].toString().trim() : '';
            const item = { id, title, desc, price: (variants[0] && variants[0].price) || 0, size:'custom', img, flag:'', variants: variants, frameInfo: frameInfo };
            if(!groups[category]) groups[category]=[]; groups[category].push(item);
          }
          CATALOG = Object.keys(groups).map(k=>({category:k,items:groups[k]}));
          // 🔍 DIAGNOSTIC: Log total product count
          const totalProducts = CATALOG.reduce((sum, cat) => sum + (cat.items ? cat.items.length : 0), 0);
          const expectedRows = rows.length - 1; // minus header
          console.log('[SUCCESS] ✅ Loaded', totalProducts, 'products from Google Sheets into', CATALOG.length, 'categories');
          console.log('[ROWS INFO] CSV had', rows.length, 'total rows (1 header +', expectedRows, 'data)');
          console.log('[PROCESSED] Actually processed:', processedCount, 'non-empty data rows');
          console.log('[CATEGORIES]', CATALOG.map(c => `${c.category}(${c.items.length})`).join(' | '));
          if(totalProducts === 0) {
            console.warn('[ERROR] ⚠️ No products loaded! Check Sheet columns: id, title, image_url, sizes_prices');
            console.warn('[COLUMNS] Header:', header.join(' | '));
          } else if(totalProducts < processedCount) {
            console.warn('[WARNING] ⚠️ Only', totalProducts, 'of', processedCount, 'rows were fully processed.');
          } else if(processedCount < expectedRows) {
            console.warn('[INFO] ℹ️ Skipped', expectedRows - processedCount, 'empty/malformed rows');
          }
          try{ const catList = Object.keys(groups); if(catList && catList.length){ saveCategories(catList); renderDynamicCategories(); } }catch(e){ console.warn('saving categories from sheet failed', e); }
          // create a backup of previous catalog and persist new one — notify admin if changed
          try{
            const prevRaw = localStorage.getItem('gold_products') || '';
            const newRaw = JSON.stringify(CATALOG);
            if(prevRaw !== newRaw){ const backupKey = 'gold_products_backup_auto_' + Date.now(); localStorage.setItem(backupKey, prevRaw); localStorage.setItem('gold_products', newRaw); addAudit({ type:'catalog_imported', by: currentAdminSession() && currentAdminSession().username || 'auto-import', ts: Date.now(), note: 'Imported from Google Sheet, backup: ' + backupKey }); /* suppress auto notifications */ }
            else { localStorage.setItem('gold_products', newRaw); }
          }catch(e){ console.warn('catalog backup/notify failed', e); localStorage.setItem('gold_products', JSON.stringify(CATALOG)); }
          // if the sheet provided featured slides, persist them and refresh carousel
          try{
            if(parsedFeatured && parsedFeatured.length>0){ saveFeatured(parsedFeatured); renderCarousel3D(); }
            if(parsedBg){
              console.log('[BG] Applying background from sheet:', parsedBg);
              try{
                // Apply background directly without relying on setBackgroundUrl function
                document.body.style.backgroundImage = `url('${parsedBg}')`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
                document.body.style.backgroundRepeat = 'no-repeat';
                document.body.style.backgroundAttachment = 'fixed';
                document.body.classList.add('bg-applied');
                console.log('[BG] Background CSS applied successfully from sheet');
              }catch(e){ console.warn('[BG] Failed to apply background:', e); }
            } else {
              console.log('[BG] No background found in sheet column G');
            }

            // Import coupons from CSV if a coupon column is present
            try{
              const findIdx = (pred, fallbackIdx)=>{
                const found = header.findIndex(h=> h && pred(h.toLowerCase()));
                if(found>=0) return found;
                return (fallbackIdx!=null && header[fallbackIdx]) ? fallbackIdx : -1;
              };
              const idx_coupon = findIdx(h=> (h.includes('coupon') || h.includes('copon')), 7); // H column fallback
              const idx_coupon_value = findIdx(h=> (h.includes('value') || h.includes('amount') || h.includes('discount')), 8); // I column fallback
              console.log('[COUPON] Headers:', header);
              console.log('[COUPON] Coupon column index:', idx_coupon, 'Value column index:', idx_coupon_value);
              const coupons = [];
              if(idx_coupon>=0){
                for(let i=1;i<rows.length;i++){
                  const r = rows[i];
                  const raw = (r[idx_coupon]||'').toString().trim();
                  if(!raw) continue;
                  let code = raw; // keep original case
                  let type = 'fixed';
                  let value = 0;
                  const valRaw = (idx_coupon_value>=0 && r[idx_coupon_value]) ? r[idx_coupon_value].toString().trim() : null;
                  if(valRaw){
                    if(valRaw.indexOf('%')>=0){ type='percent'; value = Number(valRaw.replace(/[^0-9\.]/g,'')); }
                    else { type='fixed'; value = Number(valRaw.replace(/[^0-9\.]/g,'')); }
                  } else {
                    if(/[:\-\|=]/.test(raw)){
                      const parts = raw.split(/[:\-\|=]/).map(s=>s.trim()); code = parts[0] || raw; const p = parts[1]||'';
                      if(p.indexOf('%')>=0){ type='percent'; value = Number(p.replace(/[^0-9\.]/g,'')); }
                      else { const num = Number(p.replace(/[^0-9\.]/g,'')); if(!isNaN(num) && num>0){ type='fixed'; value = num; } }
                    } else if(raw.indexOf('%')>=0){ type='percent'; value = Number(raw.replace(/[^0-9\.]/g,'')); }
                    else if(/^\d+(?:\.\d+)?$/.test(raw)) { type='fixed'; value = Number(raw); }
                    else { continue; }
                  }
                  const newObj = { code: code, type: (type==='percent'?'percent':'fixed'), value: Number(value||0), expiresAt: null, appliesTo: ['*'], aliases: [] };
                  coupons.push(newObj);
                }
              } else {
                console.warn('[COUPON] No coupon column found');
              }
              window.COUPONS_FROM_SHEET = coupons;
              console.log('[COUPON] Stored', coupons.length, 'coupons');
            }catch(e){ console.warn('[COUPON] Import failed:', e); window.COUPONS_FROM_SHEET = []; }
          }catch(e){ console.warn('[SHEET] Featured/BG/Coupon processing failed', e); }
          // mark that catalog was loaded from Google Sheets
          try{ localStorage.setItem('gold_products_source','google_sheet'); }catch(e){}
          saveCatalogToLocal();
          // render catalog immediately
          try{ renderCatalog(); }catch(e){}
          return;
        }
      }
    }catch(e){ console.warn('CSV early load failed', e); }

    // CSV did not load — try builtin products
    console.log('Google Sheets failed, trying builtin products...');
    if(typeof window.__BUILTIN_PRODUCTS !== 'undefined' && Array.isArray(window.__BUILTIN_PRODUCTS) && window.__BUILTIN_PRODUCTS.length > 0){
      CATALOG = window.__BUILTIN_PRODUCTS;
      saveCatalogToLocal();
      console.log('Loaded', CATALOG.length, 'categories from builtin products');
      try{ renderCatalog(); }catch(e){ console.error('renderCatalog failed', e); }
      return;
    }


    // prefer an applied/baked catalog (repo) if present (products.applied.merged.json / products.applied.json)
    let respApply = null; const applyPaths = ['/products.applied.merged.json','/products.applied.json','./products.applied.merged.json','./products.applied.json']; for(const p of applyPaths){ try{ respApply = await fetchWithTimeout(p, {}, 7000); if(respApply && respApply.ok) break; }catch(e){ respApply = null; } } if(respApply && respApply.ok){ const j = await respApply.json(); if(Array.isArray(j) && j.length>0){ CATALOG = j; saveCatalogToLocal(); return; } }
    // fallback: baked-in catalog (products.builtin.json)
    try {
      let respBuiltin = null;
      const builtinPaths = ['/products.builtin.json', 'products.builtin.json', './products.builtin.json'];
      for (const p of builtinPaths) {
        try {
          respBuiltin = await fetchWithTimeout(p, {}, 7000);
          if (respBuiltin && respBuiltin.ok) break;
        } catch (e) {
          respBuiltin = null;
        }
      }
      if (respBuiltin && respBuiltin.ok) {
        const j = await respBuiltin.json();
        if (Array.isArray(j) && j.length > 0) {
          CATALOG = j;
          saveCatalogToLocal();
          return;
        }
      }
    } catch (e) {
      console.error('Error loading builtin catalog', e);
    }
    // attempt to auto-apply the cleaned/applied catalog if present (run once per session)
    try{
      const already = sessionStorage.getItem('gold_applied_done');
      // try several paths so file:// or relative opens work (supports /products.applied.json and relative files)
      let test = null; const tryPaths = ['/products.applied.merged.json','/products.applied.json','products.applied.merged.json','products.applied.json','./products.applied.merged.json','./products.applied.json'];
      for(const p of tryPaths){ try{ test = await fetchWithTimeout(p, {}, 7000); if(test && test.ok) break; }catch(e){ test = null; } }
      if(test && test.ok){
        const j = await test.json();
        if(!already){
          const backupKey = 'gold_products_backup_auto_' + Date.now();
          localStorage.setItem(backupKey, localStorage.getItem('gold_products') || '');
          localStorage.setItem('gold_products', JSON.stringify(j));
          sessionStorage.setItem('gold_applied_done', ''+Date.now());
          showToast('Applied cleaned catalog and saved backup: ' + backupKey);
        }
        // set catalog, then try to restore titles/images from the original CSV by merging
        CATALOG = j;
        (async ()=>{
          try{
            let resp=null; const tryPaths = ['/products.csv','products.csv','./products.csv','/whatsapp_products.csv.csv','whatsapp_products.csv.csv','./whatsapp_products.csv.csv'];
            for(const p of tryPaths){ try{ resp = await fetchWithTimeout(p, {}, 7000); if(resp && resp.ok) break; }catch(e){ resp = null; } }
            if(resp && resp.ok){
              const txt = await resp.text();
              const lines = txt.split(/\r?\n/);
              const starts = [];
              for(let i=0;i<lines.length;i++) if(/^"\d+/.test(lines[i].trim())) starts.push(i);
              const map = {};
              for(let b=0;b<starts.length;b++){
                const s = starts[b]; const e = (b+1<starts.length)? starts[b+1] : lines.length;
                const block = lines.slice(s,e).join('\n');
                const idm = block.match(/^"(\d+)/);
                if(!idm) continue;
                const id = idm[1];
                let title = '';
                let mm;
                const re = /""([^\"]+)""/g; while((mm=re.exec(block))){ const t = mm[1].trim(); if(!/Size\s*&?\s*Price/i.test(t) && t.length>1){ title = t; break; } }
                if(!title){ const re2 = /"([^\"]+)"/g; while((mm=re2.exec(block))){ const t = mm[1].trim(); if(!/Size\s*&?\s*Price/i.test(t) && t.length>1){ title = t; break; } } }
                title = title.replace(/^\*+/,'').replace(/\*+$/,'').replace(/\,$/,'').trim();
                const imgm = block.match(/https?:\/\/[^\s\"']+/i);
                const img = imgm? imgm[0] : '';
                if(title || img) map[id] = { title, img };
              }
              // apply map
              CATALOG.forEach(cat=> cat.items.forEach(it=>{ const mm = map[it.id]; if(mm){ if(mm.title && mm.title.length>0) it.title = mm.title; if(mm.img && mm.img.length>0) it.img = mm.img; } }));
              saveCatalogToLocal();
              showToast('Restored titles/images from CSV (merged)');
            }
          }catch(e){ console.warn('Failed to restore titles/images', e); }
        })();
        return;
      }
    }catch(e){ /* ignore */ }

    // if admin previously saved products to localStorage, prefer them
    const saved = localStorage.getItem('gold_products');
    if(saved){
      CATALOG = JSON.parse(saved);
      return;
    }
    // try multiple paths to make CSV load work both when served and when opened as a local file
    let resp = null; const tryPaths = ['/products.csv','products.csv','./products.csv','/whatsapp_products.csv.csv','whatsapp_products.csv.csv','./whatsapp_products.csv.csv'];
    for(const p of tryPaths){ try{ resp = await fetch(p); if(resp && resp.ok) break; }catch(e){ resp = null; } }
    if(!resp) throw new Error('CSV not found');
    const txt = await resp.text();    const rows = parseCSV(txt);
    const header = rows[0];
    const colIndex = (name)=> header.indexOf(name);
    const idx_id = colIndex('id');
    const idx_name = colIndex('name');
    const idx_desc = colIndex('description');
    const idx_img = colIndex('image_url');
    const idx_price = colIndex('price');

    const groups = {};
    for(let i=1;i<rows.length;i++){
      const r = rows[i];
      const id = r[idx_id] || ('r'+i);
      const title = r[idx_name] || 'Untitled';
      const desc = r[idx_desc] || '';
      const img = (r[idx_img] && r[idx_img].startsWith('http')) ? r[idx_img] : 'mini.png';
      // prefer explicit CSV price column if provided
      let csvPrice = 0;
      if(idx_price>=0){
        const raw = (r[idx_price]||'').toString();
        const num = Number(raw.replace(/[^0-9\.]/g,'').replace(/,/g,''));
        if(!isNaN(num) && num>0) csvPrice = num;
      }
      const descPrice = extractFirstPrice(desc) || 0;
      const priceNum = csvPrice || descPrice || 0;
      const category = guessCategory(desc,title);
      const variants = extractVariants(desc);
      // if variants exist but some variants lack price, fill with csvPrice or descPrice
      if(variants && variants.length>0){
        variants.forEach(v=>{ if(!v.price || isNaN(Number(v.price)) || Number(v.price)===0){ v.price = csvPrice || descPrice || v.price || 0; } v.price = Number(v.price||0); });
      }
      // if no variants but there is a price, create default variant
      const finalVariants = (variants && variants.length>0)?variants: [{size:'Default',price:priceNum}];
      const item = {id,title,desc,price: priceNum || (finalVariants[0] && finalVariants[0].price) || 0,size:'custom',img,flag:'',variants:finalVariants};
      if(!groups[category]) groups[category]=[];
      groups[category].push(item);
    }
    CATALOG = Object.keys(groups).map(k=>({category:k,items:groups[k]}));
  }catch(e){
    console.error('Failed to load CSV',e);
    // fallback to empty catalog
    CATALOG = [];
  }
  // final healthcheck: if we still have no items, show diagnostics and a helpful toast
  try{
    const total = (CATALOG && Array.isArray(CATALOG)) ? CATALOG.reduce((s,c)=>s + (c.items?c.items.length:0),0) : 0;
    if(!total){ showToast('Loading catalog...'); try{ showCatalogDiagnostics(); }catch(e){ } }
  }catch(e){ console.warn('post-catalog check failed', e); }
}

function saveCatalogToLocal(){ 
  const count = (CATALOG && CATALOG.length) ? CATALOG.reduce((s,c)=>s+(c.items?c.items.length:0),0) : 0;
  console.log('[SAVE] Saving', count, 'products to localStorage');
  localStorage.setItem('gold_products', JSON.stringify(CATALOG)); 
}

// Diagnostics helper: disabled for client-facing website
function showCatalogDiagnostics(){
  // Disabled: diagnostic overlays are not shown on client-facing websites
  return;
}


// simple session encryption for localStorage using WebCrypto (per-session key)
async function getCryptoKey(){
  const maybe = sessionStorage.getItem('g_key');
  if(maybe) return await importKey(hexToBuf(maybe));
  const key = await window.crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt','decrypt']);
  const raw = await window.crypto.subtle.exportKey('raw',key);
  sessionStorage.setItem('g_key',bufToHex(raw));
  return key;
}
async function importKey(raw){
  return await window.crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},true,['encrypt','decrypt']);
}
function bufToHex(buf){return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('')}
function hexToBuf(hex){const bytes=new Uint8Array(hex.match(/.{1,2}/g).map(b=>parseInt(b,16)));return bytes.buffer}
async function encryptJSON(obj){
  const key = await getCryptoKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(obj));
  const enc = await window.crypto.subtle.encrypt({name:'AES-GCM',iv},key,data);
  return bufToHex(iv) + ':' + bufToHex(enc);
}
async function decryptJSON(st){
  try{
    const [ivHex,ctHex]=st.split(':');
    const iv=new Uint8Array(ivHex.match(/.{1,2}/g).map(h=>parseInt(h,16)));
    const key = await getCryptoKey();
    const ct = hexToBuf(ctHex);
    const dec = await window.crypto.subtle.decrypt({name:'AES-GCM',iv},key,ct);
    return JSON.parse(new TextDecoder().decode(dec));
  }catch(e){return null} }

// storage helpers
async function saveCart(cart){
  const enc = await encryptJSON(cart);
  localStorage.setItem('gold_cart',enc);
}
async function loadCart(){
  const v = localStorage.getItem('gold_cart');
  if(!v) return [];
  const dec = await decryptJSON(v);
  return dec||[];
}

// helper: find product by id OR by title fallback in current catalog
function findItemById(idOrTitle){
  if(!idOrTitle) return null;
  const token = (idOrTitle||'').toString().trim();
  const lower = token.toLowerCase();
  // quick exact id/title match
  for(const cat of CATALOG){
    const found = cat.items.find(it=> it.id === token || (it.title && (it.title === token || it.title.toLowerCase() === lower)));
    if(found) return found;
  }
  // loose heuristics: substring match against id, title, or image url
  for(const cat of CATALOG){
    const found = cat.items.find(it=>{
      if(!it) return false;
      if(it.id && it.id.toString().toLowerCase().includes(lower)) return true;
      if(it.title && it.title.toLowerCase().replace(/\s+/g,'').includes(lower)) return true;
      if(it.title && it.title.toLowerCase().includes(lower)) return true;
      if(it.img && it.img.toLowerCase().includes(lower)) return true;
      // check title word starts/contains
      if(it.title){ const parts = it.title.toLowerCase().split(/\W+/).filter(Boolean); for(const p of parts){ if(p.startsWith(lower) || lower.startsWith(p) || p.includes(lower)) return true; } }
      return false;
    });
    if(found) return found;
  }
  return null;
}

// snapshot item to store in cart/wishlist (ensure title/img present)
function snapshotItem(it){
  if(!it) return null;
  return {
    id: it.id,
    title: (it.title && it.title.length>0) ? it.title : it.id,
    img: it.img || 'mini.png',
    price: Number(it.price || (it.variants && it.variants[0] && it.variants[0].price) || 0),
    size: it.size || null,
    variants: it.variants || []
  };
}

// render
function $(id){return document.getElementById(id)}
function el(tag,cls){const e=document.createElement(tag); if(cls) e.className=cls; return e}

function getIconPath(){
  return (window.location.pathname.includes('/pages/') ? '../' : './') + 'assets/icons/png/';
}

function normalizeVariant(v){
  if(!v) return { size: '', price: '' };
  let size = v.size, price = v.price;
  if((!v.price || v.price === undefined) && v.size && /[:\-\|=]/.test(v.size)) {
    const parts = v.size.split(/[:\-\|=]/);
    size = parts[0].trim();
    price = (parts[1]||'').replace(/[^0-9.]/g,'').trim();
  }
  return { size, price };
}

function getFrameText(it){
  return (it && it.frameInfo && it.frameInfo.toLowerCase().includes('frame included')) ? 'Frame Included' : 'Frameless';
}

function buildVariantLineHtml(variant, frameText, isSelected) {
  const iconPath = getIconPath();
  const safeSize = (variant && variant.size) ? variant.size : '';
  const safePrice = (variant && variant.price !== undefined && variant.price !== null && variant.price !== '') ? variant.price : '—';
  const framePart = frameText ? ` <img src='${iconPath}right-arrow.png' alt='→' style='width:16px;height:16px;vertical-align:middle;margin:0 4px;display:inline-block;opacity:0.6;' /><span style="color:#aaa;">${frameText}</span>` : '';
  let selectedHtml = '';
  if (isSelected) {
    selectedHtml = ` <span style="color:var(--gold);font-weight:900;margin-left:6px;display:inline-flex;align-items:center;gap:2px;">Selected <img src='${iconPath}check.png' alt='Selected' style='width:18px;height:18px;vertical-align:middle;display:inline-block;margin-left:2px;' /></span>`;
  }
  return `<span style='display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;'>` +
    `<span>${safeSize}</span>` +
    `<img src='${iconPath}space.png' alt='-' style='width:18px;height:18px;vertical-align:middle;margin:0 2px;display:inline-block;' />` +
    `<span>${safePrice} EGP</span>` +
    `${selectedHtml}</span>${framePart}`;
}

function getDefaultVariant(it){
  if(it && it.variants && it.variants[0]){
    const normalized = normalizeVariant(it.variants[0]);
    return Object.assign({}, it.variants[0], normalized);
  }
  return null;
}

function ensureSizeModal() {
  const existing = document.getElementById('sizeModal');
  if (existing && existing._refs) return existing._refs;
  const modal = el('div', 'modal size-modal hidden');
  modal.id = 'sizeModal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-hidden', 'true');

  const panel = el('div');
  panel.className = 'modal-panel size-modal-panel';
  panel.innerHTML = `
    <button class="modal-close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
    <div class="size-modal-header">
      <div class="size-modal-title">Sizes & Prices</div>
      <div class="size-modal-frame"></div>
    </div>
    <div class="size-modal-sub">Choose your preferred size</div>
    <div class="size-modal-list"></div>
  `;
  modal.appendChild(panel);
  document.body.appendChild(modal);

  const close = () => { modal.classList.add('hidden'); modal.setAttribute('aria-hidden', 'true'); };
  panel.querySelector('.modal-close').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  window.addEventListener('keyup', function onKey(e) { if (e.key === 'Escape' && !modal.classList.contains('hidden')) close(); });

  modal._refs = {
    modal,
    panel,
    title: panel.querySelector('.size-modal-title'),
    frame: panel.querySelector('.size-modal-frame'),
    list: panel.querySelector('.size-modal-list')
  };
  return modal._refs;
}

function openSizeModal(product, onChoose, selectedVariant) {
  const refs = ensureSizeModal();
  const frameText = getFrameText(product);
  refs.title.textContent = product && product.title ? product.title : 'Sizes & Prices';
  refs.frame.textContent = frameText;
  refs.list.innerHTML = '';
  const variants = (product && product.variants) ? product.variants : [];
  if (!variants || variants.length === 0) {
    refs.list.innerHTML = `<div class="size-modal-empty">No sizes available</div>`;
  } else {
    variants.forEach(v => {
      const normalized = normalizeVariant(v);
      const isSelected = selectedVariant && normalized.size === selectedVariant.size && normalized.price == selectedVariant.price;
      const row = document.createElement('div');
      row.className = 'size-modal-item';
      if (isSelected) row.style.border = '2px solid var(--gold)';
      const infoWrap = document.createElement('div');
      infoWrap.className = 'size-modal-info-wrap';
      const info = document.createElement('div');
      info.className = 'size-modal-info';
      info.innerHTML = buildVariantLineHtml(normalized, '', isSelected);
      const meta = document.createElement('div');
      meta.className = 'size-modal-meta';
      meta.textContent = frameText;
      infoWrap.appendChild(info);
      infoWrap.appendChild(meta);

      const choose = document.createElement('button');
      choose.className = 'size-modal-choose';
      choose.setAttribute('type', 'button');
      choose.textContent = isSelected ? 'Selected' : 'Select';
      choose.style.background = isSelected ? 'var(--gold)' : 'linear-gradient(120deg,#f7dfb3,#d4af37)';
      choose.style.color = isSelected ? '#000' : '#000';
      choose.style.fontWeight = '900';
      choose.addEventListener('click', () => {
        const chosen = Object.assign({}, v, normalized);
        if (onChoose) onChoose(chosen);
        refs.modal.classList.add('hidden');
        refs.modal.setAttribute('aria-hidden', 'true');
      });

      row.appendChild(infoWrap);
      row.appendChild(choose);
      refs.list.appendChild(row);
    });
  }
  refs.modal.classList.remove('hidden');
  refs.modal.setAttribute('aria-hidden', 'false');
}

function createVariantPopupUI(card, it) {
  const state = { chosen: null };
  if (!(it && it.variants && it.variants.length > 0)) return state;
  const note = el('div', 'variant-note');
  const defaultVariant = getDefaultVariant(it);
  const normalized = defaultVariant || normalizeVariant(it.variants[0]);
  const frameText = getFrameText(it);
  note.innerHTML = buildVariantLineHtml(normalized, frameText, true);
  state.chosen = defaultVariant || null;
  card._variantChosen = state.chosen;
  card.appendChild(note);

  const btn = el('button', 'variant-btn');
  btn.setAttribute('type', 'button');
  btn.innerHTML = `
    <span style="display:inline-flex;align-items:center;gap:7px;">
      <img src="${getIconPath()}tap.gif" alt="Tap here" style="width:22px;height:22px;vertical-align:middle;display:inline-block;" />
      <span style="color:var(--gold);">View sizes & price</span>
    </span>
  `;
  btn.style.background = '#000';
  btn.style.border = '2px solid var(--gold)';
  btn.style.color = 'var(--gold)';
  btn.style.fontWeight = '900';
  btn.style.width = '100%';
  btn.style.marginTop = '8px';
  btn.style.display = 'flex';
  btn.style.alignItems = 'center';
  btn.style.justifyContent = 'center';
  btn.style.gap = '7px';
  btn.style.fontSize = '16px';
  btn.style.borderRadius = '10px';
  btn.style.boxShadow = '0 8px 30px rgba(182,139,42,0.12)';
  btn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    openSizeModal(it, (chosen) => {
      state.chosen = chosen;
      card._variantChosen = chosen;
      note.innerHTML = buildVariantLineHtml(chosen, frameText, true);
    }, state.chosen);
  });
  card.appendChild(btn);
  return state;
}

async function renderCatalog(){
  const iconPath = getIconPath();
  const container = $('catalog'); if(!container) return; container.innerHTML='';
  if(CATALOG.length===0){
    // attempt to load CSV if not already loaded
    await loadCatalogFromCSV();
  }
  // If still empty, attempt to restore from any local backup keys (fix for accidental overwrites)
  if(CATALOG.length===0){
    try{
      const bk = Object.keys(localStorage).filter(k=>k.indexOf('gold_products_backup_')===0).sort().reverse();
      for(const k of bk){
        try{
          const v = localStorage.getItem(k);
          if(!v) continue;
          const parsed = JSON.parse(v);
          if(parsed && parsed.length>0){ CATALOG = parsed; saveCatalogToLocal(); showToast('Restored catalog from backup: '+k); break; }
        }catch(_) { continue; }
      }
    }catch(e){ console.warn('Backup restore failed', e); }
  }
  // If no catalog yet, show placeholder categories so Home is not blank
  if(CATALOG.length===0){ const desiredOrder = ['Painting Art','Canvas print','Antiques & Plants','one of one Piece']; desiredOrder.forEach(catName=>{ const block = el('div','category'); const h = el('h3'); h.textContent = catName; block.appendChild(h); const grid = el('div','products'); grid.innerHTML = '<div style="color:#bbb;padding:12px">No products yet</div>'; block.appendChild(grid); container.appendChild(block); }); return }
  // support single-category pages by using data-category attribute on #catalog
  const onlyCategory = (container.dataset && container.dataset.category) ? container.dataset.category.trim().toLowerCase() : null;
  const desiredOrder = ['Painting Art','Canvas print','Antiques & Plants','one of one Piece'];
  // build categories list from persisted categories so we always show them even if empty
  const catNames = loadCategories();
  const effectiveCats = onlyCategory ? catNames.filter(n=> n.toLowerCase() === onlyCategory) : catNames.slice();
  // ensure we include any categories present in the loaded catalog that are missing from persisted list
  try{ const present = new Set(effectiveCats.map(n=>n)); CATALOG.forEach(c=>{ if(c && c.category && !present.has(c.category)){ effectiveCats.push(c.category); present.add(c.category); } }); }catch(e){}
  const cats = effectiveCats.map(name=>{ const found = CATALOG.find(c=>c.category && c.category === name); return { category: name, items: (found && found.items) ? found.items : [] }; });
  if(onlyCategory && cats.length===0){ container.innerHTML = `<p style="color:#eee">No products found in "${container.dataset.category}" yet.</p>`; return }

  // If a search query is present, show search results with filters and sorting
  if(window._gold_searchQuery){
    const q = (window._gold_searchQuery||'').toString(); const tokens = q.replace(/[×xX]/g,'x').replace(/\s+/g,' ').trim().split(' ').filter(Boolean);
    const rawResults = searchCatalog(q) || [];
    // build controls
    const block = el('div','category'); const header = el('div'); header.className='category-header'; const h = el('h3'); h.textContent = `Search results for "${q}"`; header.appendChild(h);
    const controls = el('div'); controls.style.display='flex'; controls.style.gap='8px'; controls.style.alignItems='center'; controls.style.marginTop='8px';
    const minInput = el('input'); minInput.placeholder = 'Min price'; minInput.type='number'; minInput.style.width='100px'; minInput.value = (window._gold_searchFilters && window._gold_searchFilters.min) ? window._gold_searchFilters.min : '';
    const maxInput = el('input'); maxInput.placeholder = 'Max price'; maxInput.type='number'; maxInput.style.width='100px'; maxInput.value = (window._gold_searchFilters && window._gold_searchFilters.max) ? window._gold_searchFilters.max : '';
    const sizeSel = el('select'); const sizeOpt = document.createElement('option'); sizeOpt.value=''; sizeOpt.textContent='All sizes'; sizeSel.appendChild(sizeOpt);
    const allSizes = new Set(); rawResults.forEach(r=>{ const v = (r.item.variants||[]).map(vv=>vv.size).filter(Boolean); v.forEach(s=> allSizes.add(s)); if(r.item.size) allSizes.add(r.item.size); }); Array.from(allSizes).slice(0,50).forEach(s=>{ const o = el('option'); o.value = s; o.textContent = s; sizeSel.appendChild(o); }); sizeSel.value = (window._gold_searchFilters && window._gold_searchFilters.size) ? window._gold_searchFilters.size : '';
    const sortSel = el('select'); sortSel.style.minWidth='160px'; ['relevance','price-asc','price-desc','title'].forEach(opt=>{ const o = el('option'); o.value=opt; o.textContent = opt==='relevance' ? 'Relevance' : (opt==='price-asc' ? 'Price ↑' : (opt==='price-desc' ? 'Price ↓' : 'Title')); sortSel.appendChild(o); }); sortSel.value = (window._gold_searchFilters && window._gold_searchFilters.sort) ? window._gold_searchFilters.sort : 'relevance';
    const applyBtn = el('button'); applyBtn.className='admin-btn'; applyBtn.textContent='Apply filters'; applyBtn.addEventListener('click',()=>{ window._gold_searchFilters = { sort: sortSel.value, min: Number(minInput.value||0), max: Number(maxInput.value||0), size: sizeSel.value }; renderCatalog(); });
    const clearBtn = el('button'); clearBtn.className='admin-btn'; clearBtn.textContent='Clear search'; clearBtn.addEventListener('click',()=>{ delete window._gold_searchQuery; history.pushState({},'', window.location.pathname); renderCatalog(); });
    controls.appendChild(minInput); controls.appendChild(maxInput); controls.appendChild(sizeSel); controls.appendChild(sortSel); controls.appendChild(applyBtn); controls.appendChild(clearBtn);
    header.appendChild(controls); block.appendChild(header);

    // apply filters and sorting
    let results = rawResults.slice(); const f = window._gold_searchFilters || {sort:'relevance',min:0,max:0,size:''}; if(f.min) results = results.filter(r=>{ const p = (r.item.variants && r.item.variants[0] && r.item.variants[0].price) || r.item.price || 0; return p >= f.min; }); if(f.max) results = results.filter(r=>{ const p = (r.item.variants && r.item.variants[0] && r.item.variants[0].price) || r.item.price || 0; return p <= f.max; }); if(f.size) results = results.filter(r=>{ const sizes = (r.item.variants||[]).map(v=>v.size).concat([r.item.size||'']); return sizes.some(s=> (s+'').toLowerCase().includes((''+f.size).toLowerCase())); });
    if(f.sort === 'price-asc') results.sort((a,b)=> ((a.item.variants && a.item.variants[0] && a.item.variants[0].price) || a.item.price || 0) - ((b.item.variants && b.item.variants[0] && b.item.variants[0].price) || b.item.price || 0));
    if(f.sort === 'price-desc') results.sort((a,b)=> ((b.item.variants && b.item.variants[0] && b.item.variants[0].price) || b.item.price || 0) - ((a.item.variants && a.item.variants[0] && a.item.variants[0].price) || a.item.price || 0));
    if(f.sort === 'title') results.sort((a,b)=> (''+(a.item.title||'')).localeCompare(''+(b.item.title||'')));
    // render grid
    const grid = el('div','products'); try{ grid.style.gridTemplateColumns = 'repeat(2,minmax(0,1fr))'; }catch(e){}
    results.forEach(r=>{ const it = r.item; const card = el('div','product-card'); card.style.position='relative'; const decorDiv = el('div','card-decor'); card.appendChild(decorDiv); const img = el('img'); img.src = it.img || 'mini.png'; img.alt = it.title||''; img.style.cursor='pointer'; img.loading='lazy'; img.decoding='async'; img.setAttribute('importance','low'); img.addEventListener('click', ()=>{ try{ showImageLightbox(it.img || 'mini.png', it); }catch(e){} }); card.appendChild(img); const logoOL = el('img','card-logo-overlay'); logoOL.src = (window.location.pathname.includes('/pages/') ? '../' : './') + 'logo.png'; card.appendChild(logoOL); const title = el('h4'); title.textContent = it.title||''; card.appendChild(title); const price = el('p','price'); const pval = (it.variants && it.variants[0] && it.variants[0].price) || it.price || 0; let priceStr = `EGP ${pval}`; try{ if(APPLIED_COUPON && couponAppliesTo(APPLIED_COUPON, it.id)){
      if(APPLIED_COUPON.type==='percent'){ const newP = Math.round(pval * (1 - (APPLIED_COUPON.value/100))); priceStr = `<span style='text-decoration:line-through;color:#888;margin-right:8px'>EGP ${pval}</span><span>EGP ${newP} <small style='color:#afa'>(-${APPLIED_COUPON.value}%)</small></span>`; }
      else { const take = Math.min(Number(APPLIED_COUPON.value||0), pval); const newP = Math.max(0, pval - take); priceStr = `<span style='text-decoration:line-through;color:#888;margin-right:8px'>EGP ${pval}</span><span>EGP ${newP} <small style='color:#afa'>(-EGP ${take})</small></span>`; }
    } }catch(e){}
    price.innerHTML = priceStr; card.appendChild(price);
    const variantState = createVariantPopupUI(card, it);
    const actions = el('div','card-actions stacked'); actions.style.marginTop='8px'; const add = el('button','btn add-to-cart uiverse-btn'); add.setAttribute('type','button'); add.dataset.id = it.id; add.dataset.label = 'Own This Piece'; add.title = 'Own this piece'; add.textContent='Own This Piece'; add.addEventListener('click',(ev)=>{ ev.stopPropagation(); try{ add.dataset.handled='1'; }catch(e){} const chosen = (variantState && variantState.chosen) ? variantState.chosen : getDefaultVariant(it); addToCart(Object.assign({},it,{chosen, qty:1})); setTimeout(()=>{ try{ delete add.dataset.handled }catch(e){} },400); }); const row1 = el('div'); row1.className = 'row'; row1.appendChild(add); actions.appendChild(row1); card.appendChild(actions); grid.appendChild(card); });
    block.appendChild(grid); container.appendChild(block);
    return; }

  cats.forEach(cat=>{ 
    // if we are on a category page (URL param), show expanded list
    const catFilter = window._gold_urlCategory ? window._gold_urlCategory.toLowerCase() : null;
    if(catFilter && cat.category.toLowerCase() !== catFilter) return;

    const block = el('div', 'category');
    // header with Browse All and row nav
    const header = el('div'); header.className = 'category-header'; 
    const h = el('h3'); h.className = 'category-title-shiny'; h.textContent = cat.category; header.appendChild(h);
    if(!catFilter){
      h.setAttribute('role','button');
      h.setAttribute('tabindex','0');
      h.setAttribute('title', `Open ${cat.category}`);
      h.addEventListener('click', ()=> openCategoryView(cat.category));
      h.addEventListener('keydown', (ev)=>{
        if(ev.key === 'Enter' || ev.key === ' '){
          ev.preventDefault();
          openCategoryView(cat.category);
        }
      });
    }
    const rightWrap = el('div'); rightWrap.style.display='flex'; rightWrap.style.gap='8px';
    
    // If we're on a category page, show back button instead of browse all
    const catPage = !!window._gold_urlCategory;
    if(catPage){
      const backBtn = el('button'); backBtn.className='btn browse-all uiverse-btn'; backBtn.dataset.label = '← Back to Home'; backBtn.textContent = '← Back to Home'; backBtn.setAttribute('type','button');
      backBtn.addEventListener('click',(ev)=>{ ev.preventDefault(); delete window._gold_urlCategory; history.pushState({}, '', window.location.pathname); renderCatalog(); window.scrollTo({top:0,behavior:'smooth'}); });
      rightWrap.appendChild(backBtn);
    } else {
      const browse = el('button'); browse.className='btn browse-all uiverse-btn'; browse.dataset.label = 'Browse all'; browse.textContent = 'Browse all'; browse.setAttribute('type','button');
      browse.addEventListener('click',(ev)=>{ ev.preventDefault(); openCategoryView(cat.category); });
      rightWrap.appendChild(browse);
    }
    header.appendChild(rightWrap);
    block.appendChild(header);

    // if user requested a category page, render full-grid instead of a single scroller
    if(catPage){
      const grid = el('div','products');
      if(cat.items && cat.items.length>0) cat.items.sort((a,b)=>(''+(a.title||'')).localeCompare((''+(b.title||'')), undefined, { sensitivity: 'base' }));
      // pagination - calculate page size based on screen width (dynamic to support responsive grid)
      let pageSize = 30; // default: 4 cols × 8 rows (or 2 cols × 15 rows on mobile)
      if(window.innerWidth < 640) pageSize = 12; // 2 cols × 6 rows on mobile
      else if(window.innerWidth < 900) pageSize = 16; // 2 cols × 8 rows on tablet
      else pageSize = 32; // 4 cols × 8 rows on desktop
      const sp = new URLSearchParams(window.location.search); const page = Math.max(1, Number(sp.get('page')||1)); const totalItems = (cat.items||[]).length; const totalPages = Math.max(1, Math.ceil(totalItems / pageSize)); const curPage = Math.min(page, totalPages);
      const start = (curPage - 1) * pageSize; const end = start + pageSize; const pageItems = (cat.items || []).slice(start, end);

      const makeNav = ()=>{
        const nav = el('div','pagination'); nav.style.display='flex'; nav.style.justifyContent='center'; nav.style.gap='8px'; nav.style.marginTop='12px';
        const iconPath = (window.location.pathname.includes('/pages/') ? '../' : './') + 'assets/icons/png/';
        const makeBtn = (p, txt)=>{ const b = el('button'); b.innerHTML = txt||p; b.className='page-btn'; if(p===curPage) b.classList.add('active'); b.addEventListener('click', ()=>{ const s = new URLSearchParams(window.location.search); s.set('category', cat.category); s.set('page', p); history.pushState({},'', '?'+ s.toString()); renderCatalog(); window.scrollTo({top:0,behavior:'smooth'}); }); return b; };
        nav.appendChild(makeBtn(Math.max(1, curPage-1), `<img src="${iconPath}left-arrow.png" alt="Previous">`));
        const startPage = Math.max(1, curPage - 3); const endPage = Math.min(totalPages, startPage + 6);
        for(let p = startPage; p<=endPage; p++){ nav.appendChild(makeBtn(p)); }
        nav.appendChild(makeBtn(Math.min(totalPages, curPage+1), `<img src="${iconPath}right-arrow.png" alt="Next">`));
        return nav;
      };

      if(totalPages>1) block.appendChild(makeNav());

      pageItems.forEach(it=>{
        const card = el('div','product-card'); card.style.position='relative';
        const decorDiv = el('div','card-decor'); card.appendChild(decorDiv);
        const img = el('img'); img.src = it.img || 'mini.png'; img.alt = it.title||''; img.style.cursor='pointer'; img.loading='lazy'; img.decoding='async'; img.setAttribute('importance','low'); img.addEventListener('click', ()=>{ try{ showImageLightbox(it.img || 'mini.png', it); }catch(e){ console.warn('lightbox failed',e); } }); card.appendChild(img);
        const logoOL = el('img','card-logo-overlay'); logoOL.src = (window.location.pathname.includes('/pages/') ? '../' : './') + 'logo.png'; card.appendChild(logoOL);
        const title = el('h4'); title.textContent = it.title||''; card.appendChild(title);
        const price = el('p','price'); const pval = ((it.variants && it.variants[0] && it.variants[0].price) || it.price || 0); let pHtml = `EGP ${pval}`; try{ if(APPLIED_COUPON && couponAppliesTo(APPLIED_COUPON, it.id)){
            if(APPLIED_COUPON.type === 'percent'){ const newP = Math.round(pval * (1 - (APPLIED_COUPON.value/100))); pHtml = `<span style='text-decoration:line-through;color:#888;margin-right:8px'>EGP ${pval}</span><span>EGP ${newP} <small style='color:#afa'>(-${APPLIED_COUPON.value}%)</small></span>`; }
            else { const take = Math.min(Number(APPLIED_COUPON.value||0), pval); const newP = Math.max(0, pval - take); pHtml = `<span style='text-decoration:line-through;color:#888;margin-right:8px'>EGP ${pval}</span><span>EGP ${newP} <small style='color:#afa'>(-EGP ${take})</small></span>`; }
          } }catch(e){}
        price.innerHTML = pHtml; card.appendChild(price);
        const variantState = createVariantPopupUI(card, it);
        const actions = el('div'); actions.className='card-actions stacked'; actions.style.marginTop='8px';
        const row1 = el('div'); row1.className = 'row'; const add = el('button','btn add-to-cart uiverse-btn'); add.setAttribute('type','button'); add.dataset.id = it.id; add.dataset.label = 'Own This Piece'; add.title = 'Own this piece'; add.textContent='Own This Piece'; add.addEventListener('click',(ev)=>{ ev.stopPropagation(); try{ add.dataset.handled='1'; }catch(e){} const chosen = (variantState && variantState.chosen) ? variantState.chosen : getDefaultVariant(it); addToCart(Object.assign({},it,{chosen, qty:1})); setTimeout(()=>{ try{ delete add.dataset.handled }catch(e){} },400); }); row1.appendChild(add); actions.appendChild(row1);
        const row2 = el('div'); row2.className='row'; const hbt = el('button','fav-btn'); hbt.setAttribute('type','button'); hbt.innerHTML = '<img src="' + iconPath + 'black-heart.png" alt="Favorites">'; hbt.addEventListener('click',(ev)=>{ ev.stopPropagation(); toggleWishlist(it); renderFavorites(); }); row2.appendChild(hbt); actions.appendChild(row2); card.appendChild(actions);
        grid.appendChild(card);
      });

      block.appendChild(grid);
      if(totalPages>1) block.appendChild(makeNav());

    } else {
      // Row scroller: 2-column grid with horizontal scroll
      const prow = el('div','product-row'); 
      const track = el('div','row-track'); 
      prow.appendChild(track);
      
      if(cat.items && cat.items.length>0) cat.items.sort((a,b)=>(''+(a.title||'')).localeCompare((''+(b.title||'')), undefined, { sensitivity: 'base' }));
      
      // Calculate container width for scrolling: each column needs space for 2 items
      const colWidth = Math.floor((window.innerWidth - 40) / 2);
      
      // Add all items to track
      cat.items.forEach(it=>{
        const card = el('div','product-card'); card.style.position='relative';
        const decorDiv = el('div','card-decor'); card.appendChild(decorDiv);
        const img = el('img'); img.src = it.img || 'mini.png'; img.alt = it.title || ''; img.loading='lazy'; img.decoding='async'; img.setAttribute('importance','low'); img.style.cursor='pointer'; img.addEventListener('click', ()=>{ try{ showImageLightbox((it.img||'mini.png'), it); }catch(e){} }); card.appendChild(img);
        const logoOL = el('img','card-logo-overlay'); logoOL.src = (window.location.pathname.includes('/pages/') ? '../' : './') + 'logo.png'; logoOL.alt = '';
        logoOL.style.pointerEvents = 'none'; logoOL.style.opacity = '0.45'; logoOL.style.width = '20px'; logoOL.style.top = '8px'; logoOL.style.left = '8px'; card.appendChild(logoOL);
        const title = el('h4'); title.textContent = it.title || ''; card.appendChild(title);
        const catLabel = el('div','cat-label'); catLabel.textContent = cat.category || ''; card.appendChild(catLabel);
        const price = el('p','price'); const mainPrice = (it.variants && it.variants[0] && it.variants[0].price) ? it.variants[0].price : (it.price || 0); price.textContent = `${mainPrice} EGP`; card.appendChild(price);
        const variantState = createVariantPopupUI(card, it);
        const actions = el('div'); actions.className='card-actions stacked'; actions.style.marginTop='8px';
        const row1 = el('div'); row1.className = 'row'; const addBtn = el('button','btn add-to-cart uiverse-btn'); addBtn.setAttribute('type','button'); addBtn.dataset.id = it.id; addBtn.dataset.label = 'Own This Piece'; addBtn.setAttribute('aria-label','Own this piece'); addBtn.title = 'Own this piece'; addBtn.textContent='Own This Piece'; addBtn.addEventListener('click', (ev)=>{ ev.stopPropagation(); try{ addBtn.dataset.handled='1'; }catch(e){} const chosen = (variantState && variantState.chosen) ? variantState.chosen : getDefaultVariant(it); addToCart(Object.assign({}, it, { chosen, qty:1 })); setTimeout(()=>{ try{ delete addBtn.dataset.handled }catch(e){} },400); }); row1.appendChild(addBtn); actions.appendChild(row1);
        const row2 = el('div'); row2.className = 'row'; const heartBtn = el('button','fav-btn'); heartBtn.innerHTML='<img src="' + iconPath + 'black-heart.png" alt="Favorites">'; heartBtn.setAttribute('type','button'); heartBtn.setAttribute('aria-label','Add to favorites'); const isFav = (WISHLIST.findIndex(w=>w.id === it.id) >= 0); if(isFav) heartBtn.classList.add('active'); heartBtn.title = isFav ? 'Remove from favorites' : 'Add to favorites'; heartBtn.addEventListener('click', (ev)=>{ ev.stopPropagation(); const added = toggleWishlist(it); heartBtn.classList.toggle('active', added); heartBtn.title = added ? 'Remove from favorites' : 'Add to favorites'; renderFavorites(); }); row2.appendChild(heartBtn); actions.appendChild(row2);
        card.appendChild(actions);
        track.appendChild(card);
      });
      
      const navWrap = el('div','row-nav'); const left = el('button'); left.className='nav-btn'; left.innerHTML=`<img src="${iconPath}left-arrow.png" alt="Scroll left">`; const right = el('button'); right.className='nav-btn'; right.innerHTML=`<img src="${iconPath}right-arrow.png" alt="Scroll right">`; navWrap.appendChild(left); navWrap.appendChild(right); prow.appendChild(navWrap);
      // thin progress bar for this row
      const progress = el('div','row-progress'); const progressBar = el('div','row-progress-bar'); progress.appendChild(progressBar); prow.appendChild(progress);
      // subtle left/right edge indicators for touch affordance
      const leftEdge = el('div','row-edge row-edge-left'); leftEdge.innerHTML = `<img src="${iconPath}left-arrow.png" alt="Scroll left">`; const rightEdge = el('div','row-edge row-edge-right'); rightEdge.innerHTML = `<img src="${iconPath}right-arrow.png" alt="Scroll right">`; prow.appendChild(leftEdge); prow.appendChild(rightEdge);
      // update row state (progress and indicators)
      let _rowThrottle = null; function updateRowState(){ if(_rowThrottle) clearTimeout(_rowThrottle); _rowThrottle = setTimeout(()=>{ const max = track.scrollWidth - track.clientWidth; const pos = track.scrollLeft; const pct = (max>0) ? Math.max(0, Math.min(1, pos / max)) : 0; progressBar.style.width = (pct * 100) + '%'; leftEdge.style.opacity = pct > 0.02 ? '1' : '0'; rightEdge.style.opacity = pct < 0.98 ? '1' : '0'; left.style.opacity = pct > 0.02 ? '1' : '0.4'; left.style.pointerEvents = pct > 0.02 ? 'auto' : 'none'; right.style.opacity = pct < 0.98 ? '1' : '0.4'; right.style.pointerEvents = pct < 0.98 ? 'auto' : 'none'; },30); }
      // Enable scrolling for all browsers
      track.style.overflowX = 'auto'; track.style.webkitOverflowScrolling = 'touch'; track.style.touchAction = 'pan-y pinch-zoom';
      // pointer drag + light momentum
      // Keep natural vertical scroll working even when the gesture starts on a card
      let isPointerDown=false, dragStarted=false, startX=0, startY=0, startScroll=0, lastMoveTime=0, lastMoveX=0, velocity=0, momentumFrame=0; 
      const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const cards = ()=> Array.from(track.querySelectorAll('.product-card'));
      const updateCardMotion = ()=>{
        if(prefersReducedMotion) return;
        const tr = track.getBoundingClientRect();
        const center = tr.left + (tr.width / 2);
        const half = Math.max(1, tr.width / 2);
        cards().forEach((card)=>{
          const cr = card.getBoundingClientRect();
          const cardCenter = cr.left + (cr.width / 2);
          const normalized = Math.max(-1, Math.min(1, (cardCenter - center) / half));
          const abs = Math.abs(normalized);
          const shiftX = -normalized * 8;
          const tiltY = normalized * 5;
          const scale = 1 - (abs * 0.05);
          card.style.transform = `translate3d(${shiftX}px,0,0) rotateY(${tiltY}deg) scale(${scale})`;
          card.style.opacity = String(1 - (abs * 0.18));
        });
      };
      const clearMomentum = ()=>{
        if(momentumFrame){
          cancelAnimationFrame(momentumFrame);
          momentumFrame = 0;
        }
        track.classList.remove('kinetic');
      };
      track.addEventListener('pointerdown',(e)=>{ 
        clearMomentum();
        isPointerDown=true; dragStarted=false; startX = e.clientX; startY = e.clientY; startScroll = track.scrollLeft; lastMoveTime = Date.now(); lastMoveX = startX; track.classList.remove('dragging'); 
      }); 
      track.addEventListener('pointermove',(e)=>{ 
        if(!isPointerDown) return; 
        const dx = e.clientX - startX; 
        const dy = e.clientY - startY;
        
        // If the gesture is mostly vertical, hand control back to the page immediately
        if(!dragStarted && Math.abs(dy) > Math.abs(dx) * 1.1){
          isPointerDown = false;
          dragStarted = false;
          track.classList.remove('dragging');
          return;
        }

        if(!dragStarted){
          if(Math.abs(dx) <= 8) return;
          dragStarted = true;
          track.classList.add('dragging');
          try{ if(track.setPointerCapture) track.setPointerCapture(e.pointerId); }catch(err){}
        }
        e.preventDefault(); 
        track.scrollLeft = startScroll - dx; 
        const now = Date.now(); velocity = (lastMoveX - e.clientX) / (now - lastMoveTime + 1); lastMoveTime = now; lastMoveX = e.clientX; updateRowState(); 
        updateCardMotion();
      }); 
      const endDrag = (e)=>{ 
        if(!isPointerDown) return; isPointerDown=false; 
        if(dragStarted){ e.preventDefault(); dragStarted=false; } 
        track.classList.remove('dragging'); 
        // Natural momentum for a more realistic horizontal feel
        const applyMomentum = ()=>{ 
          // more tactile momentum feel: lower stop threshold, stronger initial push and slightly slower damping
          if(Math.abs(velocity) > 0.02){ 
            track.classList.add('kinetic');
            track.scrollLeft += velocity * 22; 
            velocity *= 0.9;
            updateRowState();
            updateCardMotion();
            momentumFrame = requestAnimationFrame(applyMomentum); 
          } else { 
            velocity = 0;
            clearMomentum();
            updateCardMotion();
          } 
        };
        clearMomentum();
        momentumFrame = requestAnimationFrame(applyMomentum); 
      }; 
      track.addEventListener('pointerup', endDrag); 
      track.addEventListener('pointercancel', endDrag); 
      track.addEventListener('pointerleave', endDrag);
      track.addEventListener('wheel',(e)=>{
        const max = track.scrollWidth - track.clientWidth;
        if(max <= 0) return;
        if(Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
        const next = Math.max(0, Math.min(max, track.scrollLeft + e.deltaX));
        if(next === track.scrollLeft) return;
        e.preventDefault();
        track.scrollLeft = next;
        updateRowState();
        updateCardMotion();
      }, { passive:false });
      track.addEventListener('scroll', ()=>{ updateRowState(); updateCardMotion(); }, false);
      // nav buttons - scroll by exactly 2 cards width (snap to show 2 full cards)
      const getCardWidth = ()=> {
        const card = track.querySelector('.product-card');
        if(!card) return window.innerWidth * 0.45;
        const style = window.getComputedStyle(card);
        const width = card.offsetWidth;
        const marginRight = parseFloat(style.marginRight) || 0;
        const gap = 12; // gap from CSS
        return width + gap;
      };
      left.addEventListener('click', (e)=>{ 
        e.preventDefault();
        e.stopPropagation();
        const cardWidth = getCardWidth();
        track.scrollLeft -= cardWidth * 2; // scroll exactly 2 cards
        setTimeout(()=>{ updateRowState(); updateCardMotion(); }, 50); 
      }); 
      right.addEventListener('click', (e)=>{ 
        e.preventDefault();
        e.stopPropagation();
        const cardWidth = getCardWidth();
        track.scrollLeft += cardWidth * 2; // scroll exactly 2 cards
        setTimeout(()=>{ updateRowState(); updateCardMotion(); }, 50); 
      });
      // initial state
      setTimeout(()=>{ updateRowState(); updateCardMotion(); },120);
      block.appendChild(prow);
    }

    container.appendChild(block);
  })
}

// carousel simple
function renderCarousel(){
  const root = $('carousel'); if(!root) return; root.innerHTML='';
  const featured = loadFeatured();
  if(featured && featured.length>0){
    // create a masked track so slides cannot overflow outside the visible frame
    const track = el('div','carousel-track'); track.style.display='flex'; track.style.width = `${featured.length * 100}%`; track.style.transition = 'transform .6s ease'; track.innerHTML='';
    featured.forEach((it,idx)=>{
      // force each slide to occupy full viewport width to center perfectly
      const slide = el('div','item'); slide.style.flex = '0 0 100%'; slide.style.display='flex'; slide.style.alignItems='center'; slide.style.justifyContent='center';
      // support group slides (it.items = [productId, productId2, ...])
      if(it.items && Array.isArray(it.items) && it.items.length>0){
        const parts = it.items.map(pid=>{ const prod = findItemById(pid) || {}; let imgSrc = prod.img || '';
          if(imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:') && !imgSrc.startsWith('/')){ const base = window.location.pathname.includes('/pages/') ? '../' : './'; imgSrc = base + imgSrc; }
          const logoSmall = `<img class='feat-logo-overlay shiny small top-right' src='${(window.location.pathname.includes('/pages/') ? '../' : './') + 'logo.png'}' style='position:absolute;top:8px;right:8px;width:36px;pointer-events:none;z-index:40'/>`;
          return `<div style='position:relative;flex:1;display:flex;align-items:center;justify-content:center;padding:6px'>${imgSrc? `<img src='${imgSrc}' style='max-height:240px;max-width:100%;object-fit:contain;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,0.5)'>${logoSmall}` : ''}</div>`;
        }).join('');
        slide.innerHTML = `<div style="text-align:center;max-width:960px;margin:0 auto;color:${GOLD}"><div style='display:flex;gap:12px;align-items:center;justify-content:center'>${parts}</div><h3 style="margin:8px 0 6px;color:${GOLD};font-size:20px">${it.title||''}</h3><p style='color:#ddd;max-height:84px;overflow:hidden;margin:0 auto'>${it.desc||''}</p></div>`;
      } else {
        let imgSrc = it.img || '';
        if(imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('data:') && !imgSrc.startsWith('/')){
          const base = window.location.pathname.includes('/pages/') ? '../' : './'; imgSrc = base + imgSrc;
        }
        // overlay injection
        let overlayHtml = '';
        if(it.overlay && it.overlay.text){ const txt = (it.overlay.text||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); overlayHtml = `<div class="feat-overlay ${it.overlay.size||'medium'} ${it.overlay.pos||'center'}">${txt}</div>`; }
        const logoHtml = (it.overlay && it.overlay.logo) ? `<img class='feat-logo-overlay shiny ${(it.overlay.logoSize||'small')} ${(it.overlay.logoPos||'bottom-right')}' src='${(window.location.pathname.includes('/pages/') ? '../' : './') + 'logo.png'}'/>` : '';
        const imageHtml = imgSrc? `<div class="featured-slide-inner image-wrap" style="position:relative;display:flex;align-items:center;justify-content:center;width:100%"><img src='${imgSrc}' alt='${(it.title||'')}'/>${overlayHtml}${logoHtml}</div>` : '';
        slide.innerHTML = `<div style="text-align:center;max-width:820px;margin:0 auto;color:${GOLD}">${imageHtml}<h3 style="margin:8px 0 6px;color:${GOLD};font-size:20px">${it.title||''}</h3><p style='color:#ddd;max-height:84px;overflow:hidden;margin:0 auto'>${it.desc||''}</p></div>`;
      }
      track.appendChild(slide);
      if(it.link){
        slide.style.cursor='pointer';
        slide.setAttribute('role','link');
        slide.addEventListener('click',()=> openExternalLink(it.link));
        slide.addEventListener('keydown',(e)=>{ if(e.key==='Enter') openExternalLink(it.link); });
        slide.tabIndex=0;
      }
    });
    root.appendChild(track);

    let pos = 0; if(window._goldCarouselInterval) clearInterval(window._goldCarouselInterval);
    function startAuto(len){
      if(window._goldCarouselInterval) clearInterval(window._goldCarouselInterval);
      if(len > 1){
        window._goldCarouselInterval = setInterval(()=>{
          // advance left every 4s
          pos = (pos + 1) % len;
          track.style.transform = `translateX(-${pos * 100}%)`;
        },5000);
      }
    }
    startAuto(featured.length);
    // pause on hover
    const frame = root.closest('.featured-frame'); if(frame){ frame.onmouseenter = ()=>{ if(window._goldCarouselInterval){ clearInterval(window._goldCarouselInterval); } }; frame.onmouseleave = ()=>{ startAuto(featured.length); } }
    if(featured.length<=1) track.style.transform = 'translateX(0)';
    return;
  }
  // No Featured items configured from sheet — show a simple placeholder and exit
  root.innerHTML = `<div style="padding:22px;border-radius:12px;background:#0b0b0b;color:#bbb;text-align:center">No featured items yet</div>`;
  if(window._goldCarouselInterval) { clearInterval(window._goldCarouselInterval); window._goldCarouselInterval = null; }
  root.style.transform = 'translateX(0)';
  return;
}

/**
 * Render calm editorial featured carousel
 */
function renderCarousel3D(){
  const root = $('carousel');
  if(!root) return;

  if(window._goldCarouselInterval){ clearInterval(window._goldCarouselInterval); window._goldCarouselInterval = null; }
  root.innerHTML = '';
  root.classList.add('carousel-editorial');

  const featured = loadFeatured();

  if(!featured || featured.length === 0){
    root.innerHTML = `<div class="carousel-empty">No featured items yet</div>`;
    root.classList.remove('carousel-editorial');
    return;
  }

  const normalizeImage = (featItem)=>{
    let imgSrc = '';
    if(featItem){
      if(featItem.img && featItem.img.startsWith('http')) imgSrc = featItem.img;
      else if(featItem.img) imgSrc = featItem.img;
      else if(featItem.items && featItem.items.length>0){ const prod = findItemById(featItem.items[0]); if(prod && prod.img) imgSrc = prod.img; }
      else if(featItem.id && featItem.id.startsWith('p-')){ const prod = findItemById(featItem.id.replace('p-','')); if(prod && prod.img) imgSrc = prod.img; }
    }
    if(imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('/') && !imgSrc.startsWith('data:')){
      const base = window.location.pathname.includes('/pages/') ? '../' : './';
      imgSrc = base + imgSrc;
    }
    return imgSrc;
  };

  const stage = document.createElement('div');
  stage.className = 'carousel-editorial-stage';

  const mediaWrap = document.createElement('button');
  mediaWrap.type = 'button';
  mediaWrap.className = 'carousel-editorial-media';
  mediaWrap.setAttribute('aria-label', 'Open featured item');

  const mediaGlow = document.createElement('div');
  mediaGlow.className = 'carousel-editorial-glow';
  mediaWrap.appendChild(mediaGlow);

  const mediaFrame = document.createElement('div');
  mediaFrame.className = 'carousel-editorial-frame';
  mediaWrap.appendChild(mediaFrame);

  const image = document.createElement('img');
  image.className = 'carousel-editorial-image';
  image.alt = '';
  mediaFrame.appendChild(image);

  const info = document.createElement('div');
  info.className = 'carousel-editorial-info';

  const kicker = document.createElement('div');
  kicker.className = 'carousel-editorial-kicker';
  kicker.textContent = 'Featured selection';

  const title = document.createElement('h3');
  title.className = 'carousel-editorial-title';

  const desc = document.createElement('p');
  desc.className = 'carousel-editorial-desc';

  const controls = document.createElement('div');
  controls.className = 'carousel-editorial-controls';
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'carousel-editorial-btn';
  prev.setAttribute('aria-label', 'Previous featured item');
  prev.innerHTML = '&larr;';
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'carousel-editorial-btn';
  next.setAttribute('aria-label', 'Next featured item');
  next.innerHTML = '&rarr;';
  controls.appendChild(prev);
  controls.appendChild(next);

  const indexLabel = document.createElement('div');
  indexLabel.className = 'carousel-editorial-index';

  info.appendChild(kicker);
  info.appendChild(title);
  info.appendChild(desc);
  info.appendChild(controls);
  info.appendChild(indexLabel);

  const thumbs = document.createElement('div');
  thumbs.className = 'carousel-editorial-thumbs';

  stage.appendChild(mediaWrap);
  stage.appendChild(info);
  root.appendChild(stage);
  root.appendChild(thumbs);

  let activeIndex = 0;
  let activeData = featured[0];

  const openActive = ()=>{
    if(!activeData) return;
    if(activeData.link) return openExternalLink(activeData.link);
    if(activeData.items && activeData.items.length>0){ const p = findItemById(activeData.items[0]); if(p) return openProductModal(p); }
    if(activeData.id && activeData.id.startsWith('p-')){ const p = findItemById(activeData.id.replace('p-','')); if(p) return openProductModal(p); }
  };

  const renderThumbs = ()=>{
    thumbs.innerHTML = '';
    featured.forEach((item, idx)=>{
      const thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = 'carousel-editorial-thumb';
      if(idx === activeIndex) thumb.classList.add('active');
      const thumbImg = normalizeImage(item);
      if(thumbImg){
        thumb.innerHTML = `<img src="${thumbImg}" alt="${item && item.title ? item.title : 'featured'}">`;
      } else {
        thumb.textContent = item && item.title ? item.title.slice(0, 1).toUpperCase() : String(idx + 1);
      }
      thumb.addEventListener('click', ()=> setActive(idx));
      thumbs.appendChild(thumb);
    });
  };

  const setActive = (idx)=>{
    activeIndex = (idx + featured.length) % featured.length;
    activeData = featured[activeIndex];
    const imgSrc = normalizeImage(activeData);
    mediaFrame.classList.add('carousel-editorial-flip');
    // keep flip animation duration aligned with CSS (updated to .7s)
    setTimeout(()=>{
      image.src = imgSrc || '';
      image.alt = activeData && activeData.title ? activeData.title : 'featured';
      mediaFrame.classList.remove('carousel-editorial-flip');
    }, 700);
    title.textContent = activeData && activeData.title ? activeData.title : 'Featured selection';
    desc.textContent = activeData && activeData.desc ? activeData.desc : 'A calm, polished display with a softer visual rhythm.';
    indexLabel.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(featured.length).padStart(2, '0')}`;
    mediaWrap.dataset.linked = activeData && activeData.link ? 'true' : 'false';
    if(activeData && activeData.link){ mediaWrap.classList.add('linked'); } else { mediaWrap.classList.remove('linked'); }
    renderThumbs();
  };

  mediaWrap.addEventListener('click', openActive);
  prev.addEventListener('click', (e)=>{ e.preventDefault(); setActive(activeIndex - 1); });
  next.addEventListener('click', (e)=>{ e.preventDefault(); setActive(activeIndex + 1); });

  const startAuto = ()=>{
    if(window._goldCarouselInterval){ clearInterval(window._goldCarouselInterval); window._goldCarouselInterval = null; }
    if(featured.length > 1){
      window._goldCarouselInterval = setInterval(()=> setActive(activeIndex + 1), 4000);
    }
  };

  root.onmouseenter = ()=>{ if(window._goldCarouselInterval){ clearInterval(window._goldCarouselInterval); window._goldCarouselInterval = null; } };
  root.onmouseleave = startAuto;

  setActive(0);
  startAuto();
}

async function publishProduct(product, platform){
  // platform: facebook, instagram, twitter, telegram, whatsapp, all
  const payload = { title: product.title, description: product.desc, url: (window.location.origin + '/?product=' + encodeURIComponent(product.id || product.title)) };
  // whatsapp: open wa.me with prefilled message (automatic WhatsApp business API requires server-side integration)
  if(platform === 'whatsapp'){
    const msg = `${payload.title}\n${payload.description}\n${payload.url}`;
    openWhatsAppChat(msg,'01284731863');
    showToast('WhatsApp share opened');
    // append admin log
    const am = $('adminMain'); if(am){ const p = el('div'); p.style.color='#bbb'; p.textContent = `WhatsApp share opened for ${product.title}`; am.prepend(p); }
    return;
  }
  // call serverless function which will attempt to publish to available services
  showToast(`Publishing '${product.title}' to ${platform}...`);
  try{
    const resp = await fetch('/.netlify/functions/publishSocial',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data = await resp.json();
    // map platform names to keys returned by lambda
    const map = { 'facebook':'facebook','instagram':'facebook','twitter':'x','telegram':'telegram' };
    if(platform === 'all'){
      const am = $('adminMain'); if(am){ const p = el('div'); p.style.color='#bbb'; p.textContent = `Publish results for ${product.title}: ${JSON.stringify(data)}`; am.prepend(p); }
      showToast('Publish finished — check results');
    } else {
      const key = map[platform] || platform;
      const res = data[key] || { skipped:true };
      const am = $('adminMain'); if(am){ const p = el('div'); p.style.color='#bbb'; p.textContent = `${platform} result for ${product.title}: ${JSON.stringify(res)}`; am.prepend(p); }
      showToast(`${platform} result: ${res.error ? 'Error' : (res && res.skipped? 'Skipped/Not configured' : 'Sent')}`);
    }
  }catch(e){
    showToast('Publish failed: ' + e.message);
    const am = $('adminMain'); if(am){ const p = el('div'); p.style.color='crimson'; p.textContent = `Publish failed: ${e.message}`; am.prepend(p); }
  }
}

// Product detail modal logic (gallery + zoom)
function openProductModal(product){
  const modal = $('productModal');
  $('pm_title').textContent = product.title;
  $('pm_desc').textContent = product.desc.replace(/\r?\n/g,' ');
  // ensure we have a wrapper for the main image so we can overlay the logo
  const main = $('pm_main'); const mainWrap = main.parentElement; main.classList.remove('product-modal-zoom');
  // create small logo overlay if missing (tiny top-left badge on modal too)
  if(!mainWrap.querySelector('.pm-logo-overlay-small')){
    mainWrap.style.position = 'relative';
    const small = el('img','pm-logo-overlay-small'); small.src = (window.location.pathname.includes('/pages/') ? '../' : './') + 'logo.png'; small.style.position='absolute'; small.style.top='10px'; small.style.left='10px'; small.style.width='36px'; small.style.opacity='0.95'; small.style.pointerEvents='none'; small.style.zIndex='50'; small.style.borderRadius='6px'; mainWrap.appendChild(small);
  }
  // create big overlay used for screenshot-mode (hidden by default)
  if(!mainWrap.querySelector('.pm-logo-overlay-big')){
    const big = el('img','pm-logo-overlay-big'); big.src = (window.location.pathname.includes('/pages/') ? '../' : './') + 'logo.png'; big.style.position = 'absolute'; big.style.top = '50%'; big.style.left = '50%'; big.style.transform = 'translate(-50%,-50%) rotate(-12deg)'; big.style.width = '140%'; big.style.opacity = '0.34'; big.style.pointerEvents='none'; big.style.zIndex='60'; big.style.display='block'; big.style.filter='drop-shadow(0 8px 24px rgba(0,0,0,0.6))'; mainWrap.appendChild(big);
  }

  // set main image and thumbs
  const thumbs = $('pm_thumbs'); thumbs.innerHTML='';
  const imgs = [product.img].concat(product.image2? [product.image2]: []).concat(product.image3? [product.image3]:[]).filter(Boolean);
  imgs.forEach((u,idx)=>{ const t = el('img','product-modal-thumb'); t.src = u; if(idx===0) t.classList.add('selected'); t.addEventListener('click',()=>{ document.querySelectorAll('.product-modal-thumb').forEach(x=>x.classList.remove('selected')); t.classList.add('selected'); main.src = u; main.classList.remove('product-modal-zoom'); }); thumbs.appendChild(t); });

  // variants into pm_variants
  const pv = $('pm_variants'); pv.innerHTML='';
  const variants = product.variants || extractVariants(product.desc);
  if(variants && variants.length>0){
    const sel = el('select'); variants.forEach(v=>{ const o=el('option'); o.value=JSON.stringify(v); o.textContent = `${v.size} - EGP ${v.price}`; sel.appendChild(o); });
    pv.appendChild(sel);
    // Add Frame info after variant selector
    const frameText = (product.frameInfo && product.frameInfo.toLowerCase().includes('frame included')) ? 'Frame Included In Price' : 'Frameless';
    const frameDiv = el('div'); frameDiv.style.marginTop = '8px'; frameDiv.style.fontSize = '13px'; frameDiv.style.color = '#888'; frameDiv.style.fontStyle = 'italic'; frameDiv.textContent = frameText; pv.appendChild(frameDiv);
  }

  // add download watermarked button (creates a composed image with a large centered logo and triggers download)
  // ensure we don't duplicate the button
  if(!$('pm_download')){
    const dl = document.createElement('button'); dl.id = 'pm_download'; dl.className = 'admin-btn'; dl.textContent = 'Download watermarked'; dl.style.marginLeft = '8px'; dl.addEventListener('click', async ()=>{
      const curSrc = main.src || product.img || 'mini.png';
      try{
        const bigData = await composeImageWithLogo(curSrc, (window.location.pathname.includes('/pages/') ? '../' : './') + 'logo.png', 'large', 'center');
        const a = el('a'); a.href = bigData; a.download = `${product.title.replace(/[^a-z0-9]+/ig,'-').toLowerCase()}.jpg`; a.click(); showToast('Download started');
      }catch(e){ console.error('Download watermark failed',e); showToast('Could not create watermarked image'); }
    });
    const actionsContainer = document.querySelector('#pm_add').parentElement;
    actionsContainer.appendChild(dl);
  }

  // update add/close handlers
  $('pm_add').onclick = ()=>{ let chosen = null; if(pv.querySelector('select')) chosen = JSON.parse(pv.querySelector('select').value); addToCart(Object.assign({},product,{chosen,qty:1})); modal.classList.add('hidden'); };
  $('pm_close').onclick = ()=>{ modal.classList.add('hidden'); };

  // zoom toggle
  main.onclick = ()=>{ if(main.classList.contains('product-modal-zoom')){ main.classList.remove('product-modal-zoom'); } else { main.classList.add('product-modal-zoom'); } };

  // temporary handler to show a big overlay when PrintScreen key is pressed (best-effort; not always detectable in browsers)
  function showScreenshotOverlay(){ const big = main.parentElement.querySelector('.pm-logo-overlay-big'); if(!big) return; big.style.display='block'; setTimeout(()=>{ big.style.display='none'; },800); }
  function onPrintKey(e){ const code = e.key || e.keyIdentifier || e.keyCode; if(code === 'PrintScreen' || code === 'Print' || code === 'PrintScrn' || code === 44 || e.keyCode === 44){ showScreenshotOverlay(); } }
  window.addEventListener('keyup', onPrintKey);
  // remove listener when modal closed (hook into close)
  const origClose = $('pm_close').onclick; $('pm_close').onclick = ()=>{ window.removeEventListener('keyup', onPrintKey); origClose(); };

  // ensure small overlay visible on current image
  main.addEventListener('load',()=>{ const small = main.parentElement.querySelector('.pm-logo-overlay-small'); if(small) small.style.display='block'; });

  // convert to product-modal style for premium look
  modal.classList.add('product-modal');
  modal.classList.remove('hidden');
  // ensure watermark big overlay visible when modal opened (extra deterrent against screenshots).
  try{
    const big = $('pm_main').parentElement.querySelector('.pm-logo-overlay-big'); if(big){ big.style.display='block'; big.classList.remove('animate'); setTimeout(()=>{ try{ big.classList.add('animate'); }catch(e){} }, 30); }
  }catch(e){}
  // when modal closes, hide big overlay as part of cleanup
  const prevClose = $('pm_close').onclick; $('pm_close').onclick = ()=>{ try{ const big = $('pm_main').parentElement.querySelector('.pm-logo-overlay-big'); if(big){ big.style.display='none'; big.classList.remove('animate'); } }catch(e){}; try{ window.removeEventListener('keyup', onPrintKey); }catch(e){}; // remove product-modal class on close
  try{ modal.classList.remove('product-modal'); }catch(e){}; if(typeof prevClose === 'function') prevClose(); };
}

// cart & wishlist
let CART = [];
function trackMetaEvent(eventName, params){
  try{
    if(typeof window.fbq === 'function') window.fbq('track', eventName, params || {});
  }catch(e){}
}
async function initCart(){ CART = await loadCart(); // resolve any id-only entries
  CART = CART.map(it => { if(!it) return null; if(typeof it === 'string'){ const found = findItemById(it); return found? snapshotItem(found) : { id: it, title: it, img: 'mini.png', price:0 }; } if(it.id && (!it.title || it.title === it.id)){ const found = findItemById(it.id); return found? Object.assign(snapshotItem(found), { qty: it.qty||1 }) : Object.assign({ id: it.id, title: it.title||it.id, img: it.img||'mini.png', price: it.price||0 }, { qty: it.qty||1 }); } return it; }).filter(Boolean);
  updateCartUI(); }
function updateCartUI(){ $('cartCount').textContent = CART.length; }
// wishlist
let WISHLIST = [];
function loadWishlist(){ try{ const raw = JSON.parse(localStorage.getItem('gold_wishlist')||'[]'); WISHLIST = raw.map(entry => {
        if(!entry) return null;
        if(typeof entry === 'string'){
          const found = findItemById(entry); return found? snapshotItem(found) : { id: entry, title: entry, img: 'mini.png' };
        }
        if(entry.id && (!entry.title || entry.title === entry.id)){
          const found = findItemById(entry.id); return found? snapshotItem(found) : { id: entry.id, title: entry.title || entry.id, img: entry.img || 'mini.png' };
        }
        return entry;
      }).filter(Boolean);
  }catch(e){ WISHLIST=[] } }
function saveWishlist(){ localStorage.setItem('gold_wishlist', JSON.stringify(WISHLIST)); }
function toggleWishlist(item){ // ensure we store a snapshot
  const snap = (typeof item === 'string') ? (findItemById(item) ? snapshotItem(findItemById(item)) : { id: item, title: item, img: 'mini.png' }) : snapshotItem(item);
  const idx = WISHLIST.findIndex(i=>i.id===snap.id);
  let added=false; if(idx>=0){ WISHLIST.splice(idx,1); added=false; } else { WISHLIST.push(snap); added=true; } saveWishlist(); if(added){ showToast('Added to favorites ♥'); trackMetaEvent('AddToWishlist', { content_ids: [snap.id], content_name: snap.title || snap.id, content_type: 'product' }); } else { showToast('Removed from favorites'); } return added; }
function renderFavorites(){ const root = $('favList'); if(!root) return; root.innerHTML=''; if(WISHLIST.length===0){ root.textContent='No favorites yet'; return }
  const grid = el('div','products'); // reuse product-card styles
  WISHLIST.forEach(it=>{
    const card = el('div','product-card');
    const img = el('img'); img.src = it.img || 'mini.png'; img.alt = it.title || ''; img.loading = 'lazy'; img.decoding = 'async'; card.appendChild(img);
    const title = el('h4'); title.textContent = it.title || ''; card.appendChild(title);
    const meta = el('div'); meta.className = 'variant-note'; meta.textContent = (it.size? it.size : (it.variants && it.variants[0] ? it.variants[0].size : '')); card.appendChild(meta);
    const price = el('p'); price.className = 'price'; price.textContent = `EGP ${ (it.price|| (it.variants && it.variants[0] && it.variants[0].price) || 0) }`; card.appendChild(price);
    const actions = el('div'); actions.style.display='flex'; actions.style.gap='8px'; actions.style.marginTop='8px'; const add = el('button'); add.className='btn add-to-cart uiverse-btn'; add.dataset.id = it.id; add.dataset.label = 'Own This Piece'; add.title = 'Own this piece'; add.textContent='Own This Piece'; add.addEventListener('click',()=>{ try{ add.dataset.handled='1'; }catch(e){} addToCart(it); setTimeout(()=>{ try{ delete add.dataset.handled }catch(e){} },400); }); const rem = el('button'); rem.className='btn'; rem.textContent='Remove'; rem.addEventListener('click',()=>{ WISHLIST = WISHLIST.filter(w=>w.id!==it.id); saveWishlist(); renderFavorites(); }); actions.appendChild(add); actions.appendChild(rem); card.appendChild(actions); grid.appendChild(card);
  });
  root.appendChild(grid);
}

function findCategoryForItem(item){
  try{
    if(!item) return null;
    for(const cat of CATALOG){
      const found = (cat.items||[]).find(it=> it.id === item.id || (item.title && it.title === item.title));
      if(found) return cat.category || null;
    }
  }catch(e){}
  return null;
}

function pickSmartSuggestion(baseItem, cartIds){
  try{
    const category = findCategoryForItem(baseItem);
    const avoid = new Set(cartIds || []);
    if(baseItem && baseItem.id) avoid.add(baseItem.id);
    let pool = [];
    if(category){
      const group = CATALOG.find(c=> (c.category||'') === category);
      pool = group ? (group.items||[]) : [];
    }
    if(!pool || pool.length===0){
      pool = CATALOG.flatMap(c=> c.items || []);
    }
    const filtered = pool.filter(p=> p && p.id && !avoid.has(p.id));
    if(filtered.length===0) return null;
    return filtered[Math.floor(Math.random() * filtered.length)];
  }catch(e){ return null; }
}
async function addToCart(item){
  // allow passing an id or item object; ensure we store a snapshot with title/img
  let prod = null;
  if(typeof item === 'string') prod = findItemById(item) || { id: item, title: item, img: 'mini.png' };
  else prod = item && item.id ? (findItemById(item.id) || item) : item;
  if(!prod) return showToast('Unable to add item');
  const entry = Object.assign({}, snapshotItem(prod));
  if(item && item.chosen){ entry.size = item.chosen.size; entry.price = Number(item.chosen.price); }
  else if(entry.variants && entry.variants.length>0){ entry.size = entry.variants[0].size; entry.price = Number(entry.variants[0].price); }
  entry.qty = (item && item.qty) || 1;
  entry.price = Number(entry.price||0);
  CART.push(entry);
  await saveCart(CART);
  updateCartUI();
  showToast('Added to cart');
  trackMetaEvent('AddToCart', { content_ids: [entry.id], content_name: entry.title || entry.id, content_type: 'product', value: Number(entry.price||0) * Number(entry.qty||1), currency: 'EGP' });
}
function showToast(msg, duration=2500){
  const t = el('div'); t.className='toast'; t.style.opacity='1'; t.style.transition='opacity .25s ease';
  const txt = el('div'); txt.className='toast-body'; txt.textContent = msg;
  const close = el('button'); close.className='toast-close'; close.type='button'; close.innerHTML='&times;';
  let timer = null;
  const remove = ()=>{ if(timer) clearTimeout(timer); t.style.opacity=0; setTimeout(()=>{ try{ t.remove(); }catch(e){} },280); };
  close.addEventListener('click', remove);
  t.appendChild(txt); t.appendChild(close); document.body.appendChild(t);
  timer = setTimeout(remove, duration);
}

// drawer & search (single definitions)
function applyDrawerUserDisplay(){ try{ const d = $('sideDrawer'); if(!d) return; let ud = d.querySelector('#drawerUser'); if(!ud){ ud = el('div'); ud.id='drawerUser'; ud.style.padding='12px 16px'; ud.style.color='#ddd'; ud.style.fontSize='14px'; ud.style.fontWeight='700'; ud.style.borderBottom='1px solid rgba(255,255,255,0.02)'; d.insertBefore(ud, d.firstChild); }
    const sess = currentAdminSession(); const name = sess ? sess.username : (localStorage.getItem('gold_user') || 'Guest'); ud.innerHTML = `Welcome, <strong>${name}</strong>`; }catch(e){ console.warn(e); }}

function openDrawer(){ const d=$('sideDrawer'); const b=$('menuBtn'); if(d){ d.classList.remove('hidden'); d.classList.add('open'); if(b){ b.classList.add('open'); b.setAttribute('aria-expanded','true'); } // focus search
  setTimeout(()=>{ try{ const si = d.querySelector('#searchInput'); if(si) si.focus(); }catch(e){} },120);
  // ensure drawer user display is up-to-date
  try{ applyDrawerUserDisplay(); }catch(e){};
  // add a subtle backdrop for a premium feel
  try{
    let bd = document.getElementById('sideDrawerBackdrop');
    if(!bd){ bd = document.createElement('div'); bd.id = 'sideDrawerBackdrop'; bd.className = 'side-drawer-backdrop'; document.body.appendChild(bd);
      bd.addEventListener('click', ()=>{ try{ closeDrawer(); }catch(e){} });
    }
    // show it
    requestAnimationFrame(()=> bd.classList.add('visible'));
  }catch(_e){}
 } else { const tn = document.querySelector('.topnav'); if(tn){ tn.classList.add('open-mobile'); if(b){ b.classList.add('open'); b.setAttribute('aria-expanded','true'); } } } }
function closeDrawer(){ const d=$('sideDrawer'); const b=$('menuBtn'); if(d){ d.classList.add('hidden'); d.classList.remove('open'); if(b){ b.classList.remove('open'); b.setAttribute('aria-expanded','false'); } // hide backdrop if present
    try{ const bd = document.getElementById('sideDrawerBackdrop'); if(bd){ bd.classList.remove('visible'); bd.addEventListener('transitionend', ()=>{ try{ bd.remove(); }catch(e){} }, { once:true }); } }catch(_e){}
  } else { const tn = document.querySelector('.topnav'); if(tn){ tn.classList.remove('open-mobile'); if(b){ b.classList.remove('open'); b.setAttribute('aria-expanded','false'); } } } }

function searchCatalog(q){ const suggestions = []; const qlow = (q||'').toLowerCase(); const qnorm = qlow.replace(/[×xX]/g,'x').replace(/\s+/g,' ').trim(); const tokens = qnorm.split(' ').filter(Boolean);
  if(!Array.isArray(CATALOG) || CATALOG.length===0){ try{ const parsed = JSON.parse(localStorage.getItem('gold_products')||'[]'); if(Array.isArray(parsed) && parsed.length>0){ CATALOG = parsed; } }catch(e){} }
  if(!tokens.length) return suggestions;
  const seen = new Set(); CATALOG.forEach(cat=>{
    cat.items.forEach(i=>{
      let score = 0;
      const title = (i.title||'').toString().toLowerCase();
      const desc = (i.description||i.desc||'').toString().toLowerCase();
      const category = (cat.category||'').toString().toLowerCase();
      const id = (i.id||'').toString().toLowerCase();
      const tags = (i.tags||[]).join(' ').toLowerCase();
      const sizeField = ((i.size||'')+'').toLowerCase().replace(/[×xX]/g,'x').replace(/\s+/g,' ').trim();
      const variantSizes = (i.variants||[]).map(v=>((v.size||'')+'').toLowerCase().replace(/[×xX]/g,'x').replace(/\s+/g,' ').trim());

      tokens.forEach(t=>{
        if(!t) return;
        if(title.includes(t)) score += 3;
        if(desc.includes(t)) score += 2;
        if(category.includes(t)) score += 1;
        if(id.includes(t)) score += 2;
        if(tags.includes(t)) score += 1;
        if(sizeField.includes(t) || variantSizes.some(vs=>vs.includes(t))) score += 4;
      });

      // Boost exact phrase matches
      if(title.includes(qnorm)) score += 5;
      if(desc.includes(qnorm)) score += 3;
      if(sizeField === qnorm || variantSizes.includes(qnorm)) score += 6;

      if(score>0 && !seen.has(i.id)){
        suggestions.push({item:i,category:cat.category,score}); seen.add(i.id);
      }
    });
  });
  // sort by score (desc) then by title
  suggestions.sort((a,b)=> (b.score - a.score) || ((a.item.title||'').localeCompare(b.item.title||'')) );
  return suggestions; }

// Highlight matched tokens in result text
function highlightMatches(text, tokens){ try{ if(!text || !tokens || tokens.length===0) return text; let out = text.toString(); for(const t of tokens){ if(!t) continue; const rt = t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); out = out.replace(new RegExp('('+rt+')','ig'), '<mark>$1</mark>'); } return out; }catch(e){ return text; } }

// Show a full search results page (with simple filters)
function showSearchResults(q){ try{ window._gold_searchQuery = (q||'').toString().trim(); // initial filters object
    if(!window._gold_searchFilters) window._gold_searchFilters = { sort: 'relevance', min:0, max:0, size: '' };
    // push to history so URLs are shareable
    try{ const s = new URLSearchParams(window.location.search); s.set('search', window._gold_searchQuery); history.pushState({},'', '?' + s.toString()); }catch(e){}
    renderCatalog(); // renderCatalog will detect window._gold_searchQuery and show results
  }catch(e){ console.warn('showSearchResults failed', e); } }

function runSearchTests(){ const tests = ['100 x 70','120 x 80','canvas','chair','nonexistent-string-xyz']; const out = {}; tests.forEach(t=>{ try{ const s = searchCatalog(t); out[t] = { query: t, results: s.slice(0,6).map(r=>({ id: r.item.id, title: r.item.title, category: r.category, sampleVariant: (r.item.variants && r.item.variants[0]) ? r.item.variants[0].size : (r.item.size||null) })) , count: s.length }; }catch(e){ out[t] = { error: String(e) }; } }); return out; }

async function liveSearch(q){
  const qlow = (q||'').toLowerCase();
  const qnorm = qlow.replace(/[×xX]/g,'x').replace(/\s+/g,' ').trim();
  // If catalog is empty (fetch may have failed), try to load the baked/apply files on-demand
  if(!Array.isArray(CATALOG) || CATALOG.length===0){
    try{
      const paths = ['/products.builtin.json','products.builtin.json','./products.builtin.json','/products.applied.json','products.applied.json','./products.applied.json'];
      for(const p of paths){ try{ const r = await fetch(p); if(r && r.ok){ const j = await r.json(); if(Array.isArray(j) && j.length>0){ CATALOG = j; saveCatalogToLocal(); break; } } }catch(e){} }
    }catch(e){}
  }
  const ul = $('searchSuggestions'); if(!ul) return; ul.innerHTML=''; ul.classList.remove('show');
  if(!q || q.length===0) return;
  // If still no catalog, show a helpful message and WA contact
  if(!Array.isArray(CATALOG) || CATALOG.length===0){ ul.classList.add('show'); const li=el('li'); li.className='no-result'; li.innerHTML = `<div class='note'>😕 Catalog is not loaded. Please try reloading the page or contact us on WhatsApp and we'll help you find it.</div>`;
    const btn = el('a'); btn.className='wa-btn'; btn.textContent='Contact us on WhatsApp'; btn.href = 'https://wa.me/201004135874?text=مرحبا%20GoldrArt%20👋%0A%0Aساعدني%20اوجد%20منتجات%20تطابق:%20' + encodeURIComponent(q); btn.target='_blank'; btn.rel='noopener noreferrer'; btn.style.display='inline-block'; btn.style.textDecoration='none'; btn.style.textAlign='center';
    li.appendChild(btn); ul.appendChild(li); return }

  const suggestions = searchCatalog(q);
  console.debug('liveSearch', q, '=>', suggestions.length, 'matches');

  if(suggestions.length===0){ ul.classList.add('show'); const li=el('li'); li.className='no-result'; li.innerHTML = `<div class='note' style='display:flex;flex-direction:column;gap:8px'><div>😔 <strong>Product not found.</strong></div><div style='color:#bbb;font-size:13px'>We can design a custom piece in the size or style you want. Contact us on WhatsApp and we'll help you.</div></div>`;
    const btn = el('a'); btn.className='wa-btn'; btn.textContent='Contact via WhatsApp to Order'; btn.href = 'https://wa.me/201004135874?text=مرحبا%20GoldrArt%20👋%0A%0Aلم%20اجد%20المنتج:%20' + encodeURIComponent(q) + '%0A%0Aهل%20يمكنكم%20تصميم%20قطعة%20مخصصة%20لي؟'; btn.target='_blank'; btn.rel='noopener noreferrer'; btn.style.display='inline-block'; btn.style.textDecoration='none'; btn.style.textAlign='center';
    const small = el('div'); small.style.fontSize='13px'; small.style.color='#bbb'; small.style.marginTop='6px'; small.innerHTML = `<em style='font-size:12px;color:#bbb'>We'll help you find or create the perfect piece</em>`;
    li.appendChild(btn); li.appendChild(small); ul.appendChild(li); return }
  ul.classList.add('show'); suggestions.slice(0,8).forEach(s=>{ const it = s.item; const li = el('li'); li.tabIndex = 0; li.setAttribute('role','option');
    // prefer showing the variant that matched the query (size match) when available
    const matchedVariant = (it.variants||[]).find(v=>{ const vs = (v.size||'').toString().toLowerCase().replace(/[×xX]/g,'x').replace(/\s+/g,' ').trim(); return vs.includes(qlow) || vs.includes(qnorm); });
    const displayVariant = matchedVariant || (it.variants && it.variants[0]) || null;
    const tokens = qnorm.split(' ').filter(Boolean);
    const titleHtml = highlightMatches(it.title||'', tokens);
    const metaSize = displayVariant ? (displayVariant.size || '') : (it.size || '');
    const metaSizeHtml = metaSize ? highlightMatches(metaSize, tokens) : '';
    li.innerHTML = `<div style='font-weight:800'>${titleHtml}</div><div class='meta'>${s.category} • ${displayVariant ? (metaSizeHtml + ' • EGP ' + (displayVariant.price||it.price||0)) : (metaSizeHtml? metaSizeHtml : '')}</div>`; 
    li.addEventListener('click',()=>{ try{ openProductModal(it); }catch(e){} finally { try{ const si = $('searchInput'); if(si) si.value=''; ul.classList.remove('show'); }catch(e){} closeDrawer(); } }); li.addEventListener('mouseenter',()=>{ const cur = ul.querySelector('li.active'); if(cur) cur.classList.remove('active'); li.classList.add('active'); }); ul.appendChild(li); });
  // ensure the first suggestion is visible and focused for mobile
  try{ const first = ul.querySelector('li:not(.no-result):not(.loading)'); if(first) first.scrollIntoView({block:'nearest'}); }catch(e){}
}


// checkout & whatsapp
function openCartModal(){ renderCart(); $('cartModal').classList.remove('hidden'); }
function closeCartModal(){ $('cartModal').classList.add('hidden'); }

// تفعيل الاقتراحات التلقائية عند الكتابة في شريط البحث
document.addEventListener('DOMContentLoaded', function() {
  try {
    var searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        liveSearch(e.target.value);
      });
      // إخفاء الاقتراحات عند فقدان التركيز
      searchInput.addEventListener('blur', function() {
        setTimeout(function() {
          var ul = document.getElementById('searchSuggestions');
          if (ul) ul.classList.remove('show');
        }, 200);
      });
      // إظهار الاقتراحات عند التركيز إذا كان هناك نص
      searchInput.addEventListener('focus', function(e) {
        if (e.target.value) liveSearch(e.target.value);
      });
    }
  } catch(e) {
    console.error('[SEARCH] Search initialization failed:', e);
  }
});
function renderCart(){
  const list = $('cartList'); list.innerHTML='';
  if(CART.length===0){ list.textContent='Cart is empty'; return }
  let total = 0;
  const cartIds = CART.map(ci=>ci.id).filter(Boolean);
  CART.forEach((it,idx)=>{
    const row = el('div','cart-item list-row');
    const thumb = el('img'); thumb.src = it.img||'mini.png'; thumb.className='thumb';
    const info = el('div'); info.className='info'; info.innerHTML = `<div class='title'><span class='gold-star small'>✦</span>${it.title}</div><div style='color:#bbb;font-size:13px'>${it.size||''}</div>`;
    const qty = el('div','qty');
    const minus = el('button'); minus.textContent='-';
    const plus = el('button'); plus.textContent='+';
    const qspan = el('span'); qspan.textContent = it.qty||1; qspan.style.minWidth='28px'; qspan.style.textAlign='center';
    minus.addEventListener('click',async ()=>{ if(it.qty>1) it.qty--; else CART.splice(idx,1); await saveCart(CART); renderCart(); updateCartUI(); });
    plus.addEventListener('click',async ()=>{ it.qty = (it.qty||1)+1; await saveCart(CART); renderCart(); updateCartUI(); });
    qty.appendChild(minus); qty.appendChild(qspan); qty.appendChild(plus);
    const price = el('div'); price.style.fontWeight='900'; price.style.color=GOLD; const p = Number(it.price||0); const qtyn = (it.qty||1); const lineTotal = Math.round(p * qtyn);
    // show discounted per-item/line price when a percent coupon that applies to this product is active
    let priceHtml = `EGP ${lineTotal}`;
    try{
      if(APPLIED_COUPON && couponAppliesTo(APPLIED_COUPON, it.id)){
        if(APPLIED_COUPON.type === 'percent'){
          const pct = Number(APPLIED_COUPON.value||0);
          const newTotal = Math.round(lineTotal * (1 - (pct/100)));
          priceHtml = `<span style='text-decoration:line-through;color:#888;margin-right:8px'>EGP ${lineTotal}</span><span>EGP ${newTotal} <small style='color:#afa'>(-${pct}%)</small></span>`;
        } else if(APPLIED_COUPON.type === 'fixed'){
          const take = Math.min(Number(APPLIED_COUPON.value||0), lineTotal);
          const newTotal = Math.max(0, lineTotal - take);
          priceHtml = `<span style='text-decoration:line-through;color:#888;margin-right:8px'>EGP ${lineTotal}</span><span>EGP ${newTotal} <small style='color:#afa'>(-EGP ${take})</small></span>`;
        }
      }
    }catch(e){}
    price.innerHTML = priceHtml;
    const rem = el('button');
    rem.textContent = 'Remove';
    rem.className = 'btn-close-custom';
    rem.style.marginLeft = '8px';
    rem.style.background = 'transparent';
    rem.style.color = '#b8912b';
    rem.style.border = '2px solid #b8912b';
    rem.style.fontWeight = 'bold';
    rem.addEventListener('click', async () => {
      CART.splice(idx, 1);
      await saveCart(CART);
      renderCart();
      updateCartUI();
    });
    const right = el('div'); right.style.textAlign='right'; right.appendChild(price); right.appendChild(rem);
    row.appendChild(thumb); row.appendChild(info); row.appendChild(qty); row.appendChild(right);
    list.appendChild(row);
    const baseItem = findItemById(it.id) || it;
    const suggestion = pickSmartSuggestion(baseItem, cartIds);
    if(suggestion){
      const sug = el('div','cart-suggestion');
      const sugTitle = el('div','cart-suggestion-title');
      sugTitle.innerHTML = `Suggested for you <span class="cart-suggestion-badge">Smart pick</span>`;
      const sugCard = el('div','cart-suggestion-card');
      const sImg = el('img'); sImg.src = suggestion.img || 'mini.png'; sImg.alt = suggestion.title || 'Suggestion'; sImg.className='cart-suggestion-img';
      const sInfo = el('div','cart-suggestion-info');
      const sName = el('div'); sName.className='cart-suggestion-name'; sName.textContent = suggestion.title || '';
      const sp = (suggestion.variants && suggestion.variants[0] && suggestion.variants[0].price) || suggestion.price || 0;
      const sPrice = el('div'); sPrice.className='cart-suggestion-price'; sPrice.textContent = `EGP ${sp}`;
      const sBtn = el('button'); sBtn.className='cart-suggestion-btn'; sBtn.textContent = 'Add to cart';
      sBtn.addEventListener('click', async ()=>{ try{ sBtn.disabled = true; await addToCart(Object.assign({}, suggestion, { chosen: getDefaultVariant(suggestion), qty:1 })); renderCart(); }finally{ sBtn.disabled = false; } });
      sInfo.appendChild(sName); sInfo.appendChild(sPrice); sInfo.appendChild(sBtn);
      sugCard.appendChild(sImg); sugCard.appendChild(sInfo);
      sug.appendChild(sugTitle); sug.appendChild(sugCard);
      list.appendChild(sug);
    }
    total += p*(it.qty||1);
  })
  const totals = calcCartTotals();
  const tot = el('div'); tot.style.marginTop='12px'; tot.style.textAlign='right';
  tot.innerHTML = `<div style='color:#ddd'>Subtotal: EGP ${totals.subtotal}</div>`;
  if(totals.discount>0) {
    let couponIcon = '';
    if(APPLIED_COUPON.type==='percent') {
      couponIcon = ` <img src='assets/icons/png/GoldrArt-Verify.png' alt='Verified' style='width:18px;height:18px;vertical-align:middle;margin:0 2px;display:inline-block;' /> ${APPLIED_COUPON.value}%`;
    }
    tot.innerHTML += `<div style='color:#afa'>Discount: -EGP ${totals.discount} (${APPLIED_COUPON.code}${couponIcon})</div>`;
  }
  tot.innerHTML += `<div style='font-size:20px;font-weight:900;color:${GOLD}'>Total: EGP ${totals.total}</div>`;
  list.appendChild(tot);
}

// Coupon system
let APPLIED_COUPON = null;
// Coupons are loaded from sheet only, no cache
function loadCoupons(){ return window.COUPONS_FROM_SHEET || []; }
function saveCoupons(coupons){ window.COUPONS_FROM_SHEET = coupons; }
// Helper function to check if coupon applies to product (supports '*' for all products)
function couponAppliesTo(coupon, productId){ if(!coupon || !coupon.appliesTo) return false; if(coupon.appliesTo.includes('*')) return true; return coupon.appliesTo.includes(productId); }
function applyCouponCode(code){ 
  const coupons = window.COUPONS_FROM_SHEET || [];
  console.log('[COUPON] Applying:', code);
  console.log('[COUPON] Available:', coupons);
  const inputCode = (code||'').toString().trim();
  const c = coupons.find(x=> (x.code && x.code.trim().toLowerCase()===inputCode.toLowerCase()));
  if(!c) { 
    console.warn('[COUPON] Not found:', code);
    $('couponMsg').innerHTML = `<img src='assets/icons/png/invalid.png' alt='Invalid' style='width:18px;height:18px;vertical-align:middle;margin:0 4px 0 0;' /> Invalid coupon code`; 
    $('couponMsg').style.color='#f88'; 
    return; 
  } 
  const now=Date.now(); 
  if(c.expiresAt && now>c.expiresAt){ 
    $('couponMsg').innerHTML = `<img src='assets/icons/png/invalid.png' alt='Expired' style='width:18px;height:18px;vertical-align:middle;margin:0 4px 0 0;' /> Coupon expired`; 
    $('couponMsg').style.color='#f88'; 
    return; 
  } 
  APPLIED_COUPON = c; 
  const discountStr = c.type==='percent' ? (c.value + '%') : ('EGP ' + c.value);
  $('couponMsg').innerHTML = `<img src='assets/icons/png/verify.gif' alt='Valid' style='width:18px;height:18px;vertical-align:middle;margin:0 4px 0 0;' /> <strong>${c.code}</strong> applied successfully (-${discountStr})`; 
  $('couponMsg').style.color='#afa'; 
  $('couponInput').value = ''; // Clear input field after applying
  renderCart(); 
  try{ renderCatalog(); }catch(e){} 
}

function calcCartTotals(){ let subtotal=0; CART.forEach(it=>{ subtotal += Number(it.price||0)*(it.qty||1); }); let discount=0; if(APPLIED_COUPON){ // when coupon applies to specific products, compute target subtotal
    let targetSubtotal = subtotal;
    if(APPLIED_COUPON.appliesTo && Array.isArray(APPLIED_COUPON.appliesTo) && APPLIED_COUPON.appliesTo.length>0){ targetSubtotal = 0; CART.forEach(it=>{ if(couponAppliesTo(APPLIED_COUPON, it.id)) targetSubtotal += Number(it.price||0)*(it.qty||1); }); }
    if(APPLIED_COUPON.type==='percent'){ discount = Math.round(targetSubtotal * (APPLIED_COUPON.value/100)); } else { discount = Math.min(APPLIED_COUPON.value, targetSubtotal); }
  }
  const total = Math.max(0, subtotal - discount); return {subtotal,discount,total}; }


function showCheckoutFlow(){ $('beforeCheckout').classList.remove('hidden'); }

function prepareWhatsAppOrder(formData){
  let text = 'Order from Goldrart\n\n';
  // helper: decode any HTML entities in titles/descriptions before sending
  function decodeHtmlEntities(input){ try{ if(!input) return input; const txt = document.createElement('textarea'); txt.innerHTML = input; return txt.value; }catch(e){ return input; } }

  CART.forEach(it=>{ const lineTotal = Math.round(Number(it.price||0) * (it.qty||1)); let lineStr = `EGP ${lineTotal}`; try{ if(APPLIED_COUPON && couponAppliesTo(APPLIED_COUPON, it.id)){
    if(APPLIED_COUPON.type === 'percent'){ const newTotal = Math.round(lineTotal * (1 - (Number(APPLIED_COUPON.value||0)/100))); lineStr = `EGP ${newTotal} (-${APPLIED_COUPON.value}%)`; }
    else if(APPLIED_COUPON.type === 'fixed'){ const take = Math.min(Number(APPLIED_COUPON.value||0), lineTotal); lineStr = `EGP ${Math.max(0,lineTotal - take)} (-EGP ${take})`; }
  } }catch(e){}
  const title = decodeHtmlEntities(it.title || '');
  const size = decodeHtmlEntities(it.size || '');
  text += `• ${title} - ${size} - ${lineStr} x ${it.qty||1}\n`; });
  const totals = calcCartTotals();
  text += `\nSubtotal: EGP ${totals.subtotal}\n`;
  if(totals.discount>0) text += `Discount: -EGP ${totals.discount} (${APPLIED_COUPON.code})\n`;
  text += `Total: EGP ${totals.total}\n\n`;
  text += '\nCustomer Details:\n';
  for(const [k,v] of new FormData(formData).entries()){ const safeV = (typeof v === 'string') ? decodeHtmlEntities(v) : v; text += `${k}: ${safeV}\n`; }
  text += `\nPlease confirm payment method and delivery details.`;
  // Close checkout UI and mark that an order was sent so we can show a nice popup when user returns
  try{ try{ const bc = $('beforeCheckout'); if(bc) bc.classList.add('hidden'); const cm = $('cartModal'); if(cm) cm.classList.add('hidden'); }catch(_){}
    sessionStorage.setItem('gold_order_sent', Date.now().toString()); }catch(e){}
  
  // Use improved WhatsApp opening (WebView compatible)
  showToast('Opening WhatsApp...');
  
  // Small delay to show toast before navigation
  setTimeout(() => {
    openWhatsAppChat(text);
  }, 300);
}

function showThankYouPopup(){ const m = $('thankYouModal'); if(!m) return; m.classList.remove('hidden'); }

// when page regains focus after sending to WhatsApp, show thank-you popup
window.addEventListener('focus',()=>{
  try{
    const v = sessionStorage.getItem('gold_order_sent');
    if(v){ // show thank you once
      sessionStorage.removeItem('gold_order_sent');
      setTimeout(()=> showThankYouPopup(),600);
    }
  }catch(e){}
});

// events
document.addEventListener('DOMContentLoaded',async ()=>{
  // Set social media links for the site
  try{
    const socialLinks = {
      facebook: 'https://www.facebook.com/share/1BkKnZEg1u/',
      whatsapp: 'https://wa.me/201004135874',
      telegram: 'https://t.me/GoldrArt',
      instagram: 'https://www.instagram.com/goldrart_gallery?igsh=MWhycm9sZ203MmxuMQ==',
      tiktok: 'https://www.tiktok.com/@goldrart?_r=1&_t=ZS-92yuBAXlaIC'
    };
    localStorage.setItem('gold_social_links', JSON.stringify(socialLinks));
  }catch(e){ console.warn('Failed to set social links', e); }
  
  // ensure admin users are seeded (hashes computed client-side) before any login attempts
  try{ await seedAdminUsersIfMissing(); }catch(e){}
  // Clear any stale cache and force fresh load
  try{
    console.log('[STARTUP] Clearing stale catalog cache to force fresh load...');
    localStorage.removeItem('gold_products');
  }catch(e){}
  
  // Prevent back button from leaving the site - redirect to home instead
  try{
    history.pushState(null, null, location.href);
    window.addEventListener('popstate', function(event) {
      history.pushState(null, null, location.href);
      // If not on home page, go to home instead of exiting
      if(location.pathname !== '/' && location.pathname !== '/index.html'){
        window.location.href = '/';
      }
    });
  }catch(e){ console.warn('Back button prevention failed', e); }
  
  await Promise.race([
    loadCatalogFromCSV(),
    new Promise((resolve)=>{
      setTimeout(()=>{
        console.warn('[STARTUP] Catalog loading timeout reached, continuing startup flow');
        resolve();
      }, 12000);
    })
  ]);
  // expose a small debug helper for quick troubleshooting from the console
  try{ window.debugSearchState = function(){ console.log('CATALOG length', Array.isArray(CATALOG)?CATALOG.length:0); console.log('first category', CATALOG && CATALOG[0] && CATALOG[0].category); console.log('searchInput', !!document.getElementById('searchInput')); console.log('searchSuggestions', !!document.getElementById('searchSuggestions')); console.log('WA_NUMBER', WA_NUMBER); }; }catch(e){}
  // Background is loaded from sheet only — no fallback to background.json or localStorage
  // if catalog is unexpectedly empty, try to recover from the most recent backup
  try{
    const count = (CATALOG && Array.isArray(CATALOG)) ? CATALOG.reduce((s,c)=>s + (c.items?c.items.length:0),0) : 0;
    if(!count){ const keys = Object.keys(localStorage).filter(k=>k.indexOf('gold_products_backup_')===0).sort().reverse(); if(keys.length>0){ for(const k of keys){ try{ const raw = localStorage.getItem(k); if(!raw) continue; const parsed = JSON.parse(raw); if(parsed && Array.isArray(parsed) && parsed.reduce((s,c)=>s + (c.items?c.items.length:0),0)>0){ localStorage.setItem('gold_products', JSON.stringify(parsed)); CATALOG = parsed; saveCatalogToLocal(); renderCatalog(); showToast('Restored catalog from backup: ' + k); break; } }catch(e){} } }
    }
  }catch(e){ console.warn('Recovery check failed', e); }
  // If catalog still empty, show a small hint in the drawer so users can retry loading the catalog
  try{
    const sd = $('sideDrawer');
    if(sd && (!Array.isArray(CATALOG) || CATALOG.length===0)){
      let hint = sd.querySelector('#catalogHint');
      if(!hint){
        hint = el('div'); hint.id='catalogHint'; hint.className='note'; hint.style.marginTop='8px'; hint.style.color='#bbb';
        hint.innerHTML = `Catalog not loaded. <button id="reloadCatalogBtn" class="small">Reload catalog</button>`;
        (sd.querySelector('.drawer-top')||sd).appendChild(hint);
        const btn = sd.querySelector('#reloadCatalogBtn');
        btn.addEventListener('click', async ()=>{ try{ await loadCatalogFromCSV(); renderCatalog(); renderDynamicCategories(); showToast('Catalog reloaded'); hint.remove(); }catch(e){ showToast('Reload failed'); console.error(e); } });
      }
    }
  }catch(e){}
  loadWishlist(); renderCatalog(); renderCarousel3D(); applySocialLinks(); ensurePersistentLayout(); await initCart();
  // Populate dynamic categories in sidebar
  setTimeout(()=>{ renderDynamicCategories(); }, 100);
  // Add X close buttons to any static modal panels that may be in HTML (so users can always close with an X)
  try{
    // first, add click handlers to existing close buttons
    document.querySelectorAll('.modal-close').forEach(btn=>{
      btn.addEventListener('click', (ev)=>{ ev.preventDefault(); ev.stopPropagation(); try{ const modal = btn.closest('.modal'); const panel = btn.closest('.modal-panel'); if(modal) modal.classList.add('hidden'); if(panel && !modal) panel.remove(); }catch(e){} });
    });
    document.querySelectorAll('.modal-panel').forEach(panel=>{
      if(panel.querySelector('.modal-close')) return; // already has one
      const modal = panel.closest('.modal');
      const btn = document.createElement('button'); btn.className = 'modal-close'; btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      btn.addEventListener('click', ()=>{ try{ if(modal) modal.classList.add('hidden'); else panel.remove(); }catch(e){} });
      panel.appendChild(btn);
    });
    // add small close to center-notif
    document.querySelectorAll('.center-notif').forEach(cn=>{
      if(cn.querySelector('.close-small')) return;
      const s = document.createElement('button'); s.className='close-small'; s.textContent='✕'; s.addEventListener('click', ()=> cn.remove()); cn.appendChild(s);
    });
  }catch(e){}

  // show diagnostics overlay if catalog remains empty (helps identify fetch/localStorage issues)
  try{ const totalItems = (CATALOG && Array.isArray(CATALOG)) ? CATALOG.reduce((s,c)=>s + (c.items?c.items.length:0),0) : 0; if(!totalItems) setTimeout(()=>{ try{ showCatalogDiagnostics(); }catch(e){ console.warn('showCatalogDiagnostics failed',e); } }, 400); }catch(e){}
  if($('menuBtn')) $('menuBtn').addEventListener('click',()=>{ const d=$('sideDrawer'); if(d && d.classList.contains('open')) closeDrawer(); else openDrawer(); });
  if($('cartBtn')) $('cartBtn').addEventListener('click',openCartModal);
  if($('closeCart')) $('closeCart').addEventListener('click',closeCartModal);
  if($('checkoutBtn')) $('checkoutBtn').addEventListener('click',()=>{ closeCartModal(); showCheckoutFlow(); });
  if($('awareBtn')) $('awareBtn').addEventListener('click',()=>{ $('beforeCheckout').classList.add('hidden'); if($('checkoutModal')) $('checkoutModal').classList.remove('hidden'); });

  // Delegated fallback for Add-to-Cart buttons to ensure clicks work even when direct handlers fail
  document.addEventListener('click',(ev)=>{
    try{
      const btn = ev.target.closest && ev.target.closest('.add-to-cart'); if(!btn) return; // ignore non add-to-cart clicks
      // if the button's own handler ran it will temporarily set data-handled
      if(btn.dataset && btn.dataset.handled === '1') return;
      ev.preventDefault(); const id = btn.dataset && btn.dataset.id; if(!id) return; const item = findItemById(id); if(!item) return; // try to find chosen variant if present
      let chosen = null; try{ const pc = btn.closest('.product-card'); if(pc && pc._variantChosen) chosen = pc._variantChosen; else chosen = getDefaultVariant(item); }catch(e){}
      try{ btn.dataset.handled='1'; }catch(e){}
      addToCart(Object.assign({}, item, { chosen, qty:1 })); setTimeout(()=>{ try{ delete btn.dataset.handled }catch(e){} },400);
    }catch(e){ console.warn('delegated add-to-cart failed', e); }
  });
  if($('cancelCheckout')) $('cancelCheckout').addEventListener('click',()=>{ if($('checkoutModal')) $('checkoutModal').classList.add('hidden'); });
  if($('sendOrder')) $('sendOrder').addEventListener('click',(e)=>{ e.preventDefault(); prepareWhatsAppOrder($('checkoutForm')); });
  // delegated handler so dynamically-created Add To Cart buttons always work
  document.addEventListener('click', (e)=>{ try{ const addBtn = e.target.closest && e.target.closest('.add-to-cart'); if(addBtn){ e.preventDefault(); const id = addBtn.dataset && addBtn.dataset.id; if(id){ const prod = findItemById(id); if(prod) addToCart(Object.assign({}, prod, { chosen: getDefaultVariant(prod), qty:1 })); else addToCart(id); } } }catch(err){} });
  // ensure thank-you modal close button reliably works
  try{ const ty = document.getElementById('thankYouModal'); if(ty){ const closeBtn = ty.querySelector('button'); if(closeBtn) closeBtn.addEventListener('click', ()=> { ty.classList.add('hidden'); }); } }catch(e){};
  if($('searchInput')){
    // debounce input for smooth typing
    let __searchTimer = null;
    $('searchInput').addEventListener('input', async (ev)=>{
      const q = ev.target.value.trim(); const sug = $('searchSuggestions'); if(!sug) return;
      if(q.length===0){ sug.classList.remove('show'); sug.innerHTML=''; return; }
      // show temporary loading state
      sug.innerHTML = `<li class="loading">Searching…</li>`; sug.classList.add('show');
      if(__searchTimer) clearTimeout(__searchTimer);
      __searchTimer = setTimeout(async ()=>{ try{ await liveSearch(q); }catch(e){ console.error('liveSearch failed', e); } }, 160);
    });
    $('searchInput').addEventListener('focus', async (ev)=>{ const q = $('searchInput').value.trim(); if(q.length>0){ try{ await liveSearch(q); const sug = $('searchSuggestions'); if(sug) sug.classList.add('show'); }catch(e){}} });
    // keyboard navigation (arrow keys + enter)
    $('searchInput').addEventListener('keydown', (ev)=>{
      const sug = $('searchSuggestions'); if(!sug || !sug.classList.contains('show')) return; const items = Array.from(sug.querySelectorAll('li')).filter(li=>!li.classList.contains('no-result') && !li.classList.contains('loading'));
      if(items.length===0) return;
      const active = sug.querySelector('li.active'); let idx = active ? items.indexOf(active) : -1;
      if(ev.key === 'ArrowDown'){ ev.preventDefault(); if(idx+1 < items.length){ if(active) active.classList.remove('active'); items[idx+1].classList.add('active'); try{ items[idx+1].scrollIntoView({block:'nearest'}); }catch(e){} } else { if(active) active.classList.remove('active'); items[0].classList.add('active'); try{ items[0].scrollIntoView({block:'nearest'}); }catch(e){} } }
      else if(ev.key === 'ArrowUp'){ ev.preventDefault(); if(idx > 0){ if(active) active.classList.remove('active'); items[idx-1].classList.add('active'); try{ items[idx-1].scrollIntoView({block:'nearest'}); }catch(e){} } else { if(active) active.classList.remove('active'); items[items.length-1].classList.add('active'); try{ items[items.length-1].scrollIntoView({block:'nearest'}); }catch(e){} } }
      else if(ev.key === 'Enter'){ ev.preventDefault(); const sel = sug.querySelector('li.active') || items[0]; if(sel) sel.click(); else { const q = ($('searchInput').value||'').trim(); if(q.length>0){ try{ closeDrawer(); showSearchResults(q); }catch(e){ console.error('showSearchResults on Enter failed', e); } } } }
    });
  }
  document.addEventListener('click',(e)=>{ const sd = document.getElementById('sideDrawer'); const mb = document.getElementById('menuBtn'); const tn = document.querySelector('.topnav'); const inSd = sd && sd.contains(e.target); const inMb = mb && mb.contains(e.target); const inTn = tn && tn.contains(e.target); if(!inSd && !inMb && !inTn) closeDrawer(); // hide suggestions if clicking outside
    try{ const si = document.getElementById('searchInput'); const sug = document.getElementById('searchSuggestions'); const inSearch = si && si.contains(e.target); const inSug = sug && sug.contains(e.target); if(!inSearch && !inSug && sug) sug.classList.remove('show'); }catch(ex){}
  });
  // wire search button in drawer header
  if($('searchBtn')) $('searchBtn').addEventListener('click',()=>{ const q = ($('searchInput').value||'').trim(); if(q.length>0){ try{ closeDrawer(); showSearchResults(q); }catch(e){ try{ liveSearch(q.toLowerCase()); }catch(_e){} } } });
  // ensure WhatsApp float exists on all pages
  (function ensureWhatsAppFloat(){
    try{
    }catch(e){}
  })();
  // back-to-top floating button (auto-creates when missing)
  (function initBackToTop(){
    try{
      let btn = document.getElementById('backToTop');
      if(!btn){
        btn = document.createElement('button');
        btn.id='backToTop'; btn.className='back-top'; btn.setAttribute('aria-label','Go to top'); btn.textContent='▲';
        document.body.appendChild(btn);
      }
      const showWhen = 220;
      const onScroll = ()=>{ if(window.scrollY > showWhen) btn.classList.add('show'); else btn.classList.remove('show'); };
      window.addEventListener('scroll', onScroll); onScroll();
      btn.addEventListener('click', (e)=>{ e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
      const adjust = ()=>{
        try{
          const wa = $('waFloat');
          if(wa){
            const h = wa.getBoundingClientRect().height || 78;
            btn.style.bottom = (h + 26) + 'px';
            btn.style.right = '18px';
          } else {
            btn.style.bottom = '112px';
            btn.style.right = '18px';
          }
        }catch(e){}
      };
      window.addEventListener('resize', adjust); adjust();
    }catch(e){}
  })();

  // Drawer close wiring and keyboard (Escape) handler
  try{
    const drClose = document.getElementById('drawerClose'); if(drClose) drClose.addEventListener('click', ()=>{ try{ closeDrawer(); }catch(e){} });
    document.addEventListener('keydown', (ev)=>{ if(ev.key === 'Escape'){ try{ const sd = document.getElementById('sideDrawer'); if(sd && sd.classList.contains('open')) closeDrawer(); const lb = document.querySelector('.image-lightbox-overlay'); if(lb) lb.remove(); const anyModal = document.querySelector('.modal:not(.hidden)'); if(anyModal) anyModal.classList.add('hidden'); }catch(e){} } });
  }catch(e){}

  // Attempt to swap SVG social icons to PNG versions if the PNG is available (non-blocking)
  function applyPNGIcons(){
    try{
      document.querySelectorAll('img[src*="assets/icons/"]').forEach(img=>{
        try{
          const src = img.getAttribute('src'); if(!src) return; if(src.indexOf('/png/')!==-1) return; // already png
          const parts = src.split('/'); const fname = parts[parts.length-1]; const name = fname.replace('.svg','.png');
          const pngPath = parts.slice(0,-1).join('/') + '/png/' + name;
          const tester = new Image();
          tester.onload = ()=>{ img.setAttribute('src', pngPath); img.style.width = img.style.width || '28px'; img.style.height = img.style.height || '28px'; };
          tester.onerror = ()=>{};
          tester.src = pngPath;
        }catch(e){}
      });
    }catch(e){}
  }
  // apply after social links are rendered
  try{ applyPNGIcons(); }catch(e){}

  // theme toggle in drawer (init + UI)
  (function initThemeToggle(){
    try{
      const saved = localStorage.getItem('gold_theme') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const applyTheme = (t)=>{ if(t==='dark') document.documentElement.classList.add('theme-dark'); else document.documentElement.classList.remove('theme-dark'); localStorage.setItem('gold_theme', t); };
      applyTheme(saved);
      const sd = $('sideDrawer');
      if(sd){
        const topArea = sd.querySelector('.drawer-top') || sd;
        const wrap = el('div'); wrap.className = 'drawer-control theme-control';
        wrap.style.marginTop = '8px';
        const lbl = el('div'); lbl.textContent = 'Dark mode'; lbl.style.fontWeight='700'; lbl.style.color = 'var(--gold)';
        const sw = el('div'); sw.className = 'theme-switch'; const knob = el('div'); knob.className='knob'; sw.appendChild(knob);
        if(saved==='dark') sw.classList.add('dark');
        sw.addEventListener('click',()=>{
           const now = sw.classList.toggle('dark') ? 'dark' : 'light';
           applyTheme(now);
           showToast('Theme: ' + (now==='dark'?'Dark':'Light'),2);
        });
        wrap.appendChild(lbl); wrap.appendChild(sw);
        topArea.appendChild(wrap);
      }
    }catch(e){}
  })();
  (function initFontSize(){
    try{
      const savedSize = '1';
      document.documentElement.style.setProperty('--font-scale', savedSize);
      try{ localStorage.removeItem('gold_font_scale'); }catch(e){}
      const sd = $('sideDrawer');
      if(sd){
        const topArea = sd.querySelector('.drawer-top') || sd;
        const fwrap = el('div'); fwrap.className='drawer-control font-size-control';
        const flbl = el('div'); flbl.textContent='Font size'; flbl.style.fontWeight='700'; flbl.style.color='var(--gold)';
        const sel = document.createElement('select'); sel.className='fs-select'; sel.innerHTML = `<option value="0.9">Small</option><option value="1" selected>Normal</option><option value="1.1">Large</option><option value="1.2">XL</option>`; sel.value = savedSize;
        sel.addEventListener('change',(ev)=>{ const v = ev.target.value; document.documentElement.style.setProperty('--font-scale', v); });
        fwrap.appendChild(flbl); fwrap.appendChild(sel); topArea.appendChild(fwrap);
      }
    }catch(e){}
  })();
  // header scroll behaviour for calm animation
  const top = document.querySelector('.topbar'); window.addEventListener('scroll',()=>{ if(window.scrollY>12) top.classList.add('scrolled'); else top.classList.remove('scrolled'); });
  // ESC closes topmost modal or the side drawer / mobile nav
  document.addEventListener('keydown',(e)=>{ if(e.key === 'Escape'){ try{ const modals = Array.from(document.querySelectorAll('.modal')); if(modals.length>0){ const top = modals[modals.length-1]; top.remove(); } else { // no modal open — close drawer or mobile nav
            try{ closeDrawer(); const tn = document.querySelector('.topnav'); if(tn && tn.classList.contains('open-mobile')) tn.classList.remove('open-mobile'); }catch(_){} }
        }catch(ex){} } });
  // Admin trigger and handlers (attach to all footer labels)
  document.querySelectorAll('.admin-label').forEach(a=>{ a.addEventListener('click',(e)=>{ e.preventDefault(); const m = $('adminLogin'); if(m){ // inject username input if missing
        if(!$('adminUser')){
          const panel = m.querySelector('.modal-panel'); const u = document.createElement('input'); u.id='adminUser'; u.placeholder='Username'; u.style.marginBottom='8px'; u.autocomplete='username'; panel.insertBefore(u, panel.querySelector('#adminPass'));
        }
        m.classList.remove('hidden'); setTimeout(()=>{ if($('adminUser')) $('adminUser').focus(); },120);
      } }); });
  // Robust single trigger hook (in case ID selector is present)
  const adminTrigger = document.getElementById('adminTrigger'); if(adminTrigger){ adminTrigger.addEventListener('click',(e)=>{ e.preventDefault(); const m = $('adminLogin'); if(m){ if(!$('adminUser')){ const panel = m.querySelector('.modal-panel'); const u = document.createElement('input'); u.id='adminUser'; u.placeholder='Username'; u.style.marginBottom='8px'; u.autocomplete='username'; panel.insertBefore(u, panel.querySelector('#adminPass')); } m.classList.remove('hidden'); setTimeout(()=>{ if($('adminUser')) $('adminUser').focus(); },120); } }); }
  if($('adminCancel')) $('adminCancel').addEventListener('click',()=>{$('adminLogin').classList.add('hidden');});
  if($('adminLoginBtn')) $('adminLoginBtn').addEventListener('click', async ()=>{
    const user = ($('adminUser') && $('adminUser').value || '').trim();
    const pass = ($('adminPass').value || '').trim();
    if(!user){ $('adminMsg').textContent = 'Enter username'; return; }
    try{
      const data = await loadAdminUsers(); const u = (data.users||[]).find(x=>x.username.toLowerCase() === user.toLowerCase());
      if(!u){ $('adminMsg').textContent = 'Unknown user'; return; }
      if(!u.hash || u.hash.length===0){ $('adminMsg').textContent = 'No password set for this account. Owners can import/set passwords.'; return; }
      const h = await subtleHash(pass);
      if(h === u.hash){ const role = u.role || (data.owners && data.owners.includes(u.username) ? 'owner' : 'admin'); loginAdminSession(u.username, role); $('adminMsg').textContent = 'Success'; setTimeout(()=>{ $('adminLogin').classList.add('hidden'); showAdminPanel(); },600); }
      else { $('adminMsg').textContent = 'Incorrect password'; }
    }catch(e){ console.error(e); $('adminMsg').textContent = 'Login failed'; }
  });
  if($('adminClose')) $('adminClose').addEventListener('click',()=>{ const ap = $('adminPanel'); ap.classList.add('hidden'); ap.classList.remove('fullscreen'); try{ document.body.style.overflow = ''; const main = document.querySelector('main, .container'); if(main) main.removeAttribute('aria-hidden'); detachAdminKeyHandlers(); }catch(e){} renderCatalog(); renderCarousel3D();});
  // top-bar close + reload handlers
  if($('adminCloseTop')) $('adminCloseTop').addEventListener('click',()=>{ const ap = $('adminPanel'); ap.classList.add('hidden'); ap.classList.remove('fullscreen'); try{ document.body.style.overflow = ''; const main = document.querySelector('main, .container'); if(main) main.removeAttribute('aria-hidden'); detachAdminKeyHandlers(); }catch(e){} renderCatalog(); renderCarousel3D(); });
  if($('adminReload')) $('adminReload').addEventListener('click', async ()=>{ try{ await loadCatalogFromCSV(); renderCatalog(); showToast('Catalog reloaded'); }catch(e){ showToast('Reload failed: '+ (e.message||e)); console.error(e); } });
  // Normalize product references (id -> title/img) across localStorage (one-step)
  async function normalizeProductRefs(){
    if(!confirm('Normalize product references across cart, wishlist, featured and catalog? This will create a backup in localStorage. Proceed?')) return;
    try{
      const ts = Date.now();
      // backup current keys
      const bak = { cart: localStorage.getItem('gold_cart')||null, wishlist: localStorage.getItem('gold_wishlist')||null, featured: localStorage.getItem('gold_featured')||null, products: localStorage.getItem('gold_products')||null };
      localStorage.setItem('gold_refs_backup_'+ts, JSON.stringify(bak));
      // ensure catalog loaded
      await loadCatalogFromCSV();
      const map = {};
      CATALOG.forEach(cat=> cat.items.forEach(it=> map[it.id] = it));

      // Try to load authoritative titles/images from an applied merged file (txt or json).
      // If found, merge into the map so normalization uses canonical titles/images.
      try{
        let resp = null;
        const tryPaths = ['/products.applied.merged.txt','products.applied.merged.txt','./products.applied.merged.txt','/products.applied.merged.json','products.applied.merged.json','./products.applied.merged.json','/products.applied.json','products.applied.json','./products.applied.json'];
        for(const p of tryPaths){ try{ resp = await fetch(p); if(resp && resp.ok) break; }catch(e){ resp = null; } }
        if(resp && resp.ok){
          const txt = await resp.text();
          let parsed = null;
          try{ parsed = JSON.parse(txt); }catch(e){ parsed = null; }
          if(Array.isArray(parsed)){
            parsed.forEach(cat => (cat.items||[]).forEach(it=>{ if(it && it.id){ map[it.id] = Object.assign({}, map[it.id] || {}, { id: it.id, title: it.title || (map[it.id] && map[it.id].title), img: it.img || (map[it.id] && map[it.id].img) }); } }));
          } else {
            // Fallback: try to parse line-oriented text (JSONL, CSV-like or id|title|img lines)
            const lines = txt.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
            lines.forEach(line=>{
              // try JSON per-line
              try{ const obj = JSON.parse(line); if(obj && obj.id){ map[obj.id] = Object.assign({}, map[obj.id]||{}, { id: obj.id, title: obj.title || obj.name || (map[obj.id] && map[obj.id].title), img: obj.img || obj.image || (map[obj.id] && map[obj.id].img) }); return; } }catch(e){}
              const parts = line.split(/[,\t|]/).map(s=>s.trim()).filter(Boolean);
              if(parts.length>=2 && /^\d+$/.test(parts[0])){ const id = parts[0]; const title = parts[1]; const img = parts[2] || ''; map[id] = Object.assign({}, map[id]||{}, { id, title, img }); }
            });
          }
        }
      }catch(e){ console.warn('Load applied-mapped file failed', e); }

      // wishlist
      try{
        let wish = JSON.parse(localStorage.getItem('gold_wishlist')||'[]');
        wish = wish.map(w=>{
          if(!w) return null;
          if(typeof w === 'string'){ const found = map[w] || map[ (w||'').toString().trim() ] || findItemById(w); return found? snapshotItem(found) : { id: w, title: w, img: 'mini.png' }; }
          if(w.id){ const found = map[w.id] || findItemById(w.id) || findItemById(w.title); return found? snapshotItem(found) : (Object.assign({}, w)); }
          if(w.title){ const found = findItemById(w.title); if(found) return snapshotItem(found); }
          return w;
        }).filter(Boolean);
        localStorage.setItem('gold_wishlist', JSON.stringify(wish));
      }catch(e){ console.warn('Normalize wishlist failed', e); }

      // cart
      try{
        let cart = JSON.parse(localStorage.getItem('gold_cart')||'[]');
        cart = await Promise.all(cart.map(async c=>{
          if(!c) return null;
          if(typeof c === 'string'){ const found = map[c] || findItemById(c); const s = found? snapshotItem(found) : { id:c, title:c, img:'mini.png' }; s.qty = s.qty || 1; return s; }
          // handle legacy shapes where item may be stored with only title
          if(c.title && (!c.id || c.id===c.title)){
            const found = map[c.title] || findItemById(c.title);
            if(found){ const s = snapshotItem(found); s.qty = c.qty || 1; if(c.size) s.size = c.size; return s; }
          }
          const found = map[c.id] || findItemById(c.id) || findItemById(c.title);
          const base = found? snapshotItem(found) : snapshotItem(c);
          base.qty = c.qty || base.qty || 1;
          if(c.size) base.size = c.size;
          return base;
        }));
        cart = cart.filter(Boolean);
        localStorage.setItem('gold_cart', JSON.stringify(cart));
      }catch(e){ console.warn('Normalize cart failed', e); }

      // featured
      try{
        let feat = JSON.parse(localStorage.getItem('gold_featured')||'[]');
        feat = feat.map(f=>{
          if(!f) return null;
          // remove stray placeholder image names like '1.png'
          if(f.img && f.img.toString().trim() === '1.png'){ f.img = ''; }
          const found = map[f.id] || (f.title? findItemById(f.title): null) || map[(f.id||'').toString().trim()];
          if(found){ f.title = found.title || f.title; f.img = found.img || f.img; f.id = found.id || f.id; }
          return f;
        }).filter(Boolean);
        localStorage.setItem('gold_featured', JSON.stringify(feat));
        localStorage.setItem('gold_featured', JSON.stringify(feat));
      }catch(e){ console.warn('Normalize featured failed', e); }

      // update catalog items (ensure titles/images pulled from map)
      try{
        CATALOG.forEach(cat=> cat.items.forEach(it=>{ const m = map[it.id] || map[(it.title||'').toString().trim()] || findItemById(it.id) || findItemById(it.title); if(m){ it.id = m.id || it.id; it.title = m.title || it.title; it.img = m.img || it.img; } }));
        // also sweep localStorage keys that may contain embedded ids (products list, tokens etc.)
        try{
          // replace id strings in gold_products JSON (if any remaining)
          const prodRaw = localStorage.getItem('gold_products');
          if(prodRaw){ const pObj = JSON.parse(prodRaw); pObj.forEach(cat=> cat.items.forEach(it=>{ const m = map[it.id] || map[(it.title||'').toString().trim()] || findItemById(it.id) || findItemById(it.title); if(m){ it.id = m.id; it.title = m.title; it.img = m.img || it.img; } })); localStorage.setItem('gold_products', JSON.stringify(pObj)); }
        }catch(e){ console.warn('Sweep gold_products failed', e); }

        saveCatalogToLocal();
        showToast('Normalization complete. Backup: gold_refs_backup_' + ts);
        // re-render UIs that show product titles/images
        renderCatalog(); renderAdminProducts($('adminMain'));
        try{ renderCart(); renderFavorites(); updateCartUI(); }catch(e){}
      }catch(e){ console.warn('Normalize catalog failed', e); }
    }catch(e){ showToast('Normalization failed: '+(e&&e.message)); console.error(e); }
  }
  if($('normalizeRefsBtn')) $('normalizeRefsBtn').addEventListener('click', async ()=>{ const res = await requestAdminAction({type:'normalize_refs'}); if(res && res.queued) showToast('Queued for approval: ' + (res.id || '')); else if(res && res.applied) showToast('Normalization applied'); });
  // import CSV
  if($('importCsvBtn')){
    $('importCsvBtn').addEventListener('click',()=>$('importCsvFile').click());
    $('importCsvFile').addEventListener('change',async (ev)=>{
      const f = ev.target.files[0]; if(!f) return;
      const txt = await f.text(); const rows = parseCSV(txt); const header = rows[0]; const idx=(n)=>header.indexOf(n);
      const groups = {};
      for(let i=1;i<rows.length;i++){
        const r=rows[i]; // ignore supplied id on manual import
        const id = 'r'+i;
        const title = (idx('title')>=0 && r[idx('title')]) ? r[idx('title')] : (idx('name')>=0 && r[idx('name')]) ? r[idx('name')] : 'Untitled';
        const desc = (idx('description')>=0 && r[idx('description')]) ? r[idx('description')] : '';
        const img = (idx('image_url')>=0 && r[idx('image_url')] && r[idx('image_url')].startsWith('http'))?r[idx('image_url')]:'mini.png';
        const idx_sp = idx('sizes_prices');
        let variants = [];
        if(idx_sp>=0 && r[idx_sp]){
          const spRaw = r[idx_sp].toString();
          const parts = spRaw.split('|').map(s=>s.trim()).filter(Boolean);
          for(const p of parts){ const [sizePart, pricePart] = p.split(':').map(s=>s && s.trim()); if(sizePart){ const priceNum = pricePart ? Number(pricePart.toString().replace(/[^0-9\.]/g,'').replace(/,/g,'')) : 0; variants.push({size: sizePart, price: Number(priceNum||0)}); } }
        }
        const rawPrice = (idx('price')>=0 ? (r[idx('price')]||'') : '');
        const csvPrice = Number(rawPrice.toString().replace(/[^0-9\.]/g,'').replace(/,/g,'')) || 0;
        const descPrice = extractFirstPrice(desc) || 0;
        if(variants.length===0){ const extVariants = extractVariants(desc); if(extVariants && extVariants.length>0){ extVariants.forEach(v=>{ if(!v.price || isNaN(Number(v.price)) || Number(v.price)===0){ v.price = csvPrice || descPrice || v.price || 0 } v.price = Number(v.price||0); }); variants = extVariants; } }
        const price = (variants[0] && variants[0].price) || csvPrice || descPrice || 0;
        const cat = (idx('category')>=0 && r[idx('category')]) ? r[idx('category')] : guessCategory(desc,title);
        const finalVariants = (variants && variants.length>0)?variants:[{size:'Default',price:price}];
        const item={id,title,desc,price,img,flag:'',variants:finalVariants};
        if(!groups[cat])groups[cat]=[]; groups[cat].push(item);
      }
      CATALOG = Object.keys(groups).map(k=>({category:k,items:groups[k]})); saveCatalogToLocal(); renderCatalog(); const total = CATALOG.reduce((s,c)=>s + c.items.length,0); $('adminMain').innerHTML=`<div style="color:#afa">Imported ${total} products successfully</div>`;
    });
    // wire CSV cleaner button
    if($('cleanCsvBtn')) $('cleanCsvBtn').addEventListener('click',()=> openCsvCleaner());
  }
  // export buttons
  if($('downloadJson')) $('downloadJson').addEventListener('click',()=>{ const a=document.createElement('a'); a.href='data:application/json;charset=utf-8,'+encodeURIComponent(JSON.stringify(CATALOG)); a.download='goldrart_products.json'; a.click(); });
  if($('downloadCsv')) $('downloadCsv').addEventListener('click',()=>{ let csv=''; if(CATALOG.length===0) return; const rows=[['id','name','description','image_url']]; CATALOG.forEach(cat=>cat.items.forEach(it=>rows.push([it.id,it.title, it.desc, it.img||'']))); csv = rows.map(r=>r.map(c=>`"${(c||'').toString().replace(/"/g,'""')}"`).join(',')).join('\n'); const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download='goldrart_products.csv'; a.click(); });
  if($('addProductBtn')) $('addProductBtn').addEventListener('click',()=>{ openAddProductForm(); });
  // Apply cleaned catalog (from products.applied.json) into localStorage with backup
  if($('applyCleanedBtn')) $('applyCleanedBtn').addEventListener('click', async ()=>{
    if(!confirm('Apply cleaned catalog to the site? This will create a localStorage backup (gold_products_backup_<timestamp>). Proceed?')) return;
    // Owner approval: non-Owners create a pending request instead of applying directly
    const sess = currentAdminSession(); if(!sess){ showToast('Login required to apply cleaned catalog'); return; } if(sess.role !== 'owner'){ if(!confirm('You are not an Owner. This will create a pending request for Owner approval. Proceed?')) return; addPendingAction({ type:'apply_cleaned', payload:null, createdBy: sess.username, createdAt: Date.now() }); showToast('Apply request queued for Owner approval'); return; }
    try{
      // try multiple paths for the applied catalog
      let resp = null; const tryPaths = ['/products.applied.merged.json','/products.applied.json','products.applied.merged.json','products.applied.json','./products.applied.merged.json','./products.applied.json'];
      for(const p of tryPaths){ try{ resp = await fetch(p); if(resp && resp.ok) break; }catch(e){ resp = null; } }
      if(!resp || !resp.ok) throw new Error('products.applied.json not found');
      const catalog = await resp.json();
      if(!Array.isArray(catalog) || catalog.length===0){ showToast('Fetched catalog is empty or invalid — aborting apply',5); console.warn('apply aborted: invalid catalog', catalog); return; }
      // attempt to merge titles/images from whatsapp CSV if available
      try{
        let respCsv=null; const tryPaths = ['/whatsapp_products.csv.csv','whatsapp_products.csv.csv','./whatsapp_products.csv.csv','/products.csv','products.csv','./products.csv'];
        for(const p of tryPaths){ try{ respCsv = await fetch(p); if(respCsv && respCsv.ok) break; }catch(e){ respCsv = null; } }
        if(respCsv && respCsv.ok){
          const txt = await respCsv.text();
          const lines = txt.split(/\r?\n/);
          const starts = [];
          for(let i=0;i<lines.length;i++){
            if(/^"\d+/.test(lines[i].trim())) starts.push(i);
          }
          const map = {};
          for(let b=0;b<starts.length;b++){
            const s = starts[b];
            const e = (b+1<starts.length)? starts[b+1] : lines.length;
            const block = lines.slice(s,e).join('\n');
            const idm = block.match(/^"(\d+)/);
            if(!idm) continue;
            const id = idm[1];
            let title = '';
            let mm;
            const re = /""([^\"]+)""/g;
            while((mm = re.exec(block))){ const t = mm[1].trim(); if(!/Size\s*&?\s*Price/i.test(t) && t.length>1){ title = t; break; } }
            if(!title){ const re2 = /"([^\"]+)"/g; while((mm = re2.exec(block))){ const t = mm[1].trim(); if(!/Size\s*&?\s*Price/i.test(t) && t.length>1){ title = t; break; } } }
            title = title.replace(/^\*+/,'').replace(/\*+$/,'').replace(/\,$/,'').trim();
            const imgm = block.match(/https?:\/\/[^\s\"']+/i);
            const img = imgm? imgm[0] : '';
            if(title || img) map[id] = { title, img };
          }
          // apply map to catalog
          catalog.forEach(cat => cat.items.forEach(it=>{
            const mm = map[it.id]; if(mm){ if(mm.title && mm.title.length>0) it.title = mm.title; if(mm.img && mm.img.length>0) it.img = mm.img; }
          }));
        }

      }catch(e){ console.warn('Merge titles failed', e); }
      const backupKey = 'gold_products_backup_' + Date.now();
      localStorage.setItem(backupKey, localStorage.getItem('gold_products') || JSON.stringify(CATALOG));
      localStorage.setItem('gold_products', JSON.stringify(catalog));
      CATALOG = catalog;
      saveCatalogToLocal();
      renderCatalog();
      showToast('Applied cleaned catalog and saved backup: ' + backupKey);
    }catch(e){ showToast('Failed to apply cleaned catalog: '+ (e.message||e)); console.error(e); }
  });
  // Add 'Load applied JSON' admin button for local file apply (useful when site is opened via file://)
  if(!$('loadAppliedJsonBtn')){
    const loadBtn = document.createElement('button');
    loadBtn.id = 'loadAppliedJsonBtn';
    loadBtn.className = 'admin-btn';
    loadBtn.textContent = 'Load applied JSON (from file)';
    const actions = document.querySelector('.admin-actions');
    if(actions){
      actions.insertBefore(loadBtn, actions.querySelector('#addProductBtn'));
      const input = document.createElement('input');
      input.type = 'file'; input.accept = '.json,.txt'; input.id = 'loadAppliedFile'; input.style.display='none'; actions.appendChild(input);
      loadBtn.addEventListener('click',()=> input.click());
      input.addEventListener('change', async (ev)=>{
        const f = ev.target.files[0]; if(!f) return;
        try{
          const txt = await f.text(); let j = null;
          // Try parse as standard JSON
          try{ j = JSON.parse(txt); }catch(e){ j = null; }
          // Try JSON lines (each line is a JSON object/array)
          if(!j){
            const lines = txt.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
            const parsedLines = [];
            for(const line of lines){ try{ const o = JSON.parse(line); parsedLines.push(o); }catch(e){ /* ignore */ } }
            if(parsedLines.length>0) j = parsedLines;
          }
          // Try to extract an embedded JSON array
          if(!j){ const m = txt.match(/\[[\s\S]*\]/); if(m){ try{ j = JSON.parse(m[0]); }catch(e){ j = null; } } }
          if(!j || (Array.isArray(j) && j.length===0)){ showToast('Could not parse applied file. Use JSON or JSONL (one object per line), or ensure file contains a JSON array'); console.warn('Applied file parse failed', txt.slice(0,400)); return; }
          // normalize single catalog object into array
          if(!Array.isArray(j) && typeof j === 'object' && j.items && Array.isArray(j.items)) j = [j];
          const backupKey = 'gold_products_backup_'+Date.now();
          localStorage.setItem(backupKey, localStorage.getItem('gold_products') || JSON.stringify(CATALOG));
          localStorage.setItem('gold_products', JSON.stringify(j));
          CATALOG = j; saveCatalogToLocal(); renderCatalog(); showToast('Loaded applied catalog from file and saved backup: ' + backupKey, 5);
          addAudit({ type: 'applied_local_file', by: currentAdminSession() && currentAdminSession().username || 'local-import', ts: Date.now(), note: f.name });
        }catch(e){ showToast('Failed to load applied file: '+ (e && e.message)); console.error(e); }
      });
    }
  }

  // Admin: Bake catalog into site (safe, creates backup). This loads an available applied/builtin JSON and saves it into localStorage so CSV can be removed.
  if(!$('bakeCatalogBtn')){
    const bakeBtn = document.createElement('button'); bakeBtn.id = 'bakeCatalogBtn'; bakeBtn.className = 'admin-btn'; bakeBtn.textContent = 'Bake catalog into site'; const actions = document.querySelector('.admin-actions'); if(actions){ actions.insertBefore(bakeBtn, actions.querySelector('#addProductBtn')); bakeBtn.addEventListener('click', async ()=>{
      if(!confirm('Bake the catalog into the site (writes to localStorage as gold_products). This creates a backup. Proceed?')) return;
      const res = await requestAdminAction({ type: 'bake', payload: null });
      if(res && res.queued) showToast('Queued for Owner approval. Request id: ' + (res.id || '')); else if(res && res.applied) showToast('Baked catalog into site');
    }); }
  }

  // Admin: Undo last bake (restore latest gold_products_backup_bake_*)
  if(!$('undoBakeBtn')){
    const undoBtn = document.createElement('button'); undoBtn.id='undoBakeBtn'; undoBtn.className='admin-btn'; undoBtn.textContent='Undo last bake'; const actions = document.querySelector('.admin-actions'); if(actions){ actions.insertBefore(undoBtn, actions.querySelector('#bakeCatalogBtn') || actions.firstChild);
      undoBtn.addEventListener('click', async ()=>{
        if(!confirm('Restore the most recent baked catalog backup? This will overwrite current catalog. Proceed?')) return;
        const res = await requestAdminAction({ type: 'undo_bake', payload: null });
        if(res && res.queued) showToast('Undo queued for Owner approval: ' + (res.id||'')); else if(res && res.applied) showToast('Restored bake backup');
      }); }
  }
  if($('editLogoBtn')) $('editLogoBtn').addEventListener('click',()=>{ const f = document.createElement('input'); f.type='file'; f.accept='image/*'; f.onchange=async (e)=>{ const file=e.target.files[0]; if(!file) return; const data=await file.arrayBuffer(); const b= new Uint8Array(data); let s='data:'+file.type+';base64,'+btoa(String.fromCharCode(...b)); localStorage.setItem('gold_logo', s); document.querySelector('.logo').src=s; document.querySelector('.logo').style.objectFit='contain'; }; f.click(); });
  // load logo from local storage if present
  const storedLogo = localStorage.getItem('gold_logo'); if(storedLogo) { const el = document.querySelector('.logo'); if(el){ el.src = storedLogo; el.classList.add('shiny'); el.style.objectFit='contain'; } } else { const el = document.querySelector('.logo'); if(el) el.classList.add('shiny'); }
  // load wishlist
  loadWishlist();
  // ensure default English pages exist (seeded content)
  (function ensureDefaultPages(){ try{ const key='gold_pages'; const existing = localStorage.getItem(key); if(!existing){ const pages = {
        'about': { title: 'About GoldrArt', html: '<p>GoldrArt is a fine painting gallery showcasing original artworks and handcrafted prints. We provide bespoke sizes and custom commissions — contact us on WhatsApp for details.</p>' },
        'inspiration': { title: 'Inspiration', html: '<p>Browse curated inspirations and artist highlights. We add fresh selections often — follow us for seasonal collections and limited pieces.</p>' },
        'contact': { title: 'Contact Us', html: '<p>To inquire about a painting, request custom sizes, or place an order, message us on WhatsApp at +201004135874. Our team will respond promptly.</p>' },
        'painting-art': { title: 'Painting Art', html: '<p>Original paintings in a variety of styles and sizes. Use the filter or search by size to find matching pieces.</p>' },
        'canvas-print': { title: 'Canvas print', html: '<p>High-quality canvas prints suitable for framing. Available in standard and custom sizes.</p>' },
        'antiques-plants': { title: 'Antiques & Plants', html: '<p>A curated selection of vintage finds and decorative plant artworks.</p>' },
        'one-of-one-piece': { title: 'One of One Piece', html: '<p>Unique, one-off pieces — original artworks with exclusive availability.</p>' },
      }; localStorage.setItem(key, JSON.stringify(pages)); }
    }catch(e){console.error(e);} })();
  // ensure featured slides exist (seed simple placeholders)
  // global handler for unhandled promise rejections (reduces noisy console errors during dev)
window.addEventListener('unhandledrejection', (e)=>{ console.warn('Unhandled promise rejection:', e && (e.reason || e)); });

(async function ensureFeatured(){ try{ // prefer external featured.json if available only if we don't have stored featured slides (reduces 404 noise)
    const key='gold_featured'; const existing = localStorage.getItem(key);
    if(!existing){ try{ const r = await fetch('/featured.json'); if(r && r.ok){ const j = await r.json(); if(Array.isArray(j) && j.length>0){ localStorage.setItem(key, JSON.stringify(j)); } } }catch(e){}
      if(!localStorage.getItem(key)){ const arr = [ {id:'f1',title:'Holiday Selection',img:'mini.png'}, {id:'f2',title:'Exclusive Print',img:'logo.png'}, {id:'f3',title:'Ramadan Collection',img:'mini.png'}, {id:'f4',title:'Artist Pick',img:'logo.png'} ]; localStorage.setItem(key, JSON.stringify(arr)); }
    }
  }catch(e){console.error(e);} })();

// Settings helpers
function loadSettings(){ try{ return JSON.parse(localStorage.getItem('gold_settings')||'{}'); }catch(e){ return {}; } }
function saveSettings(s){ localStorage.setItem('gold_settings', JSON.stringify(s)); }
function applySettings(){ try{ const s = loadSettings() || {}; if(s.watermarkOpacity!=null) document.documentElement.style.setProperty('--watermark-opacity', s.watermarkOpacity); if(s.watermarkImage) document.documentElement.style.setProperty('--watermark-image', `url('${s.watermarkImage}')`); if(s.adminDark) document.documentElement.classList.add('admin-dark'); else document.documentElement.classList.remove('admin-dark'); /* lock font scale to 1 to avoid auto-zoom */ document.documentElement.style.setProperty('--font-scale','1'); }catch(e){console.error(e);} }

// apply saved settings on startup
applySettings();
  // attempt to detect when the Kugile font is available and add a class (improves rendering)
  try{ if(document.fonts && document.fonts.load){ document.fonts.load('1rem "Kugile"').then(()=>{ document.documentElement.classList.add('font-kugile-loaded'); }); } }catch(e){}

// Background loader: loads /background.json and applies desktop/mobile image based on screen width
function setBackgroundUrl(u){
  try{
    if(!u) return;
    console.log('[BG] Setting background:', u);
    document.body.style.backgroundImage = `url('${u}')`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.classList.add('bg-applied');
    try{ localStorage.setItem('gold_background_applied', JSON.stringify({mode:'sheet',url:u,appliedAt:Date.now()})); }catch(e){}
    console.log('[BG] Background CSS applied');
  }catch(e){ console.warn('[BG] setBackgroundUrl failed', e); }
}

async function loadAndApplyBackground(){
  try{
    console.log('[BG] loadAndApplyBackground called');
    const tryPaths = ['/background.json','background.json','./background.json']; let resp = null;
    for(const p of tryPaths){ try{ resp = await fetch(p); if(resp && resp.ok) break; }catch(e){ resp = null; } }
    if(!resp || !resp.ok) return;
    const data = await resp.json(); if(!data) return;
    const mobileBreakpoint = 720; // px threshold for mobile
    let mode = (window.innerWidth <= mobileBreakpoint) ? 'mobile' : 'desktop';
    let url = data[mode] || data.desktop || data.mobile || '';
    if(!url) return;

    const setBg = (u)=>{
      // Apply background image and ensure proper sizing
      document.body.style.backgroundImage = `url('${u}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.classList.add('bg-applied');
      try{ localStorage.setItem('gold_background_applied', JSON.stringify({mode:mode,url:u})); }catch(e){}
    };

    setBg(url);
    let lastMode = mode;
    window.addEventListener('resize', ()=>{
      const m = (window.innerWidth <= mobileBreakpoint) ? 'mobile' : 'desktop';
      if(m !== lastMode){ lastMode = m; const u = data[m] || data.desktop || data.mobile; if(u) setBg(u); }
    });
  }catch(e){ console.warn('Background loader failed', e); }
} 

  // wire favorites button
  if($('favBtn')) $('favBtn').addEventListener('click',()=>{ renderFavorites(); $('favoritesModal').classList.remove('hidden'); });
  if($('closeFav')) $('closeFav').addEventListener('click',()=>{$('favoritesModal').classList.add('hidden');});
  // coupon apply
  if($('applyCoupon')) $('applyCoupon').addEventListener('click',()=>{ const code = $('couponInput').value.trim(); if(code){ applyCouponCode(code); } else { $('couponMsg').textContent='❌ Please enter a coupon code'; $('couponMsg').style.color='#f88'; } });
  // admin: manage coupons and notifications
  if($('manageCoupons')) $('manageCoupons').addEventListener('click',()=>{ openManageCoupons(); });
  if($('manageNotifs')) $('manageNotifs').addEventListener('click',()=>{ openManageNotifs(); });
  if($('managePages')) $('managePages').addEventListener('click',()=>{ openManagePages(); });
  if($('manageInspiration')) $('manageInspiration').addEventListener('click',()=>{ openManageInspiration(); });
  // display active notifications
  displayActiveNotifications();

  // render page content when visiting a page that has editable content
  try{
    const mainEl = document.querySelector('main') || document.querySelector('[data-page]');
    const pageKey = mainEl && (mainEl.dataset && mainEl.dataset.page ? mainEl.dataset.page : (mainEl && mainEl.getAttribute && mainEl.getAttribute('data-page')));
    if(pageKey){ renderPageContent(pageKey.toLowerCase().replace(/\s+/g,'-')); }
    if(document.getElementById('inspirationList')) renderInspirationList();
  }catch(e){ }

  // If a category query param is present, prefer a category-focused view in renderCatalog
  try{ const sp = new URLSearchParams(window.location.search); const urlCat = sp.get('category'); if(urlCat) window._gold_urlCategory = decodeURIComponent(urlCat); }catch(e){}
});

// Notifications
function loadNotifications(){ try{ return JSON.parse(localStorage.getItem('gold_notifications')||'[]'); }catch(e){ return []; } }
function saveNotifications(list){ localStorage.setItem('gold_notifications', JSON.stringify(list)); }

// Android App Bridge Detection
function isAndroidApp() {
  return typeof AndroidNotif !== 'undefined' && AndroidNotif && typeof AndroidNotif.send === 'function';
}

// Send notification to Android app
function sendToAndroid(title, message) {
  try {
    // Method 1: Try AndroidNotif interface (if set up in app)
    if (typeof AndroidNotif !== 'undefined' && AndroidNotif && typeof AndroidNotif.send === 'function') {
      AndroidNotif.send(title || 'إشعار', message || '');
      console.log('✅ Notification sent to Android (Interface):', title, message);
      return true;
    }
    
    // Method 2: Title Hack (fallback - works without any setup!)
    const originalTitle = document.title;
    document.title = '[NOTIF]' + (title || 'إشعار') + ' - ' + (message || '');
    console.log('📱 Notification sent to Android (Title Hack):', document.title);
    
    // Restore original title after 1.5 seconds
    setTimeout(() => {
      document.title = originalTitle || 'متجرك';
    }, 1500);
    
    return true;
  } catch(e) {
    console.warn('⚠️ Failed to send Android notification:', e);
    return false;
  }
}

function showNotification(msg, duration=4, center=false, link=null, btnText=null){ 
  // Send to Android app if available
  const title = (msg && msg.title) ? msg.title : 'إشعار';
  const body = (msg && msg.body) ? msg.body : (typeof msg==='string'?msg:'');
  sendToAndroid(title, body);
  
  // Show on web as usual
  const n = el('div'); if(center){ n.className = 'center-notif'; // structured content
    if(msg && msg.title){ const t = el('div'); t.className='title'; t.textContent = msg.title; n.appendChild(t); }
    const m = el('div'); m.className='msg'; m.innerHTML = (msg && msg.body) ? msg.body : (typeof msg==='string'?msg:JSON.stringify(msg)); n.appendChild(m);
    if(link && btnText){ const row = el('div'); row.className='row'; const a = el('a'); a.className='cta'; a.href = link; a.target='_blank'; a.rel='noopener'; a.textContent = btnText; a.addEventListener('click',(e)=>{ e.stopPropagation(); }); row.appendChild(a); n.appendChild(row); }
    const closeBtn = el('button'); closeBtn.className='close-small'; closeBtn.innerHTML='✕'; closeBtn.addEventListener('click',(e)=>{ e.stopPropagation(); n.remove(); }); n.appendChild(closeBtn);
    n.addEventListener('click',()=>{ n.remove(); }); document.body.appendChild(n);
    setTimeout(()=>{ try{ n.style.transition='opacity .4s transform .3s'; n.style.opacity=0; n.style.transform = 'translate(-50%,-54%) scale(.98)'; setTimeout(()=>n.remove(),400); }catch(e){} }, (duration||4)*1000);
  } else {
    n.className = 'toast'; n.textContent = (typeof msg==='string')?msg:(msg && msg.body)?msg.body:JSON.stringify(msg); n.addEventListener('click',()=>{ n.remove(); }); document.body.appendChild(n); setTimeout(()=>{ n.style.transition='opacity .4s'; n.style.opacity=0; setTimeout(()=>n.remove(),400); }, (duration||4)*1000);
  } }

function displayActiveNotifications(){ const list = loadNotifications(); const now = Date.now(); const active = list.filter(n=>!n.expiresAt || n.expiresAt>now); // show admin notifications in sequence honoring settings
  let s = {}; try{ s = (typeof loadSettings === 'function') ? loadSettings() : {}; }catch(e){ console.warn('loadSettings failed', e); s = {}; }
  const defaultCenter = s.defaultNotifCenter !== undefined ? s.defaultNotifCenter : true; const defaultDuration = s.defaultNotifDuration || 4; let offset = 0; active.forEach(n=>{ const center = (n.center !== undefined) ? n.center : defaultCenter; const duration = n.durationSec || defaultDuration; setTimeout(()=> showNotification({title:n.title,body:n.msg}, duration, center, n.link || null, n.btn || null), offset*1000); offset += duration + 0.6; }); // cleanup expired
  const cleaned = list.filter(n=>!n.expiresAt || n.expiresAt>now); if(cleaned.length!==list.length) saveNotifications(cleaned); }

// Admin: coupons modal
function addModalClose(panel, modal){ const btn = el('button','modal-close'); btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`; btn.addEventListener('click',()=>{ modal.remove(); }); panel.appendChild(btn); }

function openManageCoupons(){
  const modal = el('div','modal'); modal.style.display='flex'; modal.style.alignItems='center'; modal.style.justifyContent='center';
  const panel = el('div'); panel.className='modal-panel'; panel.style.maxWidth='640px';
  panel.innerHTML = `<h3>Coupons</h3>`;
  const list = el('div'); list.style.maxHeight='50vh'; list.style.overflow='auto';
  const form = el('div'); form.innerHTML = `
    <input id='cp_code' placeholder='Code'>
    <select id='cp_type'><option value='percent'>Percent</option><option value='fixed'>Fixed EGP</option></select>
    <input id='cp_value' placeholder='Value'>
    <input id='cp_applies' placeholder='Applies to (comma-separated product id or title)'>
    <input id='cp_aliases' placeholder='Aliases (comma-separated)'>
    <input id='cp_days' placeholder='Expires in (days)'>
    <div style='display:flex;gap:8px;margin-top:8px'><button id='cp_save' class='gold'>Save</button><button id='cp_cancel' style="display:none">Cancel Edit</button><button id='cp_close'>Close</button></div>
  `;
  panel.appendChild(form); panel.appendChild(list); modal.appendChild(panel); document.body.appendChild(modal);
  addModalClose(panel, modal);
  addModalClose(panel, modal);
  const resolveApplies = (applies)=>{ if(!applies) return []; const parts = applies.split(',').map(s=>s.trim()).filter(Boolean); const ids = []; parts.forEach(p=>{ // try id then try title
      const found = findItemById(p) || findItemById(p.toString().trim()); if(found) ids.push(found.id); else ids.push(p); }); return Array.from(new Set(ids)); };
  const renderList = ()=>{ list.innerHTML=''; const coupons = loadCoupons(); if(coupons.length===0){ list.textContent='No coupons'; }
    coupons.forEach((c,idx)=>{ const r = el('div'); r.style.display='flex'; r.style.justifyContent='space-between'; r.style.alignItems='center'; r.style.padding='8px 0';
      const appliesText = (c.appliesTo && Array.isArray(c.appliesTo) && c.appliesTo.length>0) ? c.appliesTo.map(a=>{ const f = findItemById(a); return f ? `${f.title} (${a})` : a; }).join(', ') : 'Site-wide';
      r.innerHTML = `<div><strong>${c.code}</strong> - ${c.type} ${c.value} ${c.expiresAt?('(expires '+ new Date(c.expiresAt).toLocaleDateString()+')'):''}<div style='color:#bbb;font-size:12px;margin-top:6px'>Applies to: ${appliesText}${c.aliases && c.aliases.length? '<br>Aliases: ' + c.aliases.join(', '):''}</div></div>`;
      const right = el('div'); right.style.display='flex'; right.style.gap='8px'; const edit = el('button'); edit.textContent='Edit'; edit.addEventListener('click',()=>{
        panel.querySelector('#cp_code').value = c.code || ''; panel.querySelector('#cp_type').value = c.type || 'percent'; panel.querySelector('#cp_value').value = c.value || 0; panel.querySelector('#cp_days').value = c.expiresAt ? Math.max(0, Math.round((c.expiresAt - Date.now()) / (24*3600*1000))) : '';
        panel.querySelector('#cp_applies').value = c.appliesTo ? c.appliesTo.join(',') : '';
        panel.querySelector('#cp_aliases').value = c.aliases ? c.aliases.join(',') : '';
        panel.dataset.editIndex = idx; panel.querySelector('#cp_cancel').style.display = 'inline-block'; panel.querySelector('#cp_save').textContent = 'Update';
      });
      const del = el('button'); del.textContent='Delete'; del.addEventListener('click',()=>{ coupons.splice(idx,1); saveCoupons(coupons); renderList(); });
      right.appendChild(edit); right.appendChild(del); r.appendChild(right); list.appendChild(r);
    }); };
  const finishSave = ()=>{ const code = panel.querySelector('#cp_code').value.trim(); const type = panel.querySelector('#cp_type').value; const value = Number(panel.querySelector('#cp_value').value||0); const days = Number(panel.querySelector('#cp_days').value||0); const applies = panel.querySelector('#cp_applies').value || ''; const aliases = panel.querySelector('#cp_aliases').value || '';
    if(!code) return; const coupons = loadCoupons(); const obj = { code, type, value, expiresAt: days>0? Date.now() + days*24*3600*1000 : null, appliesTo: resolveApplies(applies), aliases: aliases.split(',').map(s=>s.trim()).filter(Boolean) };
    const editIndex = panel.dataset.editIndex !== undefined ? Number(panel.dataset.editIndex) : -1; if(editIndex>=0){ coupons[editIndex] = Object.assign({}, coupons[editIndex], obj); delete panel.dataset.editIndex; panel.querySelector('#cp_cancel').style.display='none'; panel.querySelector('#cp_save').textContent = 'Save'; } else { coupons.push(obj); }
    saveCoupons(coupons); renderList(); panel.querySelector('#cp_code').value=''; panel.querySelector('#cp_value').value=''; panel.querySelector('#cp_days').value=''; panel.querySelector('#cp_applies').value=''; panel.querySelector('#cp_aliases').value=''; };
  panel.querySelector('#cp_save').addEventListener('click', finishSave);
  panel.querySelector('#cp_cancel').addEventListener('click', ()=>{ delete panel.dataset.editIndex; panel.querySelector('#cp_cancel').style.display='none'; panel.querySelector('#cp_save').textContent = 'Save'; panel.querySelector('#cp_code').value=''; panel.querySelector('#cp_value').value=''; panel.querySelector('#cp_days').value=''; panel.querySelector('#cp_applies').value=''; panel.querySelector('#cp_aliases').value=''; });
  panel.querySelector('#cp_close').addEventListener('click',()=>{ modal.remove(); });
  renderList();
}

// Admin: notifications modal
function openManageNotifs(){
  const modal = el('div','modal'); modal.style.display='flex'; modal.style.alignItems='center'; modal.style.justifyContent='center';
  const panel = el('div'); panel.className='modal-panel'; panel.style.maxWidth='640px';
  panel.innerHTML = `<h3>Notifications</h3>`;
  const list = el('div'); list.style.maxHeight='50vh'; list.style.overflow='auto';
  const form = el('div'); form.innerHTML = `
    <input id='nt_msg' placeholder='Message'>
    <input id='nt_duration' placeholder='Display seconds (e.g. 4)'>
    <input id='nt_days' placeholder='Expires in (days)'>
    <div style='display:flex;gap:8px;margin-top:8px'><button id='nt_save' class='gold'>Save</button><button id='nt_close'>Close</button></div>
  `;
  panel.appendChild(form); panel.appendChild(list); modal.appendChild(panel); document.body.appendChild(modal); addModalClose(panel, modal);
  const renderList = ()=>{ list.innerHTML=''; const arr = loadNotifications(); if(arr.length===0) list.textContent='No notifications'; arr.forEach((n,idx)=>{ const r = el('div'); r.style.display='flex'; r.style.justifyContent='space-between'; r.style.alignItems='center'; r.style.padding='8px 0'; r.innerHTML = `<div><strong>${n.msg}</strong> - display ${n.durationSec}s ${n.expiresAt?('expires '+ new Date(n.expiresAt).toLocaleDateString()):''}</div>`; const del = el('button'); del.textContent='Delete'; del.addEventListener('click',()=>{ arr.splice(idx,1); saveNotifications(arr); renderList(); }); r.appendChild(del); list.appendChild(r); }); };
  panel.querySelector('#nt_save').addEventListener('click',()=>{ const msg = panel.querySelector('#nt_msg').value.trim(); const duration = Number(panel.querySelector('#nt_duration').value||4); const days = Number(panel.querySelector('#nt_days').value||0); if(!msg) return; const arr = loadNotifications(); arr.push({ id: 'n'+Date.now(), msg, durationSec: duration, expiresAt: days>0? Date.now() + days*24*3600*1000 : null }); saveNotifications(arr); renderList(); displayActiveNotifications(); });
  panel.querySelector('#nt_close').addEventListener('click',()=>{ modal.remove(); });
  renderList();
}

function openPriceAuditManager(){
  const modal = el('div','modal'); modal.style.display='flex'; modal.style.alignItems='center'; modal.style.justifyContent='center';
  const panel = el('div'); panel.className='modal-panel'; panel.style.maxWidth='760px'; panel.innerHTML = `<h3>Price & Size Audit</h3><div id='auditIntro' style='color:#bbb;margin-bottom:8px'>This will load the provided <code>products.csv</code> and compare sizes and prices against the current catalog. Review mismatches before applying fixes.</div><div id='auditReport' style='max-height:60vh;overflow:auto'></div><div style='display:flex;gap:8px;justify-content:space-between;margin-top:12px'><div><button id='auditExport' class='admin-btn'>Export JSON</button><button id='auditClose' class='admin-btn'>Close</button></div><div><button id='auditApply' class='gold'>Apply fixes</button></div></div>`;
  modal.appendChild(panel); document.body.appendChild(modal); addModalClose(panel, modal);

  const reportEl = panel.querySelector('#auditReport');
  reportEl.textContent = 'Loading CSV and comparing...';

  (async ()=>{
    try{
      // try same paths as CSV loader
      let resp = null; const tryPaths = ['/products.csv','products.csv','./products.csv','/whatsapp_products.csv.csv','whatsapp_products.csv.csv','./whatsapp_products.csv.csv'];
      for(const p of tryPaths){ try{ resp = await fetch(p); if(resp && resp.ok) break; }catch(e){ resp = null; } }
      if(!resp) throw new Error('CSV not found');
      const txt = await resp.text();
      const rows = parseCSV(txt); const header = rows[0];
      const colIndex = (name)=> header.indexOf(name);
      const idx_id = colIndex('id'); const idx_name = colIndex('name'); const idx_desc = colIndex('description'); const idx_price = colIndex('price');
      const csvMap = {};
      for(let i=1;i<rows.length;i++){ const r = rows[i]; const id = r[idx_id] || ('r'+i); const title = r[idx_name] || ('Row '+i); const desc = r[idx_desc]||''; const rawPrice = (idx_price>=0? (r[idx_price]||'') : ''); const priceNum = Number((rawPrice||'').toString().replace(/[^0-9\.]/g,'').replace(/,/g,'')) || extractFirstPrice(desc) || 0; const variants = extractVariants(desc).map(v=>({ size: normalizeSize(v.size), price: Number(v.price||0)})); csvMap[id] = {id,title,desc,price:priceNum,variants}; }

      // build catalog map by id and by title for matching
      const catalogById = {};
      const catalogByTitle = {};
      CATALOG.forEach(cat=>{ cat.items.forEach(it=>{ catalogById[it.id]=it; catalogByTitle[it.title.toLowerCase()]=it; }); });

      const issues = [];
      for(const cid in csvMap){ const cr = csvMap[cid]; let item = catalogById[cid] || catalogByTitle[cr.title.toLowerCase()]; if(!item){ issues.push({type:'missing_product',id:cid,title:cr.title,reason:'product not found in site catalog',csv:cr}); continue; }
        const siteVars = (item.variants||[]).map(v=>({size: normalizeSize(v.size||v.size), price: Number(v.price||0)}));
        const csvVars = cr.variants || [];
        // detect missing sizes present in CSV but not in site
        csvVars.forEach(cv=>{ const found = siteVars.find(sv=> sv.size === normalizeSize(cv.size)); if(!found){ issues.push({type:'missing_variant',id:item.id,title:item.title,size:cv.size,price:cv.price,csvPrice:cv.price}); } else if(found.price !== Number(cv.price)){ issues.push({type:'price_mismatch',id:item.id,title:item.title,size:cv.size,sitePrice:found.price,csvPrice:Number(cv.price)}); } });
        // detect extra variants in site not in CSV
        siteVars.forEach(sv=>{ const found = csvVars.find(cv=> normalizeSize(cv.size) === sv.size); if(!found){ issues.push({type:'extra_variant',id:item.id,title:item.title,size:sv.size,sitePrice:sv.price}); } });
      }

      // render report
      reportEl.innerHTML = '';
      if(issues.length===0){ reportEl.innerHTML = `<div style='color:#9f6'>No issues found — CSV and site match.</div>`; panel.querySelector('#auditApply').disabled = true; }
      else{
        issues.forEach((iss,idx)=>{ const r = el('div'); r.className = 'audit-issue'; r.style.padding='8px'; r.style.borderBottom='1px solid rgba(255,255,255,0.03)'; if(iss.type==='missing_product'){ r.innerHTML = `<strong style='color:${GOLD}'>Product not found</strong> — <em>${iss.title}</em> (CSV id: ${iss.id})`; } else if(iss.type==='missing_variant'){ r.innerHTML = `<strong style='color:${GOLD}'>Missing variant</strong> — <em>${iss.title}</em>: <code>${iss.size}</code> should be <strong>${iss.price}</strong> EGP`; } else if(iss.type==='price_mismatch'){ r.innerHTML = `<strong style='color:${GOLD}'>Price mismatch</strong> — <em>${iss.title}</em>: <code>${iss.size}</code> site ${iss.sitePrice} vs CSV ${iss.csvPrice}`; } else if(iss.type==='extra_variant'){ r.innerHTML = `<strong style='color:${GOLD}'>Extra variant</strong> — <em>${iss.title}</em>: <code>${iss.size}</code> site price ${iss.sitePrice}`; } reportEl.appendChild(r); });
      }

      // wire export
      panel.querySelector('#auditExport').addEventListener('click',()=>{ const data = { generatedAt: Date.now(), issues, csvCount: Object.keys(csvMap).length }; const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download = 'audit_report.json'; a.click(); URL.revokeObjectURL(url); });

      // wire apply fixes
      panel.querySelector('#auditApply').addEventListener('click',()=>{
        if(issues.length===0){ showToast('Nothing to apply'); return; }
        if(!confirm('Apply fixes found in CSV to the site catalog? This will create a backup in localStorage. Proceed?')) return;
        // backup
        const backupKey = 'gold_products_backup_'+Date.now(); localStorage.setItem(backupKey, JSON.stringify(CATALOG));
        // apply: for each missing_variant or price_mismatch, update site item
        issues.forEach(iss=>{
          if(iss.type==='missing_variant' || iss.type==='price_mismatch'){
            const it = CATALOG.flatMap(c=>c.items).find(x=>x.id===iss.id);
            if(!it) return;
            // if missing_variant: add variant
            if(iss.type==='missing_variant'){
              it.variants = it.variants || [];
              it.variants.push({size: normalizeSize(iss.size), price: Number(iss.price)});
            }
            if(iss.type==='price_mismatch'){
              // find variant and update price if exists
              it.variants = it.variants || [];
              const v = it.variants.find(vv=> normalizeSize(vv.size) === normalizeSize(iss.size));
              if(v) v.price = Number(iss.csvPrice);
              // also update item price to first variant
              it.price = it.variants[0] && it.variants[0].price ? Number(it.variants[0].price) : it.price;
            }
          }
        });
        saveCatalogToLocal();
        showToast('Applied fixes and saved a backup: ' + backupKey);
        panel.querySelector('#auditApply').disabled = true;
      });

    }catch(e){ reportEl.innerHTML = `<div style='color:#f88'>Error loading CSV: ${e.message}</div>`; console.error(e); panel.querySelector('#auditApply').disabled = true; }
  })();

  panel.querySelector('#auditClose').addEventListener('click',()=> modal.remove());
}

// CSV/XLS Cleaner: normalize sizes, strip currency, emit one-row-per-variant CSV and an Excel-compatible .xls (HTML table)
function openCsvCleaner(){
  const modal = el('div','modal'); modal.style.display='flex'; modal.style.alignItems='center'; modal.style.justifyContent='center';
  const panel = el('div'); panel.className='modal-panel'; panel.style.maxWidth='760px';
  panel.innerHTML = `<h3>CSV / XLS Cleaner</h3>
    <div style='color:#bbb;margin-bottom:8px'>Loads <code>products.csv</code>, normalizes sizes to <code>W x H</code>, strips currency symbols, and outputs a cleaned CSV (one row per variant) and an Excel-compatible file.</div>
    <div id='cleanReport' style='max-height:48vh;overflow:auto;border:1px solid rgba(255,255,255,0.02);padding:8px;border-radius:6px'></div>
    <div style='display:flex;gap:8px;justify-content:space-between;margin-top:12px'><div><button id='cleanDownloadCsv' class='gold'>Download cleaned CSV</button><button id='cleanDownloadXls' class='admin-btn'>Download Excel (.xls)</button></div><div><button id='cleanApply' class='admin-btn'>Apply to catalog</button><button id='cleanClose' class='admin-btn'>Close</button></div></div>`;
  modal.appendChild(panel); document.body.appendChild(modal); addModalClose(panel, modal);

  const reportEl = panel.querySelector('#cleanReport'); reportEl.innerHTML = 'Loading CSV...';

  (async ()=>{
    try{
      let resp=null; const tryPaths = ['/products.csv','products.csv','./products.csv','/whatsapp_products.csv.csv','whatsapp_products.csv.csv','./whatsapp_products.csv.csv'];
      for(const p of tryPaths){ try{ resp = await fetch(p); if(resp && resp.ok) break; }catch(e){ resp = null; } }
      if(!resp) throw new Error('CSV not found');
      const txt = await resp.text(); const rows = parseCSV(txt); const header = rows[0].map(h=>h.trim());
      const colIndex = (name)=> header.indexOf(name);
      const idx_id = colIndex('id'); const idx_name = colIndex('name'); const idx_desc = colIndex('description'); const idx_price = colIndex('price'); const idx_img = colIndex('image_url');

      const outRows = [];
      outRows.push(['id','title','variant_size_cm','variant_price_egp','image','source_row']);
      const issues = [];

      for(let i=1;i<rows.length;i++){
        const r = rows[i]; const id = r[idx_id] || ('r'+i); const title = r[idx_name] || ('Row '+i); const desc = r[idx_desc] || ''; const img = r[idx_img] || '';
        // price preference: explicit price column else extract from desc
        const rawPrice = (idx_price>=0? (r[idx_price]||'') : '');
        const priceNum = Number((rawPrice||'').toString().replace(/[^0-9\.]/g,'').replace(/,/g,'')) || extractFirstPrice(desc) || 0;
        const variants = extractVariants(desc) || [];
        if(variants.length===0){ // create default variant
          outRows.push([id,title,'Default',priceNum,img,i]);
        } else {
          variants.forEach(v=>{
            const size = normalizeSize(v.size||v.size);
            const price = Number(v.price || priceNum || 0);
            outRows.push([id,title,size,price,img,i]);
          });
        }
      }

      // summary
      reportEl.innerHTML = `<div style='color:#cbd'>Generated ${outRows.length-1} variant rows from ${rows.length-1} source rows</div>`;

      // create CSV text
      const csvLines = outRows.map(r=> r.map(cell=> '"'+ String(cell).replace(/"/g,'""') + '"').join(',')).join('\n');
      const blob = new Blob([csvLines],{type:'text/csv'});
      const csvUrl = URL.createObjectURL(blob);
      panel.querySelector('#cleanDownloadCsv').addEventListener('click',()=>{ const a = document.createElement('a'); a.href = csvUrl; a.download = 'products.cleaned.csv'; a.click(); });

      // create Excel-compatible .xls via HTML table
      const tableHtml = `<table border='1'><thead><tr>${outRows[0].map(h=>'<th>'+h+'</th>').join('')}</tr></thead><tbody>${outRows.slice(1).map(r=>'<tr>'+r.map(c=>'<td>'+String(c)+'</td>').join('')+'</tr>').join('')}</tbody></table>`;
      const xlsBlob = new Blob(['<html><head><meta charset="utf-8"></head><body>'+tableHtml+'</body></html>'],{type:'application/vnd.ms-excel'});
      const xlsUrl = URL.createObjectURL(xlsBlob);
      panel.querySelector('#cleanDownloadXls').addEventListener('click',()=>{ const a = document.createElement('a'); a.href = xlsUrl; a.download = 'products.cleaned.xls'; a.click(); });

      // allow apply to catalog: applying will group by product id and set variants accordingly
      panel.querySelector('#cleanApply').addEventListener('click',()=>{
        if(!confirm('Apply cleaned variants to site catalog? This will create a backup in localStorage. Proceed?')) return;
        const backupKey = 'gold_products_backup_'+Date.now(); localStorage.setItem(backupKey, JSON.stringify(CATALOG));
        // build map of id -> variants
        const map = {};
        outRows.slice(1).forEach(r=>{ const id = r[0]; const size = r[2]; const price = Number(r[3]||0); map[id] = map[id]||[]; map[id].push({ size, price }); });
        // apply
        CATALOG.forEach(cat=>{ cat.items.forEach(it=>{ if(map[it.id]){ it.variants = map[it.id]; it.price = it.variants[0] && it.variants[0].price ? Number(it.variants[0].price) : it.price; } }); });
        saveCatalogToLocal();
        showToast('Applied cleaned CSV to catalog and saved backup: '+backupKey);
      });

    }catch(e){ reportEl.innerHTML = `<div style='color:#f88'>Error: ${e.message}</div>`; console.error(e); }
  })();

  panel.querySelector('#cleanClose').addEventListener('click',()=> modal.remove());
}

function openLogoEditor(){ const modal = el('div','modal'); modal.style.display='flex'; modal.style.alignItems='center'; modal.style.justifyContent='center'; const panel = el('div'); panel.className='modal-panel'; panel.style.maxWidth='520px'; panel.innerHTML = `<h3>Edit Site Logo</h3><div style='display:flex;gap:12px;align-items:center'><img id='logoPreview' src='${localStorage.getItem('gold_logo')||'logo.png'}' style='height:80px;object-fit:contain;border-radius:6px;border:1px solid rgba(255,255,255,0.03)'><div style='display:flex;flex-direction:column;gap:8px'><button id='logoUpload' class='gold'>Upload New Logo</button><button id='logoRemove' class='admin-btn'>Use Default</button></div></div><div style='display:flex;justify-content:flex-end;margin-top:10px'><button id='logoClose' class='admin-btn'>Close</button></div>`; modal.appendChild(panel); document.body.appendChild(modal); addModalClose(panel, modal); panel.querySelector('#logoUpload').addEventListener('click',()=>{ const f = document.createElement('input'); f.type='file'; f.accept='image/*'; f.onchange=async (e)=>{ const file=e.target.files[0]; if(!file) return; const data=await file.arrayBuffer(); const b= new Uint8Array(data); let s='data:'+file.type+';base64,'+btoa(String.fromCharCode(...b)); localStorage.setItem('gold_logo', s); document.querySelector('.logo').src=s; document.querySelector('.logo').style.objectFit='contain'; panel.querySelector('#logoPreview').src=s; showToast('Logo updated'); }; f.click(); }); panel.querySelector('#logoRemove').addEventListener('click',()=>{ localStorage.removeItem('gold_logo'); document.querySelector('.logo').src='logo.png'; panel.querySelector('#logoPreview').src='logo.png'; showToast('Reverted to default'); }); panel.querySelector('#logoClose').addEventListener('click',()=>modal.remove()); }

function openAppearanceManager(){ const m = el('div','modal'); const p = el('div'); p.className='modal-panel'; p.style.maxWidth='720px'; const s = loadSettings(); p.innerHTML = `<h3>Appearance & Settings</h3>
  <div style='display:flex;flex-direction:column;gap:10px'>
    <label>Watermark image <select id='ap_watermark'><option value='logo.png'>logo.png</option><option value='name.png'>name.png</option></select></label>
    <label>Watermark opacity <input id='ap_opacity' type='range' min='0' max='0.2' step='0.01' value='${(s.watermarkOpacity!=null?s.watermarkOpacity:0.06)}'></label>
    <label><input id='ap_admin_dark' type='checkbox' ${(s.adminDark? 'checked':'')}> Admin dark style</label>
    <label>Default notification duration <input id='ap_notif_dur' type='number' min='1' value='${s.defaultNotifDuration||4}'></label>
    <label><input id='ap_notif_center' type='checkbox' ${(s.defaultNotifCenter===false?'':'checked')}> Show notifications centered by default</label>
    <label>Default font scale <select id='ap_font_scale'><option value='0.9'>Small</option><option value='1'>Normal</option><option value='1.1'>Large</option><option value='1.2'>XL</option></select></label>
    <label>Products Form URL (optional for auto-add): <input id='ap_prod_form_url' placeholder='https://docs.google.com/forms/d/e/.../formResponse' style='width:100%'></label>
    <label>Products Form Mapping (JSON, optional): <textarea id='ap_prod_form_map' placeholder='{"title":"entry.12345","desc":"entry.67890","image":"entry.11111","price":"entry.22222","category":"entry.33333"}' style='width:100%;height:80px'></textarea></label>
    <div style='display:flex;gap:8px;justify-content:flex-end'><button id='ap_save' class='gold'>Save</button><button id='ap_close' class='admin-btn'>Close</button></div>
  </div>`; m.appendChild(p); document.body.appendChild(m); addModalClose(p,m);
  const ww = p.querySelector('#ap_watermark'); ww.value = s.watermarkImage || 'logo.png'; const op = p.querySelector('#ap_opacity'); const ad = p.querySelector('#ap_admin_dark'); const nd = p.querySelector('#ap_notif_dur'); const nc = p.querySelector('#ap_notif_center'); const fs = p.querySelector('#ap_font_scale'); fs.value = '1'; fs.disabled = true; op.addEventListener('input',()=>{ document.documentElement.style.setProperty('--watermark-opacity', op.value); }); ww.addEventListener('change',()=>{ document.documentElement.style.setProperty('--watermark-image', `url('${ww.value}')`); });
  // populate product form config if present
  try{ const raw = localStorage.getItem('gold_products_form'); if(raw){ const cfg = JSON.parse(raw); if(cfg && cfg.url && p.querySelector('#ap_prod_form_url')) p.querySelector('#ap_prod_form_url').value = cfg.url; if(cfg && cfg.map && p.querySelector('#ap_prod_form_map')) p.querySelector('#ap_prod_form_map').value = JSON.stringify(cfg.map,null,2); } }catch(e){} p.querySelector('#ap_save').addEventListener('click',()=>{ const newS = { watermarkImage: ww.value, watermarkOpacity: op.value, adminDark: !!ad.checked, defaultNotifDuration: Number(nd.value||4), defaultNotifCenter: !!nc.checked, fontScale: fs.value }; saveSettings(newS); applySettings(); // save optional Products Form config
    const formUrl = (p.querySelector('#ap_prod_form_url') && p.querySelector('#ap_prod_form_url').value || '').trim(); const formMapRaw = (p.querySelector('#ap_prod_form_map') && p.querySelector('#ap_prod_form_map').value || '').trim(); if(formUrl || formMapRaw){ let cfg = {}; try{ cfg.map = formMapRaw ? JSON.parse(formMapRaw) : {}; }catch(e){ showToast('Invalid mapping JSON — not saved'); return; } if(formUrl) cfg.url = formUrl; localStorage.setItem('gold_products_form', JSON.stringify(cfg)); }
    showToast('Appearance saved'); m.remove(); }); p.querySelector('#ap_close').addEventListener('click',()=>m.remove()); }

// Pages & Inspiration management
function loadPages(){ try{ return JSON.parse(localStorage.getItem('gold_pages')||'{}'); }catch(e){ return {}; } }
function savePages(pages){ localStorage.setItem('gold_pages', JSON.stringify(pages)); }
function renderPageContent(key){ try{ const pages = loadPages(); const content = pages[key] && pages[key].html ? pages[key].html : null; const title = pages[key] && pages[key].title ? pages[key].title : null; const pageEl = document.getElementById('pageContent'); if(pageEl){ if(title) pageEl.insertAdjacentHTML('afterbegin', `<h2>${title}</h2>`); pageEl.innerHTML = (content || pageEl.innerHTML); } }catch(e){ console.error(e); } }

// Categories helpers (persisted list of categories shown in admin product forms and nav)
function loadCategories(){ try{ const raw = localStorage.getItem('gold_categories'); if(raw) return JSON.parse(raw); }catch(e){}
  // Get categories from current catalog
  const catalogCategories = [];
  try{ if(CATALOG && Array.isArray(CATALOG)){ CATALOG.forEach(cat=>{ if(cat && cat.category && !catalogCategories.includes(cat.category)){ catalogCategories.push(cat.category); } }); } }catch(e){}
  return catalogCategories.length > 0 ? catalogCategories : []; }
function saveCategories(arr){ try{ localStorage.setItem('gold_categories', JSON.stringify(arr)); showToast('Categories saved'); }catch(e){ console.error(e); showToast('Could not save categories'); } }
function ensureDefaultCategories(){ const cur = loadCategories(); saveCategories(cur); }

// Populate dynamic categories in sidebar
function renderDynamicCategories(){ 
  try{ 
    const container = document.getElementById('dynamicCategories'); 
    if(!container) return; 
    container.innerHTML = ''; 
    let cats = loadCategories(); 
    // If localStorage categories empty, try to get from CATALOG
    if(!cats || cats.length === 0){ 
      cats = CATALOG && CATALOG.length > 0 ? CATALOG.map(c => c.category).filter(Boolean) : []; 
    }
    // Remove duplicates
    cats = Array.from(new Set(cats));
    // Render category links
    cats.forEach(catName=>{ 
      const link = document.createElement('a'); 
      link.className = 'nav-sub'; 
      link.href = '/?category=' + encodeURIComponent(catName); 
      link.textContent = catName; 
      link.addEventListener('click', (e)=>{ 
        e.preventDefault();
        openCategoryView(catName);
      }); 
      container.appendChild(link); 
    }); 
  }catch(e){ 
    console.warn('renderDynamicCategories failed', e); 
  } 
}

// call ensure defaults on load
ensureDefaultCategories();
// ensure current catalog categories exist in the categories list
(function syncCatalogCategories(){ try{ CATALOG.forEach(cat=>{ const list = loadCategories(); if(!list.includes(cat.category)) { list.push(cat.category); saveCategories(list); } }); }catch(e){} })();


function openManagePages(){ const modal = el('div','modal'); modal.style.display='flex'; modal.style.alignItems='center'; modal.style.justifyContent='center'; const panel = el('div'); panel.className='modal-panel'; panel.style.maxWidth='820px'; panel.innerHTML = `<h3>Manage Pages</h3><div style='margin-bottom:8px;color:#bbb'>Edit page content that appears on static pages.</div>`; const list = el('div'); list.style.maxHeight='60vh'; list.style.overflow='auto'; panel.appendChild(list); modal.appendChild(panel); document.body.appendChild(modal); addModalClose(panel, modal);
  const defaultPages = ['about','inspiration','contact','Painting Art','Canvas print','Antiques & Plants','one of one Piece'];
  const pages = loadPages(); function renderList(){ list.innerHTML=''; defaultPages.forEach(k=>{ const key = k.toLowerCase().replace(/\s+/g,'-'); const title = (pages[key] && pages[key].title) ? pages[key].title : (k); const row = el('div'); row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.padding='8px 0'; row.innerHTML = `<div style='flex:1'><strong style='color:${GOLD}'>${title}</strong><div style='color:#bbb;font-size:13px'>${(pages[key] && pages[key].html)? pages[key].html.replace(/<[^>]+>/g,'').slice(0,120): 'No content yet'}</div></div>`; const edit = el('button'); edit.textContent='Edit'; edit.addEventListener('click',()=>{ openEditPageForm(key, k); }); row.appendChild(edit); list.appendChild(row); }); }
  function openEditPageForm(key, humanName){ const p = pages[key] || { title: humanName, html: '' }; const m = el('div','modal'); m.style.display='flex'; m.style.alignItems='center'; m.style.justifyContent='center'; const pan = el('div'); pan.className='modal-panel'; pan.style.maxWidth='760px'; pan.innerHTML = `<h3>Edit ${humanName}</h3>`; const f = el('div'); f.innerHTML = `<input id='pg_title' placeholder='Title' value='${p.title}'><textarea id='pg_html' placeholder='HTML content' style='min-height:180px'>${p.html||''}</textarea><div style='display:flex;gap:8px;margin-top:8px'><button id='pg_save' class='gold'>Save</button><button id='pg_close'>Close</button></div>`; pan.appendChild(f); m.appendChild(pan); document.body.appendChild(m); pan.querySelector('#pg_close').addEventListener('click',()=>m.remove()); pan.querySelector('#pg_save').addEventListener('click',()=>{ const newTitle = pan.querySelector('#pg_title').value.trim()||humanName; const newHtml = pan.querySelector('#pg_html').value; const pp = loadPages(); pp[key] = { title:newTitle, html:newHtml }; savePages(pp); showToast('Saved page content'); m.remove(); renderList(); }); }
  renderList(); }

function loadInspiration(){ try{ return JSON.parse(localStorage.getItem('gold_inspiration')||'[]'); }catch(e){ return []; } }
function saveInspiration(arr){ localStorage.setItem('gold_inspiration', JSON.stringify(arr)); }
function renderInspirationList(){ const root = document.getElementById('inspirationList'); if(!root) return; const arr = loadInspiration(); root.innerHTML=''; if(arr.length===0){ root.textContent='No posts yet. Add them from Admin → Manage Inspiration'; return; } arr.forEach(p=>{ const r = el('div'); r.style.padding='12px'; r.style.border='1px solid rgba(255,255,255,0.03)'; r.style.marginBottom='10px'; r.innerHTML = `<h3 style='margin:0;color:${GOLD}'>${p.title}</h3><div style='color:#bbb;margin-top:6px'>${p.excerpt||''}</div><div style='margin-top:8px'><a href='${p.url||"#"}' target='_blank' style='color:#fff;opacity:0.9'>${p.url? 'Link / Read':'No link'}</a></div>`; root.appendChild(r); }); }

function openManageInspiration(){ const modal = el('div','modal'); modal.style.display='flex'; modal.style.alignItems='center'; modal.style.justifyContent='center'; const panel = el('div'); panel.className='modal-panel'; panel.style.maxWidth='820px'; panel.innerHTML = `<h3>Manage Inspiration posts</h3><div style='margin-bottom:8px;color:#bbb'>Create, edit or delete inspiration posts shown on Inspiration page.</div>`; const list = el('div'); list.style.maxHeight='60vh'; list.style.overflow='auto'; const form = el('div'); form.innerHTML = `<input id='ip_title' placeholder='Title'><input id='ip_excerpt' placeholder='Short excerpt'><input id='ip_url' placeholder='Optional external URL'><textarea id='ip_content' placeholder='Full content (HTML allowed)' style='min-height:120px'></textarea><div style='display:flex;gap:8px;margin-top:8px'><button id='ip_save' class='gold'>Save</button><button id='ip_close'>Close</button></div>`; panel.appendChild(form); panel.appendChild(list); modal.appendChild(panel); document.body.appendChild(modal);
  function renderList(){ list.innerHTML=''; const arr = loadInspiration(); if(arr.length===0) list.textContent='No posts'; arr.forEach((p,idx)=>{ const r = el('div'); r.style.display='flex'; r.style.justifyContent='space-between'; r.style.alignItems='center'; r.style.padding='8px 0'; r.innerHTML = `<div style='flex:1'><strong>${p.title}</strong><div style='color:#bbb;font-size:13px'>${p.excerpt}</div></div>`; const edit = el('button'); edit.textContent='Edit'; edit.addEventListener('click',()=>{ openEdit(idx); }); const del = el('button'); del.textContent='Delete'; del.addEventListener('click',()=>{ const a = loadInspiration(); a.splice(idx,1); saveInspiration(a); renderList(); renderInspirationList(); }); r.appendChild(edit); r.appendChild(del); list.appendChild(r); }); }
  function openEdit(idx){ const a = loadInspiration(); const p = a[idx]; const m = el('div','modal'); m.style.display='flex'; m.style.alignItems='center'; m.style.justifyContent='center'; const pan = el('div'); pan.className='modal-panel'; pan.style.maxWidth='760px'; pan.innerHTML = `<h3>Edit Post</h3>`; const f = el('div'); f.innerHTML = `<input id='e_title' placeholder='Title' value='${p.title}'><input id='e_excerpt' placeholder='Excerpt' value='${p.excerpt||""}'><input id='e_url' placeholder='URL' value='${p.url||""}'><textarea id='e_content' style='min-height:160px'>${p.content||""}</textarea><div style='display:flex;gap:8px;margin-top:8px'><button id='e_save' class='gold'>Save</button><button id='e_close'>Close</button></div>`; pan.appendChild(f); m.appendChild(pan); document.body.appendChild(m); pan.querySelector('#e_close').addEventListener('click',()=>m.remove()); pan.querySelector('#e_save').addEventListener('click',()=>{ p.title = pan.querySelector('#e_title').value; p.excerpt = pan.querySelector('#e_excerpt').value; p.url = pan.querySelector('#e_url').value; p.content = pan.querySelector('#e_content').value; a[idx]=p; saveInspiration(a); m.remove(); renderList(); renderInspirationList(); }); }
  panel.querySelector('#ip_close').addEventListener('click',()=>modal.remove()); panel.querySelector('#ip_save').addEventListener('click',()=>{ const t = panel.querySelector('#ip_title').value.trim(); if(!t) return; const arr = loadInspiration(); arr.push({ id:'post'+Date.now(), title:t, excerpt:panel.querySelector('#ip_excerpt').value, url:panel.querySelector('#ip_url').value, content:panel.querySelector('#ip_content').value}); saveInspiration(arr); renderList(); renderInspirationList(); panel.querySelector('#ip_title').value=''; panel.querySelector('#ip_excerpt').value=''; panel.querySelector('#ip_url').value=''; panel.querySelector('#ip_content').value=''; }); renderList(); }


// Admin UI builder
var _adminKeydownHandler = null;
function attachAdminKeyHandlers(){ if(_adminKeydownHandler) return; _adminKeydownHandler = function(e){ try{
    // Close on Escape
    if(e.key === 'Escape'){
      const ap = $('adminPanel'); if(ap && !ap.classList.contains('hidden')){
        ap.classList.add('hidden'); ap.classList.remove('fullscreen'); try{ document.body.style.overflow = ''; const main = document.querySelector('main, .container'); if(main) main.removeAttribute('aria-hidden'); }catch(err){}
        renderCatalog(); renderCarousel3D(); detachAdminKeyHandlers();
      }
    }
    // Focus trap
    if(e.key === 'Tab'){
      const ap = $('adminPanel'); if(!ap || ap.classList.contains('hidden')) return;
      const focusable = ap.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if(focusable.length === 0){ e.preventDefault(); return; }
      const first = focusable[0], last = focusable[focusable.length-1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  }catch(err){ /* swallow */ }
}; document.addEventListener('keydown', _adminKeydownHandler);
}
function detachAdminKeyHandlers(){ if(_adminKeydownHandler){ document.removeEventListener('keydown', _adminKeydownHandler); _adminKeydownHandler = null; } }

function showAdminPanel(){ const ap = $('adminPanel'); ap.classList.remove('hidden'); ap.classList.add('fullscreen'); try{ document.body.style.overflow = 'hidden'; const main = document.querySelector('main, .container'); if(main) main.setAttribute('aria-hidden','true'); const elL = document.querySelector('.logo'); if(elL) elL.style.opacity='1'; }catch(e){} buildAdminMain(); setTimeout(()=>{ const ap = $('adminPanel'); if(!ap) return; const focusable = ap.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'); if(focusable && focusable.length) focusable[0].focus(); attachAdminKeyHandlers(); }, 120); }

function renderAdminProducts(root){ // render product list into provided root
  root.innerHTML='';
  CATALOG.forEach((cat,ci)=>{
    const h = el('h4'); h.textContent = cat.category; root.appendChild(h);
    cat.items.forEach((it,ii)=>{
      const row = el('div'); row.className='list-row'; row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.padding='12px 8px';
      // left: thumbnail + title/desc
      const left = el('div'); left.style.display='flex'; left.style.alignItems='center'; left.style.flex='1';
      const thumb = el('img'); thumb.src = (it.img || 'mini.png'); thumb.alt = it.title || ''; thumb.style.width='88px'; thumb.style.height='64px'; thumb.style.objectFit='cover'; thumb.style.borderRadius='6px'; thumb.style.marginRight='12px'; left.appendChild(thumb);
      const info = el('div'); info.style.flex='1'; info.innerHTML = `<div style='display:flex;align-items:center;gap:8px'><span class='gold-star small'>✦</span><strong class='title'>${it.title}</strong></div><div style='color:#bbb;font-size:13px;margin-top:6px'>${(it.desc||'').slice(0,160)}</div>`; left.appendChild(info);
      row.appendChild(left);
      // actions (right side)
      const actionsWrap = el('div'); actionsWrap.style.display='flex'; actionsWrap.style.gap='8px';
      const pubWrap = el('div'); pubWrap.className = 'social-publish-wrap';
      const fb = el('button','social-publish-btn fb'); fb.textContent='Facebook'; fb.addEventListener('click',(e)=>{ e.stopPropagation(); publishProduct(it,'facebook') });
      const ig = el('button','social-publish-btn ig'); ig.textContent='Instagram'; ig.addEventListener('click',(e)=>{ e.stopPropagation(); publishProduct(it,'instagram') });
      const tw = el('button','social-publish-btn tw'); tw.textContent='Twitter'; tw.addEventListener('click',(e)=>{ e.stopPropagation(); publishProduct(it,'twitter') });
      const tg = el('button','social-publish-btn tg'); tg.textContent='Telegram'; tg.addEventListener('click',(e)=>{ e.stopPropagation(); publishProduct(it,'telegram') });
      const wa = el('button','social-publish-btn wa'); wa.textContent='WhatsApp'; wa.addEventListener('click',(e)=>{ e.stopPropagation(); publishProduct(it,'whatsapp') });
      const all = el('button','social-publish-btn publish-all'); all.textContent='Publish All'; all.addEventListener('click',(e)=>{ e.stopPropagation(); publishProduct(it,'all') });
      pubWrap.appendChild(fb); pubWrap.appendChild(ig); pubWrap.appendChild(tw); pubWrap.appendChild(tg); pubWrap.appendChild(wa); pubWrap.appendChild(all);
      actionsWrap.appendChild(pubWrap);
      const edit = el('button'); edit.textContent='Edit'; edit.addEventListener('click',(e)=>{ e.stopPropagation(); openEditProductForm(ci,ii); });
      const del = el('button'); del.textContent='Delete'; del.addEventListener('click',(e)=>{ e.stopPropagation(); cat.items.splice(ii,1); saveCatalogToLocal(); buildAdminMain(); renderCatalog(); });
      actionsWrap.appendChild(edit); actionsWrap.appendChild(del);
      row.appendChild(actionsWrap);
      // allow tapping/clicking on row to open edit (ignore clicks on buttons)
      row.addEventListener('click',(ev)=>{ if(ev.target && (ev.target.tagName === 'BUTTON' || ev.target.closest && ev.target.closest('button'))) return; openEditProductForm(ci,ii); });
      root.appendChild(row);
    })
  });
}

function buildAdminMain(){
  const root = $('adminMain'); root.innerHTML='';
  // ensure a fullscreen toggle is available for the admin panel
  try {
    const ap = $('adminPanel');
    if (ap) {
      if (!ap.querySelector('#adminToggleFull')) {
        const t = document.createElement('button');
        t.id = 'adminToggleFull';
        t.className = 'admin-btn';
        t.textContent = ap.classList.contains('fullscreen') ? 'Exit full' : 'Full screen';
        const ctrl = ap.querySelector('.admin-panel-controls') || ap.querySelector('.admin-panel-top') || ap;
        if (ctrl) ctrl.insertBefore(t, ctrl.firstChild);
        t.addEventListener('click', () => {
          if (ap.classList.toggle('fullscreen')) t.textContent = 'Exit full'; else t.textContent = 'Full screen';
        });
      }
      // auto-open fullscreen for all devices so admin sees everything clearly
      try{
        if(!ap.classList.contains('fullscreen')){
          ap.classList.add('fullscreen'); const tbtn = ap.querySelector('#adminToggleFull'); if(tbtn) tbtn.textContent = 'Exit full';
        }
      }catch(e){}
    }
  } catch (e) { /* ignore */ }

  // show current admin session (if any)
  const sess = currentAdminSession(); if(sess){ const sdiv = el('div'); sdiv.style.marginBottom='8px'; sdiv.style.display='flex'; sdiv.style.justifyContent='space-between'; sdiv.style.alignItems='center'; sdiv.innerHTML = `<div style='color:#bbb;font-size:13px'>Logged in as <strong>${sess.username}</strong> (${sess.role})</div>`; const lo = document.createElement('button'); lo.className='admin-btn'; lo.textContent='Logout'; lo.addEventListener('click',()=>{ sessionStorage.removeItem('gold_admin_session'); showToast('Admin logged out'); buildAdminMain(); }); sdiv.appendChild(lo); root.appendChild(sdiv); }
  // Featured control button
  const featBtn = el('button','admin-btn'); featBtn.textContent = 'Manage Featured'; featBtn.addEventListener('click',()=>{ openFeaturedManager(); }); root.appendChild(featBtn);
  const manageCats = el('button','admin-btn'); manageCats.textContent = 'Manage Categories'; manageCats.addEventListener('click',()=>{ openManageCategories(); }); root.appendChild(manageCats);
  // Google Sheets quick-open (uses saved sheet URL or prompts to set one)
  const openSheetBtn = el('button','admin-btn'); openSheetBtn.textContent = 'Open Google Sheet'; openSheetBtn.title = 'Open the configured Google Sheet for editing products'; openSheetBtn.addEventListener('click', ()=>{
    const url = localStorage.getItem('gold_sheet_url') || '';
    if(url && url.trim().length>0){ openExternalLink(url); } else {
      const v = prompt('No Google Sheet URL saved yet. Paste the shareable CSV/Sheet URL here:'); if(v && v.trim().length>0){ localStorage.setItem('gold_sheet_url', v.trim()); showToast('Saved sheet URL'); openExternalLink(v.trim()); }
    }
  }); root.appendChild(openSheetBtn);

  const persistBtn = el('button','admin-btn'); persistBtn.id = 'persistAppliedBtn'; persistBtn.textContent = 'Save applied → products.applied.json'; persistBtn.title = 'Download currently applied catalog'; persistBtn.addEventListener('click',()=>{ persistAppliedToFile(); }); root.appendChild(persistBtn);
  const bakeRepoBtn = el('button','admin-btn'); bakeRepoBtn.id = 'bakeRepoBtn'; bakeRepoBtn.textContent = 'Bake & commit (owner helper)'; bakeRepoBtn.title = 'Download baked file and follow instructions to commit locally using the tools script'; bakeRepoBtn.addEventListener('click',()=>{ openBakeToRepoInstructions(); }); root.appendChild(bakeRepoBtn);
  const editSocial = el('button','admin-btn'); editSocial.textContent = 'Edit Social Links'; editSocial.addEventListener('click',()=>{ openEditSocialLinks(); }); root.appendChild(editSocial);
  const searchTestBtn = el('button','admin-btn'); searchTestBtn.textContent = 'Run Search Tests'; searchTestBtn.title = 'Run automated search checks and show summary'; searchTestBtn.addEventListener('click', async ()=>{ const res = runSearchTests(); const m = el('div','modal-panel'); m.innerHTML = `<h3>Search Test Results</h3><div style='max-height:420px;overflow:auto'><pre style='white-space:pre-wrap;color:#ddd;font-size:13px'>${JSON.stringify(res,null,2)}</pre></div><div style='display:flex;gap:8px;margin-top:12px'><button id='st_close' class='gold'>Close</button></div>`; document.body.appendChild(m); addModalClose(m.querySelector('div'),m); m.querySelector('#st_close').addEventListener('click',()=>m.remove()); }); root.appendChild(searchTestBtn);
  const tmplBtn = el('button','admin-btn'); tmplBtn.textContent = 'Manage Publish Templates'; tmplBtn.addEventListener('click',()=>{ openTemplateManager(); }); root.appendChild(tmplBtn);
  const importBtn = el('button','admin-btn'); importBtn.textContent = 'Import Tokens (JSON)'; importBtn.addEventListener('click',()=>{ openTokenImporter(); }); root.appendChild(importBtn);
  const importProductsBtn = el('button','admin-btn'); importProductsBtn.textContent = 'Import workspace products'; importProductsBtn.title = 'Load products.applied.json from the workspace and apply (will backup current catalog)'; importProductsBtn.addEventListener('click', async ()=>{
    if(!confirm('Import products from workspace file products.applied.json and apply to site (creates backup). Continue?')) return;
    try{
      // try fetch first
      let txt = null; try{ const r = await fetch('products.applied.json'); if(r.ok) txt = await r.text(); }catch(e){ txt = null; }
      if(!txt){ // fallback: prompt user to pick file (use the existing file input)
        showToast('Could not fetch workspace file, please use Load applied JSON (from file) and pick the file'); return; }
      let j = null; try{ j = JSON.parse(txt); }catch(e){ alert('Invalid JSON in products.applied.json'); console.warn('Parse failed', txt.slice(0,400)); return; }
      // normalize single catalog object into array
      if(!Array.isArray(j) && typeof j === 'object' && j.items && Array.isArray(j.items)) j = [j];
      // collect categories from file
      const foundCats = Array.from(new Set((j||[]).map(c=>c.category).filter(Boolean)));
      const curCats = loadCategories(); const missing = foundCats.filter(c=>!curCats.includes(c));
      if(missing.length>0){ if(!confirm('The following categories are present in the import but missing in site:\n' + missing.join('\n') + '\n\nCreate them now?')) return; const nc = curCats.concat(missing); saveCategories(nc); }
      const backupKey = 'gold_products_backup_'+Date.now(); localStorage.setItem(backupKey, localStorage.getItem('gold_products') || JSON.stringify(CATALOG)); localStorage.setItem('gold_products', JSON.stringify(j)); CATALOG = j; saveCatalogToLocal(); renderCatalog(); addAudit({ type: 'applied_workspace_import', by: currentAdminSession() && currentAdminSession().username || 'local-import', ts: Date.now(), note: 'products.applied.json' }); showToast('Imported products.applied.json and applied to site (backup: '+backupKey+')',6);
    }catch(e){ console.error(e); showToast('Import failed: ' + e.message); }
  }); root.appendChild(importProductsBtn);

  // CSV Mapping control (lets admin map sheet headers to site fields)
  const csvMapBtn = el('button','admin-btn'); csvMapBtn.textContent = 'CSV Mapping'; csvMapBtn.title = 'Map Google Sheet column names to site fields (title, image, featured, bg, sizes_prices)'; csvMapBtn.addEventListener('click', ()=>{ openCsvMappingModal(); }); root.appendChild(csvMapBtn);

  // Drawer user setter
  const setUserBtn = el('button','admin-btn'); setUserBtn.textContent = 'Set Drawer User'; setUserBtn.title = 'Set the name shown in the side drawer'; setUserBtn.addEventListener('click', ()=>{ const m = el('div','modal'); m.style.display='flex'; m.style.alignItems='center'; m.style.justifyContent='center'; const p = el('div'); p.className='modal-panel'; p.style.maxWidth='420px'; const cur = localStorage.getItem('gold_user') || ''; p.innerHTML = `<h3>Drawer User</h3><input id='drawer_user_input' placeholder='Name to display' value='${cur}' /><div style='display:flex;gap:8px;margin-top:12px'><button id='du_save' class='gold'>Save</button><button id='du_clear'>Clear</button><button id='du_close'>Close</button></div>`; m.appendChild(p); document.body.appendChild(m); addModalClose(p,m); p.querySelector('#du_save').addEventListener('click', ()=>{ const v = p.querySelector('#drawer_user_input').value.trim(); localStorage.setItem('gold_user', v); applyDrawerUserDisplay(); showToast('Drawer user set'); m.remove(); }); p.querySelector('#du_clear').addEventListener('click', ()=>{ localStorage.removeItem('gold_user'); applyDrawerUserDisplay(); showToast('Drawer user cleared'); m.remove(); }); p.querySelector('#du_close').addEventListener('click', ()=>m.remove()); }); root.appendChild(setUserBtn);
  // Close admin panel shortcut
  const closeAdmin = el('button','admin-btn'); closeAdmin.textContent = 'Close Admin'; closeAdmin.addEventListener('click', ()=>{ const ap = $('adminPanel'); if(ap){ ap.classList.add('hidden'); ap.classList.remove('fullscreen'); } try{ document.body.style.overflow = ''; const main = document.querySelector('main, .container'); if(main) main.removeAttribute('aria-hidden'); detachAdminKeyHandlers(); const elL = document.querySelector('.logo'); if(elL) elL.style.opacity='0.95'; const at = document.getElementById('adminTrigger'); if(at) at.focus(); }catch(e){} }); root.appendChild(closeAdmin);

  // Auto-import workspace products once (user approved): fetch products.applied.json and apply if present and categories match
  (async function autoImportWorkspaceProducts(){
    try{
      if(localStorage.getItem('gold_workspace_import_done')) return;
      let r = null; try{ r = await fetch('products.applied.json'); }catch(e){ r = null; }
      if(!r || !r.ok) return; const txt = await r.text(); let j = null; try{ j = JSON.parse(txt); }catch(e){ console.warn('products.applied.json parse failed', e); return; }
      if(!Array.isArray(j) && typeof j === 'object' && j.items && Array.isArray(j.items)) j = [j];
      const foundCats = Array.from(new Set((j||[]).map(c=>c.category).filter(Boolean)));
      const curCats = loadCategories(); const missing = foundCats.filter(c=>!curCats.includes(c));
      if(missing.length>0){ addAudit({ type: 'applied_workspace_import_blocked', by: 'auto-import', ts: Date.now(), note: 'missing-categories: ' + missing.join(',') }); showToast('Import aborted: missing categories: ' + missing.join(', '),6); localStorage.setItem('gold_workspace_import_done','blocked:'+Date.now()); return; }
      const backupKey = 'gold_products_backup_auto_'+Date.now(); localStorage.setItem(backupKey, localStorage.getItem('gold_products') || JSON.stringify(CATALOG)); localStorage.setItem('gold_products', JSON.stringify(j)); CATALOG = j; saveCatalogToLocal(); renderCatalog(); addAudit({ type: 'applied_workspace_import_auto', by: 'auto-import', ts: Date.now(), note: 'products.applied.json' }); showToast('Imported products.applied.json and applied to site (backup: '+backupKey+')',6);
      localStorage.setItem('gold_workspace_import_done', Date.now().toString());
    }catch(e){ console.warn('Auto import failed', e); }
  })();

  const importAdminsBtn = el('button','admin-btn'); importAdminsBtn.textContent = 'Import Admin Users (JSON)'; importAdminsBtn.addEventListener('click',()=>{ openAdminUserImporter(); }); root.appendChild(importAdminsBtn);
  const approvalsBtn = el('button','admin-btn'); approvalsBtn.textContent = 'Pending Approvals'; approvalsBtn.addEventListener('click',()=>{ renderAdminApprovals(); }); root.appendChild(approvalsBtn);
  const auditBtn = el('button','admin-btn'); auditBtn.textContent = 'Admin Audit Log'; auditBtn.addEventListener('click',()=>{ openAdminAuditViewer(); }); root.appendChild(auditBtn);
  const exportBtn = el('button','admin-btn'); exportBtn.textContent = 'Export Tokens'; exportBtn.addEventListener('click',()=>{ exportTokens(); }); root.appendChild(exportBtn);
  const appearanceBtn = el('button','admin-btn'); appearanceBtn.textContent = 'Appearance & Settings'; appearanceBtn.addEventListener('click',()=>{ openAppearanceManager(); }); root.appendChild(appearanceBtn);
  // show product list editable (extracted to helper)
  renderAdminProducts(root);

  // wire admin nav (supports both left sidebar or top nav/button rows)
  document.querySelectorAll('#adminPanel .nav-item').forEach(it=>{ it.addEventListener('click',()=>{ document.querySelectorAll('#adminPanel .nav-item').forEach(n=>n.classList.remove('active')); it.classList.add('active'); const section = it.dataset.section; if(section==='products'){ renderAdminProducts(root); } else if(section==='featured'){ openFeaturedManager(); } else if(section==='templates'){ openTemplateManager(); } else if(section==='tokens'){ openTokenImporter(); } else if(section==='coupons'){ openManageCoupons(); } else if(section==='notifications'){ openManageNotifs(); } else if(section==='pages'){ openManagePages(); } else if(section==='inspiration'){ openManageInspiration(); } else if(section==='appearance'){ openAppearanceManager(); } else if(section==='approvals'){ renderAdminApprovals(); } else if(section==='audit'){ openPriceAuditManager(); } else if(section==='logo'){ openLogoEditor(); } }); });

  // Register new client button opens a Google Form (placeholder URL; replace or confirm link)
  const registerBtn = document.getElementById('registerClientBtn'); if(registerBtn){ registerBtn.addEventListener('click',()=>{ const url = window.GOLDRART_REGISTER_FORM_URL || 'https://forms.gle/'; openExternalLink(url); }); registerBtn.classList.add('glow'); }

  // ensure products shown by default
  // (renderAdminProducts already called above)
}

// Featured management helpers
function loadFeatured(){ try{ return JSON.parse(localStorage.getItem('gold_featured')||'[]'); }catch(e){return []} }
function saveFeatured(arr){ localStorage.setItem('gold_featured', JSON.stringify(arr)); }

// CSV Mapping helpers: store a map of site fields to sheet headers
function loadCsvMapping(){ try{ const raw = localStorage.getItem('gold_csv_map'); if(raw) return JSON.parse(raw); }catch(e){}
  return { title:'', image:'', featured:'', bg:'', sizes_prices:'', category:'', price:'' };
}
function saveCsvMapping(map){ try{ localStorage.setItem('gold_csv_map', JSON.stringify(map)); showToast('CSV mapping saved'); }catch(e){ console.error('Could not save CSV mapping', e); showToast('Could not save mapping'); } }

function openCsvMappingModal(){ const cur = loadCsvMapping(); const m = el('div','modal'); m.style.display='flex'; m.style.alignItems='center'; m.style.justifyContent='center'; const p = el('div'); p.className='modal-panel admin-full'; p.style.maxWidth='720px'; p.innerHTML = `<h3>CSV Column Mapping</h3><div style='color:#bbb;margin-bottom:8px'>Map your Google Sheet column names to site fields. This helps when the sheet headers are custom.</div>`;
  const form = el('div'); form.style.display='grid'; form.style.gridTemplateColumns='1fr 1fr'; form.style.gap='8px';
  const fields = ['title','image','featured','bg','sizes_prices','category','price'];
  fields.forEach(f=>{ const wrapper = el('div'); const label = el('label'); label.textContent = f; const inp = el('input'); inp.id = 'map_'+f; inp.value = cur[f]||''; inp.placeholder = f + ' (sheet header name)'; wrapper.appendChild(label); wrapper.appendChild(inp); form.appendChild(wrapper); });
  p.appendChild(form);
  // sheet URL control
  const urlRow = el('div'); urlRow.style.display='flex'; urlRow.style.gap='8px'; urlRow.style.marginTop='8px'; urlRow.style.alignItems='center'; urlRow.innerHTML = `<input id='sheet_url' placeholder='Google Sheets CSV URL (shareable)'>`;
  const savedUrl = localStorage.getItem('gold_sheet_url') || '';
  setTimeout(()=>{ if(p.querySelector('#sheet_url')) p.querySelector('#sheet_url').value = savedUrl; },40);
  // helper funcs
  const saveSheet = ()=>{ const u = p.querySelector('#sheet_url').value.trim(); if(u) { localStorage.setItem('gold_sheet_url', u); showToast('Sheet URL saved'); } };
  const openSheetBtn = el('button'); openSheetBtn.className='admin-btn'; openSheetBtn.textContent='Open sheet'; openSheetBtn.addEventListener('click', ()=>{ const u = p.querySelector('#sheet_url').value.trim() || localStorage.getItem('gold_sheet_url') || ''; if(u) window.open(u,'_blank'); else showToast('No sheet URL provided'); });
  urlRow.appendChild(openSheetBtn); p.appendChild(urlRow);

  const controls = el('div'); controls.style.display='flex'; controls.style.gap='8px'; controls.style.marginTop='12px';
  const save = el('button'); save.className='admin-btn'; save.textContent='Save mapping'; save.addEventListener('click', ()=>{ const mapObj = {}; fields.forEach(f=> mapObj[f] = p.querySelector('#map_'+f).value.trim()); saveCsvMapping(mapObj); saveSheet(); m.remove(); });
  const test = el('button'); test.className='admin-btn'; test.textContent='Test CSV (preview)'; test.addEventListener('click', async ()=>{ try{ const preview = await testCsvPreview(); // build preview table
      const table = el('div'); table.style.maxHeight='40vh'; table.style.overflow='auto'; table.style.marginTop='8px'; table.style.background='#0b0b0b'; table.style.padding='8px'; table.style.borderRadius='8px'; if(preview && preview.header){ const hdr = el('div'); hdr.style.display='flex'; hdr.style.gap='12px'; hdr.style.fontWeight='800'; preview.header.forEach(h=>{ const c = el('div'); c.style.minWidth='160px'; c.textContent = h; hdr.appendChild(c); }); table.appendChild(hdr); preview.rows.slice(0,10).forEach(r=>{ const row = el('div'); row.style.display='flex'; row.style.gap='12px'; preview.header.forEach(h=>{ const c=el('div'); c.style.minWidth='160px'; c.style.color='#ddd'; c.textContent = r[h] || ''; row.appendChild(c); }); table.appendChild(row); }); } else { table.textContent='No preview available'; } const existing = p.querySelector('#csvPreviewWrap'); if(existing) existing.remove(); const wrap = el('div'); wrap.id='csvPreviewWrap'; wrap.appendChild(table); p.appendChild(wrap);
    }catch(e){ showToast('CSV preview failed'); console.error(e); } });
  const close = el('button'); close.className='gold'; close.textContent='Close'; close.addEventListener('click', ()=> m.remove());
  controls.appendChild(save); controls.appendChild(test); controls.appendChild(close); p.appendChild(controls);
  m.appendChild(p); document.body.appendChild(m);
} 

async function loadSheetUrl(){ return localStorage.getItem('gold_sheet_url') || 'https://docs.google.com/spreadsheets/d/1XQ3f00L-DBPqZdE3xlsQK9-ULMk7JiwnIqzlBxzGKoQ/gviz/tq?tqx=out:csv&gid=0'; }
async function testCsvPreview(){ // try to fetch the Google Sheets CSV and parse headers + first rows
  try{
    const csvUrl = await loadSheetUrl(); if(!csvUrl) return null; const r = await fetch(csvUrl); if(!r.ok) throw new Error('CSV fetch failed'); const txt = await r.text(); const rows = parseCSV(txt); if(!rows || rows.length===0) return null; const header = rows[0].map(h=> (h||'').toString().trim()); const sample = rows.slice(1,11).map(rw=>{ const obj = {}; header.forEach((h,idx)=> obj[h] = rw[idx] || ''); return obj; }); return { header, rows: sample };
  }catch(e){ console.error('testCsvPreview failed',e); return null; } }
function openFeaturedManager(){ const items = loadFeatured(); const m = el('div','modal'); const p = el('div'); p.className='modal-panel'; p.style.maxWidth='760px'; p.innerHTML = `<h3>Manage Featured</h3>
    <div id='featList'></div>
    <div style='display:flex;gap:8px;margin-top:12px;align-items:flex-start'>
      <select id='featProductSelect' style='min-width:180px'><option value=''>Add product…</option></select>
      <div style='display:flex;flex-direction:column;gap:6px'>
        <div style='display:flex;gap:8px;align-items:center'>
          <input id='featUpload' type='file' accept='image/*'>
          <button id='featAddUpload' class='gold'>Add Upload</button>
        </div>
        <div style='display:flex;gap:8px;margin-top:6px;align-items:center'>
          <input id='featUploadTitle' placeholder='Overlay text (optional)'>
          <select id='featUploadSize'><option value='small'>Small</option><option value='medium' selected>Medium</option><option value='large'>Large</option></select>
          <select id='featUploadPos'><option value='center'>Center</option><option value='bottom-left'>Bottom left</option><option value='bottom-right'>Bottom right</option></select>
        </div>
        <img id='featUploadPreview' style='max-width:220px;margin-top:6px;display:none;border-radius:6px;border:1px solid rgba(255,255,255,0.03)'/>
        <div style='margin-top:8px'><button id='featNewGroup' class='admin-btn'>New Group Slide</button></div>
      </div>
      <button id='featClose' class='gold'>Close</button>
    </div>
    <div style='margin-top:8px;color:#bbb;font-size:13px'>You can upload an image or add one of your products as a featured slide, or create a group slide that shows multiple products at once. Use the overlay fields to place text on the image. Changes save immediately.</div>`;
  m.appendChild(p); document.body.appendChild(m); addModalClose(p,m);
  const list = p.querySelector('#featList'); function refresh(){ list.innerHTML=''; const cur = loadFeatured(); if(cur.length===0){ list.innerHTML = '<div style="color:#bbb;padding:8px">No featured items yet</div>'; } cur.forEach((it,idx)=>{ const row = el('div'); row.style.display='flex'; row.style.alignItems='center'; row.style.gap='8px'; row.style.padding='8px 0';
    // compute thumbnail (support groups)
    let thumb = it.img || (it.items && it.items.length>0 && findItemById(it.items[0]) ? findItemById(it.items[0]).img : null) || 'mini.png';
    if(thumb && !thumb.startsWith('http') && !thumb.startsWith('data:') && !thumb.startsWith('/')){ const base = window.location.pathname.includes('/pages/') ? '../' : './'; thumb = base + thumb; }
    row.innerHTML = `<img src='${thumb}' style='width:84px;height:56px;object-fit:cover;border-radius:6px'><input class='feat-title' value='${(it.title||'')}' style='flex:1;padding:6px;border-radius:6px;border:0;background:#222;color:#ddd'><input class='feat-overlay-text' placeholder='Overlay text' value='${(it.overlay && it.overlay.text)||''}' style='width:160px;padding:6px;border-radius:6px;border:0;background:#222;color:#ddd;margin-left:6px'><select class='feat-overlay-size'><option value='small'>Small</option><option value='medium'>Medium</option><option value='large'>Large</option></select><select class='feat-overlay-pos'><option value='center'>Center</option><option value='bottom-left'>Bottom left</option><option value='bottom-right'>Bottom right</option></select><label style="margin-left:8px"><input type='checkbox' class='feat-logo-toggle' ${it.overlay && it.overlay.logo ? 'checked' : ''}> Logo</label><select class='feat-logo-size'><option value='small'>Small</option><option value='medium'>Medium</option><option value='large'>Large</option></select><select class='feat-logo-pos'><option value='bottom-right'>Bottom right</option><option value='bottom-left'>Bottom left</option><option value='top-right'>Top right</option><option value='top-left'>Top left</option><option value='center'>Center</option></select><input class='feat-link' placeholder='Link (https://...)' value='${it.link||''}' style='width:200px;margin-left:6px'><div style='display:flex;flex-direction:column;gap:6px'><button class='up' ${idx===0? 'disabled':''}>↑</button><button class='down' ${idx===cur.length-1? 'disabled':''}>↓</button><button class='rem'>Remove</button></div>`; list.appendChild(row);
    row.querySelector('.rem').addEventListener('click',()=>{ cur.splice(idx,1); saveFeatured(cur); refresh(); renderCarousel3D(); });
    row.querySelector('.up').addEventListener('click',()=>{ if(idx>0){ const a=cur[idx-1]; cur[idx-1]=cur[idx]; cur[idx]=a; saveFeatured(cur); refresh(); renderCarousel3D(); } });
    row.querySelector('.down').addEventListener('click',()=>{ if(idx<cur.length-1){ const a=cur[idx+1]; cur[idx+1]=cur[idx]; cur[idx]=a; saveFeatured(cur); refresh(); renderCarousel3D(); } });
    const titleInput = row.querySelector('.feat-title'); titleInput.addEventListener('change',()=>{ cur[idx].title = titleInput.value; saveFeatured(cur); renderCarousel3D(); });
    const overInp = row.querySelector('.feat-overlay-text'); overInp.addEventListener('change',()=>{ cur[idx].overlay = cur[idx].overlay || {}; cur[idx].overlay.text = overInp.value; saveFeatured(cur); renderCarousel3D(); });
  }); }
  // populate product select
  const sel = p.querySelector('#featProductSelect'); CATALOG.forEach(cat=>cat.items.forEach(it=>{ const opt = el('option'); opt.value = it.id; opt.textContent = `${it.title} (${cat.category})`; sel.appendChild(opt); }));
  sel.addEventListener('change',()=>{ const pid = sel.value; if(!pid) return; // find product
    let prod=null; CATALOG.forEach(cat=>cat.items.forEach(it=>{ if(it.id===pid) prod=it; })); if(prod){ const cur=loadFeatured(); cur.push({id:'p-'+prod.id,title:prod.title,img:prod.img||'mini.png', overlay:{text:'',size:'medium',pos:'center'}}); saveFeatured(cur); refresh(); renderCarousel3D(); sel.value=''; }
  });

  // New Group Slide - select multiple products to form a single featured slide
  p.querySelector('#featNewGroup').addEventListener('click',()=>{ openFeatGroupCreator(); });
  function openFeatGroupCreator(){ const gm = el('div','modal'); const gp = el('div'); gp.className='modal-panel'; gp.style.maxWidth='720px'; gp.innerHTML = `<h3>Create Group Slide</h3><div style='max-height:60vh;overflow:auto' id='groupProdList'></div><input id='groupTitle' placeholder='Group title (optional)' style='width:100%;margin-top:8px'><div style='display:flex;gap:8px;justify-content:flex-end;margin-top:10px'><button id='groupCreate' class='gold'>Create</button><button id='groupCancel' class='admin-btn'>Cancel</button></div>`; gm.appendChild(gp); document.body.appendChild(gm); addModalClose(gp,gm);
    const list = gp.querySelector('#groupProdList'); list.innerHTML=''; CATALOG.forEach(cat=>{ const h = el('div'); h.innerHTML = `<strong style='color:${GOLD}'>${cat.category}</strong>`; list.appendChild(h); cat.items.forEach(it=>{ const r = el('div'); r.style.display='flex'; r.style.alignItems='center'; r.style.gap='8px'; r.style.padding='6px 0'; r.innerHTML = `<input type='checkbox' value='${it.id}' id='g_${it.id}'><label for='g_${it.id}'>${it.title} — ${it.variants && it.variants[0]? it.variants[0].size : ''}</label>`; list.appendChild(r); }); });
    gp.querySelector('#groupCancel').addEventListener('click',()=>gm.remove());
    gp.querySelector('#groupCreate').addEventListener('click',()=>{ const checked = Array.from(gp.querySelectorAll('input[type=checkbox]:checked')).map(i=>i.value); if(checked.length===0){ alert('Select at least one product'); return; } const title = gp.querySelector('#groupTitle').value.trim() || (checked.length>1? 'Group of ' + checked.length + ' products' : 'Group'); const cur = loadFeatured(); cur.push({type:'group', items: checked, title, overlay:{logo:true,logoSize:'small',logoPos:'top-right'}}); saveFeatured(cur); gm.remove(); refresh(); renderCarousel3D(); showToast('Group slide created'); }); }


  // upload image (preview -> confirm flow)
  const up = p.querySelector('#featUpload'); let pendingUpload = null; const confirmPanel = p.querySelector('#featConfirmPanel'); const previewImg = p.querySelector('#featUploadPreview'); const logoOverlay = p.querySelector('#featLogoOverlay'); up.addEventListener('change',async (ev)=>{ const f = ev.target.files[0]; if(!f) return; const reader = new FileReader(); reader.onload = ()=>{ const dataUrl = reader.result; pendingUpload = {id:'u'+Date.now(),title:f.name,img:dataUrl}; previewImg.src = dataUrl; previewImg.style.display='block'; confirmPanel.style.display='block'; }; reader.readAsDataURL(f); up.value=''; });
  p.querySelector('#featPrepareUpload').addEventListener('click',()=>{ if(!pendingUpload){ alert('Please choose an image first (upload or import)'); return; } // show confirm UI
    previewImg.src = pendingUpload.img; // sync logo overlay preview
    const ls = p.querySelector('#featLogoSize').value||'small'; const lp = p.querySelector('#featLogoPos').value||'bottom-right'; logoOverlay.className = 'feat-logo-overlay ' + ls + ' ' + lp; logoOverlay.style.display = p.querySelector('#featLogoToggle').checked ? 'block' : 'none'; const base = window.location.pathname.includes('/pages/') ? '../' : './'; logoOverlay.src = base + 'logo.png'; confirmPanel.style.display='block'; });
  // import by URL
  p.querySelector('#featImportBtn').addEventListener('click',()=>{ const url = p.querySelector('#featImportUrl').value.trim(); if(!url) return showToast('Enter an image URL'); const img = new Image(); img.crossOrigin='anonymous'; img.onload = ()=>{ pendingUpload = {id:'u'+Date.now(),title:url.split('/').pop(),img:url}; previewImg.src = url; previewImg.style.display='block'; const ls = p.querySelector('#featLogoSize').value||'small'; const lp = p.querySelector('#featLogoPos').value||'bottom-right'; logoOverlay.className = 'feat-logo-overlay ' + ls + ' ' + lp; logoOverlay.style.display = p.querySelector('#featLogoToggle').checked ? 'block' : 'none'; const base = window.location.pathname.includes('/pages/') ? '../' : './'; logoOverlay.src = base + 'logo.png'; confirmPanel.style.display='block'; showToast('Image loaded'); }; img.onerror = ()=>{ showToast('Failed to load image'); }; img.src = url; });
  // update logo overlay preview
  p.querySelector('#featLogoToggle').addEventListener('change',(ev)=>{ logoOverlay.style.display = ev.target.checked ? 'block' : 'none'; });
  p.querySelector('#featLogoSize').addEventListener('change',(ev)=>{ logoOverlay.className = 'feat-logo-overlay '+ ev.target.value + ' ' + p.querySelector('#featLogoPos').value; });
  p.querySelector('#featLogoPos').addEventListener('change',(ev)=>{ logoOverlay.className = 'feat-logo-overlay ' + p.querySelector('#featLogoSize').value + ' ' + ev.target.value; });
  p.querySelector('#featCancelUpload').addEventListener('click',()=>{ pendingUpload=null; previewImg.src=''; confirmPanel.style.display='none'; p.querySelector('#featUploadTitle').value=''; p.querySelector('#featLinkImage').value=''; p.querySelector('#featDirectLink').value=''; });
  p.querySelector('#featConfirmUpload').addEventListener('click', async ()=>{ if(!pendingUpload){ alert('No image to confirm'); return; } const title = p.querySelector('#featUploadTitle').value||pendingUpload.title || ''; const size = p.querySelector('#featUploadSize').value||'medium'; const pos = p.querySelector('#featUploadPos').value||'center'; const logoOn = !!p.querySelector('#featLogoToggle').checked; const logoSize = p.querySelector('#featLogoSize').value||'small'; const logoPos = p.querySelector('#featLogoPos').value||'bottom-right'; const linkImg = p.querySelector('#featLinkImage').value.trim() || null; const directLink = p.querySelector('#featDirectLink').value.trim() || null; const cur = loadFeatured(); let finalImg = pendingUpload.img; if(logoOn){ try{ finalImg = await composeImageWithLogo(pendingUpload.img, (window.location.pathname.includes('/pages/') ? '../' : './') + 'logo.png', logoSize, logoPos); }catch(e){ console.error('Logo overlay failed',e); showToast('Could not overlay logo, using original image'); finalImg = pendingUpload.img; } } const item = Object.assign({},pendingUpload,{title,img: linkImg || finalImg,overlay:{text:title,size,pos,logo:logoOn,logoSize,logoPos}, link: directLink || null}); cur.push(item); saveFeatured(cur); pendingUpload=null; previewImg.src=''; confirmPanel.style.display='none'; p.querySelector('#featUploadTitle').value=''; p.querySelector('#featLinkImage').value=''; p.querySelector('#featDirectLink').value=''; refresh(); renderCarousel3D(); showToast('Featured slide added'); });
  p.querySelector('#featConfirmLink').addEventListener('click',()=>{ const link = p.querySelector('#featDirectLink').value.trim(); const linkImg = p.querySelector('#featLinkImage').value.trim(); if(!link) return showToast('Enter a link'); const cur = loadFeatured(); cur.push({id:'l'+Date.now(),title:link, img: linkImg || pendingUpload && pendingUpload.img || 'mini.png', overlay:{text:'',size:'medium',pos:'center'}, link}); saveFeatured(cur); pendingUpload=null; previewImg.src=''; confirmPanel.style.display='none'; p.querySelector('#featUploadTitle').value=''; p.querySelector('#featLinkImage').value=''; p.querySelector('#featDirectLink').value=''; refresh(); renderCarousel3D(); });
  p.querySelector('#featClose').addEventListener('click',()=>{ m.remove(); });
  refresh(); }

// helper to compose image with logo (returns data URL)
async function composeImageWithLogo(baseImageSrc, logoSrc, logoSize='medium', logoPos='bottom-right'){
  return new Promise((resolve, reject)=>{
    const base = new Image(); base.crossOrigin='anonymous'; base.onload = ()=>{
      const canvas = document.createElement('canvas'); canvas.width = base.width; canvas.height = base.height; const ctx = canvas.getContext('2d'); ctx.drawImage(base,0,0);
      const logo = new Image(); logo.crossOrigin='anonymous'; logo.onload = ()=>{
        const map = { small: 0.12, medium:0.18, large:0.26 };
        const pct = map[logoSize] || 0.18; const w = Math.round(canvas.width * pct); const h = Math.round(logo.height * (w/logo.width));
        let x=0,y=0; const pad = Math.round(canvas.width*0.04);
        switch(logoPos){ case 'bottom-right': x = canvas.width - w - pad; y = canvas.height - h - pad; break; case 'bottom-left': x = pad; y = canvas.height - h - pad; break; case 'top-right': x = canvas.width - w - pad; y = pad; break; case 'top-left': x = pad; y = pad; break; case 'center': x = Math.round((canvas.width - w)/2); y = Math.round((canvas.height - h)/2); break; default: x = canvas.width - w - pad; y = canvas.height - h - pad; }
        ctx.drawImage(logo, x, y, w, h);
        resolve(canvas.toDataURL('image/jpeg',0.92));
      };
      logo.onerror = ()=>{ reject(new Error('Logo load failed')); };
      logo.src = logoSrc;
    };
    base.onerror = ()=>{ reject(new Error('Base image load failed')); };
    base.src = baseImageSrc;
  });
}

// helper: submit a product to an admin-configured form URL (optional — admin can configure in Appearance)
async function submitProductToForm(product){
  try{
    const raw = localStorage.getItem('gold_products_form'); if(!raw) return { reason: 'no_form' };
    let cfg = null; try{ cfg = JSON.parse(raw); }catch(e){ return { reason: 'invalid_cfg' }; }
    if(!cfg || !cfg.url) return { reason: 'no_form' };
    const map = cfg.map || {};
    const body = new URLSearchParams();
    // append mapped fields if mapping provided, otherwise use common keys
    body.append(map.title || 'title', product.title || '');
    body.append(map.desc || 'description', product.desc || '');
    body.append(map.image || 'image', product.img || '');
    body.append(map.price || 'price', String(product.price || (product.variants && product.variants[0] && product.variants[0].price) || ''));
    body.append(map.category || 'category', product.category || '');
    // additional fields can be added in mapping
    const resp = await fetch(cfg.url, { method: 'POST', body: body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
    // Google Forms may redirect (302) or return 200 — treat both as OK
    return { ok: resp && (resp.status === 200 || resp.status === 0 || resp.status === 302) };
  }catch(e){ console.warn('submitProductToForm failed', e); return { ok:false, error: e.message }; }
}

// Image lightbox (shows a fullscreen image and optional 'View details' button)
function showImageLightbox(url, product){ try{
  const existing = document.getElementById('gold_image_lightbox'); if(existing) existing.remove();
  const overlay = document.createElement('div'); overlay.id = 'gold_image_lightbox'; overlay.className = 'image-lightbox-overlay';

  const container = document.createElement('div'); container.className = 'image-lightbox-container';
  const img = document.createElement('img'); img.src = url || 'mini.png'; img.className = 'image-lightbox-img'; container.appendChild(img);

  // centered faint logo overlay on image
  const logo = document.createElement('img'); logo.className = 'image-lightbox-logo'; logo.src = (window.location.pathname.includes('/pages/') ? '../' : './') + 'logo.png'; container.appendChild(logo);

  // X close button (styled like modal-close)
  const closeX = document.createElement('button'); closeX.className = 'modal-close lightbox-close'; closeX.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6L18 18M6 18L18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  closeX.addEventListener('click', ()=> overlay.remove()); container.appendChild(closeX);

  // action buttons under the image
  const actions = document.createElement('div'); actions.className = 'lightbox-actions';
  const viewBtn = document.createElement('button'); viewBtn.className = 'gold-btn'; viewBtn.textContent = 'View Details';
  viewBtn.addEventListener('click', ()=>{ overlay.remove(); if(product) openProductModal(product); });
  const closeBtn = document.createElement('button'); closeBtn.className = 'gold-btn'; closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', ()=> overlay.remove());
  actions.appendChild(viewBtn); actions.appendChild(closeBtn);
  container.appendChild(actions);

  overlay.appendChild(container);

  overlay.addEventListener('click', (e)=>{ if(e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  window.addEventListener('keyup', function onKey(e){ if(e.key === 'Escape'){ overlay.remove(); window.removeEventListener('keyup', onKey); } });
}catch(e){ console.warn('showImageLightbox failed', e); } }

// --- Publish Template Manager ---
function openTemplateManager(){ const m = el('div','modal'); const p = el('div'); p.className='modal-panel'; p.style.maxWidth='760px'; p.innerHTML = `<h3>Publish Templates</h3><div id='tmplList'></div><div style='display:flex;gap:8px;margin-top:12px'><button id='tmplNew' class='gold'>New Template</button><button id='tmplImport'>Import JSON</button><button id='tmplExport' class='admin-btn'>Export</button><button id='tmplClose' class='admin-btn'>Close</button></div><div style='margin-top:8px;color:#bbb;font-size:13px'>Templates support variables: {{title}}, {{desc}}, {{url}}, {{price}}. Use platform-specific templates (facebook, instagram, twitter, telegram, whatsapp).</div>`; m.appendChild(p); document.body.appendChild(m); addModalClose(p,m);
  const list = p.querySelector('#tmplList'); function refresh(){ list.innerHTML=''; const t = JSON.parse(localStorage.getItem('gold_publish_templates')||'{}'); const keys = Object.keys(t); if(keys.length===0) list.innerHTML='<div style="color:#bbb;padding:8px">No templates yet</div>'; keys.forEach(k=>{ const it = t[k]; const row = el('div'); row.style.padding='8px 0'; row.innerHTML = `<strong>${it.name} (${k})</strong><div style='color:#ddd;margin-top:6px;white-space:pre-wrap'>${it.body}</div><div style='margin-top:6px'><button class='edit'>Edit</button><button class='del'>Delete</button><button class='preview'>Preview</button></div>`; list.appendChild(row); row.querySelector('.del').addEventListener('click',()=>{ delete t[k]; localStorage.setItem('gold_publish_templates', JSON.stringify(t)); refresh(); }); row.querySelector('.edit').addEventListener('click',()=>{ openTemplateEdit(k,it); }); row.querySelector('.preview').addEventListener('click',()=>{ previewTemplate(it); }); }); }
  function openTemplateEdit(key,it){ const mm = el('div','modal'); const pp = el('div'); pp.className='modal-panel'; pp.style.maxWidth='680px'; pp.innerHTML = `<h3>Edit Template</h3><input id='t_name' placeholder='Template name' value='${it.name}'><select id='t_platform'><option value='facebook'>Facebook</option><option value='instagram'>Instagram</option><option value='twitter'>Twitter</option><option value='telegram'>Telegram</option><option value='whatsapp'>WhatsApp</option></select><textarea id='t_body' style='height:160px'>${it.body}</textarea><div style='display:flex;gap:8px;margin-top:8px'><button id='t_save' class='gold'>Save</button><button id='t_cancel' class='admin-btn'>Cancel</button></div>`; mm.appendChild(pp); document.body.appendChild(mm); pp.querySelector('#t_platform').value = key; pp.querySelector('#t_cancel').addEventListener('click',()=>mm.remove()); pp.querySelector('#t_save').addEventListener('click',()=>{ const name = pp.querySelector('#t_name').value||'Unnamed'; const platform = pp.querySelector('#t_platform').value; const body = pp.querySelector('#t_body').value||''; const t = JSON.parse(localStorage.getItem('gold_publish_templates')||'{}'); t[platform] = {name,body}; localStorage.setItem('gold_publish_templates', JSON.stringify(t)); mm.remove(); refresh(); }); }
  function previewTemplate(it){ const preview = el('div','modal'); const panel = el('div'); panel.className='modal-panel'; panel.innerHTML = `<h3>Preview: ${it.name}</h3><div style='background:#111;padding:12px;border-radius:6px;color:#ddd;margin-top:8px;white-space:pre-wrap'>${(it.body||'').replace(/\{\{title\}\}/g,'Sample Title').replace(/\{\{desc\}\}/g,'Short description...').replace(/\{\{url\}\}/g,'https://example.com').replace(/\{\{price\}\}/g,'EGP 2500')}</div><div style='display:flex;justify-content:flex-end;margin-top:12px'><button class='gold'>Close</button></div>`; preview.appendChild(panel); document.body.appendChild(preview); addModalClose(panel, preview); panel.querySelector('.gold').addEventListener('click',()=> preview.remove()); }
  p.querySelector('#tmplNew').addEventListener('click',()=>{ openTemplateEdit('new',{name:'New Template',body:'{{title}}\n{{desc}}\n{{url}}'}); });
  p.querySelector('#tmplImport').addEventListener('click',()=>{ const inp = el('input'); inp.type='file'; inp.accept='application/json'; inp.addEventListener('change',()=>{ const f=inp.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ const o=JSON.parse(r.result); localStorage.setItem('gold_publish_templates', JSON.stringify(o)); refresh(); showToast('Templates imported'); }catch(e){ alert('Invalid JSON'); } }; r.readAsText(f); }); inp.click(); });
  p.querySelector('#tmplExport').addEventListener('click',()=>{ const data = localStorage.getItem('gold_publish_templates')||'{}'; const a = el('a'); a.href = 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(data))); a.download = 'templates.json'; a.click(); });
  p.querySelector('#tmplClose').addEventListener('click',()=>{ m.remove(); });
  refresh(); }

// Token importer
function openTokenImporter(){ const m = el('div','modal'); const p = el('div'); p.className='modal-panel'; p.style.maxWidth='640px'; p.innerHTML = `<h3>Import Tokens (JSON)</h3><div style='display:flex;gap:8px;align-items:center'><input id='tokensFile' type='file' accept='application/json'><input id='adminSecretInp' placeholder='Admin secret (optional for server upload)'></div><div style='display:flex;gap:8px;margin-top:10px'><button id='tokensUpload' class='gold'>Upload to Server</button><button id='tokensLocal' class='admin-btn'>Import Locally</button><button id='tokensClose' class='admin-btn'>Close</button></div><div style='margin-top:8px;color:#bbb;font-size:13px'>If you have ADMIN_SECRET set in Netlify, provide it to upload tokens to the server securely. Otherwise use 'Import Locally' (stores in localStorage for dev testing).</div>`; m.appendChild(p); document.body.appendChild(m);
  p.querySelector('#tokensLocal').addEventListener('click',()=>{ const f = p.querySelector('#tokensFile').files[0]; if(!f){ alert('Choose a file first'); return; } const r = new FileReader(); r.onload=()=>{ try{ const o = JSON.parse(r.result); localStorage.setItem('gold_tokens', JSON.stringify(o)); showToast('Tokens imported locally'); m.remove(); }catch(e){ alert('Invalid JSON'); } }; r.readAsText(f); });
  p.querySelector('#tokensUpload').addEventListener('click', async ()=>{ const f = p.querySelector('#tokensFile').files[0]; const secret = p.querySelector('#adminSecretInp').value.trim(); if(!f){ alert('Choose a file first'); return; } if(!secret){ alert('Enter ADMIN_SECRET to upload'); return; } const r = new FileReader(); r.onload=async ()=>{ try{ const o = JSON.parse(r.result); const resp = await fetch('/.netlify/functions/admin_set_tokens',{method:'POST',headers:{'Content-Type':'application/json','x-admin-secret':secret},body:JSON.stringify(o)}); const j = await resp.json(); if(resp.ok) { showToast('Tokens uploaded to server'); m.remove(); } else { alert('Upload failed: ' + JSON.stringify(j)); } }catch(e){ alert('Invalid JSON'); } }; r.readAsText(f); });
}

function exportTokens(){ const t = localStorage.getItem('gold_tokens')||'{}'; const a = el('a'); a.href = 'data:application/json;base64,' + btoa(unescape(encodeURIComponent(t))); a.download = 'tokens.json'; a.click(); showToast('Tokens exported'); }


function openAddProductForm(){
  const modal = el('div','modal'); modal.style.position='fixed'; modal.style.left=0; modal.style.top=0; modal.style.width='100%'; modal.style.height='100%'; modal.style.display='flex'; modal.style.alignItems='center'; modal.style.justifyContent='center';
  const panel = el('div'); panel.className='modal-panel'; panel.style.maxWidth='680px';
  panel.innerHTML = `<h3>Add Product</h3>`;
  const form = el('div');
  // build category select from persisted categories
  const cats = loadCategories();
  const opts = cats.map(c=>`<option value="${c}">${c}</option>`).join('');
  form.innerHTML = `
    <input id='np_title' placeholder='Title'>
    <textarea id='np_desc' placeholder='Description'></textarea>
    <input id='np_img' placeholder='Image URL or leave empty for upload'>
    <input id='np_price' placeholder='Price (EGP)'>
    <label style='display:block;margin-top:8px'>Category</label>
    <select id='np_cat' style='min-width:220px'>${opts}</select>
    <div style='display:flex;gap:8px;margin-top:8px'>
      <label><input type='checkbox' id='np_new'> New arrival</label>
      <label><input type='checkbox' id='np_one'> One of One</label>
      <input id='np_discount' placeholder='Discount % (optional)'>
    </div>
    <div style='display:flex;gap:8px;margin-top:8px'><button id='np_save' class='gold'>Save</button><button id='np_cancel'>Cancel</button></div>
  `;
  panel.appendChild(form); modal.appendChild(panel); document.body.appendChild(modal); addModalClose(panel, modal);
  panel.querySelector('#np_cancel').addEventListener('click',()=>modal.remove());
  panel.querySelector('#np_save').addEventListener('click',()=>{
    const title=panel.querySelector('#np_title').value||'Untitled'; const desc=panel.querySelector('#np_desc').value||''; const img=panel.querySelector('#np_img').value||'mini.png'; const price=Number(panel.querySelector('#np_price').value||0); const cat=panel.querySelector('#np_cat').value||'Painting Art';
    const item = {id:'u'+Date.now(),title,desc,price,img,flag:'',variants:extractVariants(desc), newArrival: !!panel.querySelector('#np_new').checked, oneOfOne: !!panel.querySelector('#np_one').checked, discountPercent: Number(panel.querySelector('#np_discount').value || 0)};
    const group = CATALOG.find(g=>g.category===cat); if(group) group.items.push(item); else CATALOG.push({category:cat,items:[item]}); saveCatalogToLocal(); // attempt to submit to configured Google Form (if admin set it up)
    (async ()=>{ try{ const res = await submitProductToForm(item); if(res && res.ok) showToast('Product saved and submitted to sheet'); else if(res && res.reason === 'no_form') showToast('Product saved locally (no sheet configured)'); else showToast('Product saved locally (form submit failed)'); }catch(e){ console.warn('Form submit failed',e); showToast('Product saved locally (form submit failed)'); } })(); modal.remove(); buildAdminMain(); renderCatalog();
  });
}

function openEditProductForm(catIdx,itemIdx){
  const it = CATALOG[catIdx].items[itemIdx];
  const modal = el('div','modal'); modal.style.position='fixed'; modal.style.left=0; modal.style.top=0; modal.style.width='100%'; modal.style.height='100%'; modal.style.display='flex'; modal.style.alignItems='center'; modal.style.justifyContent='center';
  const panel = el('div'); panel.className='modal-panel'; panel.style.maxWidth='760px';
  panel.innerHTML = `<h3>Edit Product</h3>`;
  const form = el('div'); form.innerHTML = `
    <input id='ep_title' placeholder='Title' value='${it.title}'>
    <textarea id='ep_desc' placeholder='Description'>${it.desc}</textarea>
    <input id='ep_img' placeholder='Image URL' value='${it.img}'>
    <input id='ep_price' placeholder='Base Price' value='${it.price}'>
    <label style='display:block;margin-top:8px'>Category</label>
    <select id='ep_cat' style='min-width:220px'>${loadCategories().map(c=>`<option ${c===CATALOG[catIdx].category?'selected':''} value="${c}">${c}</option>`).join('')}</select>
    <div style='display:flex;gap:8px;margin-top:8px'>
      <label><input type='checkbox' id='ep_new' ${it.newArrival?'checked':''}> New arrival</label>
      <label><input type='checkbox' id='ep_one' ${it.oneOfOne?'checked':''}> One of One</label>
      <input id='ep_discount' placeholder='Discount %' value='${it.discountPercent||0}'>
    </div>
    <div style='display:flex;gap:8px;margin-top:8px'><button id='ep_save' class='gold'>Save</button><button id='ep_cancel'>Cancel</button></div>
  `;
  panel.appendChild(form); modal.appendChild(panel); document.body.appendChild(modal); addModalClose(panel, modal);
  panel.querySelector('#ep_cancel').addEventListener('click',()=>modal.remove());
  panel.querySelector('#ep_save').addEventListener('click',()=>{
    it.title = panel.querySelector('#ep_title').value; it.desc = panel.querySelector('#ep_desc').value; it.img = panel.querySelector('#ep_img').value||'mini.png'; it.price = Number(panel.querySelector('#ep_price').value||0); const newCat = panel.querySelector('#ep_cat').value||CATALOG[catIdx].category;
    // move if category changed
    if(newCat !== CATALOG[catIdx].category){
      CATALOG[catIdx].items.splice(itemIdx,1);
      let group = CATALOG.find(g=>g.category===newCat);
      if(!group){ group = {category:newCat,items:[]}; CATALOG.push(group); }
      group.items.push(it);
    }
    it.variants = extractVariants(it.desc);
    it.newArrival = !!panel.querySelector('#ep_new').checked;
    it.oneOfOne = !!panel.querySelector('#ep_one').checked;
    it.discountPercent = Number(panel.querySelector('#ep_discount').value||0);
    saveCatalogToLocal(); modal.remove(); buildAdminMain(); renderCatalog();
  });
}

// helper: SHA-256 hash (hex)
function subtleHash(text){
  const enc = new TextEncoder().encode(text);
  return window.crypto.subtle.digest('SHA-256', enc).then(buf=>{
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  });
}

// --- Admin user & approval helpers ------------------------------------------------
async function loadAdminUsers(){
  try{
    // prefer local (imported) users for dev convenience
    const local = localStorage.getItem('gold_admin_users');
    if(local){ return JSON.parse(local); }
  }catch(e){}
  try{
    const resp = await fetch('/admin_users.json');
    if(resp && resp.ok) return await resp.json();
  }catch(e){}
  // fallback default minimal structure
  return { owners: ['kirollas','AhmeD5347'], users: [] };
}

// Seed admin users into localStorage on first run (hashes computed via subtleHash)
async function seedAdminUsersIfMissing(){
  try{
    if(localStorage.getItem('gold_admin_users') || localStorage.getItem('gold_admin_users_seeded')) return;
    const seed = [
      { username: 'kirollas', role: 'owner', plain: 'Kero1234$$' },
      { username: 'AhmeD5347', role: 'owner', plain: 'AhmeD1618' },
      { username: 'Sara', role: 'admin', plain: 'Sara6869' },
      { username: 'Heba', role: 'admin', plain: 'Heba0129' },
      { username: 'Amira', role: 'admin', plain: 'Amira2905' },
      { username: 'Admin01', role: 'admin', plain: '01Admin' },
      { username: 'Admin02', role: 'admin', plain: '02Admin' },
      { username: 'Admin03', role: 'admin', plain: '03Admin' }
    ];
    const users = [];
    for(const s of seed){
      try{
        const h = await subtleHash(s.plain);
        users.push({ username: s.username, role: s.role, hash: h });
      }catch(e){ console.warn('Could not hash password for', s.username, e); }
    }
    const owners = seed.filter(u=>u.role==='owner').map(u=>u.username);
    const payload = { owners: owners, users: users };
    localStorage.setItem('gold_admin_users', JSON.stringify(payload));
    localStorage.setItem('gold_admin_users_seeded','1');
    console.info('Seeded admin users into localStorage');
  }catch(e){ console.warn('seedAdminUsersIfMissing failed', e); }
}

function saveAdminUsersLocal(obj){ try{ localStorage.setItem('gold_admin_users', JSON.stringify(obj)); showToast('Admin users saved locally'); }catch(e){ console.error(e); showToast('Could not save admin users'); } }

function currentAdminSession(){ try{ return JSON.parse(sessionStorage.getItem('gold_admin_session') || 'null'); }catch(e){ return null; } }
function isOwnerSession(){ const s = currentAdminSession(); return s && s.role === 'owner'; }

// Persist applied catalog to a downloadable file (admin action)
function persistAppliedToFile(){ try{
  const data = localStorage.getItem('gold_products') || JSON.stringify(CATALOG, null, 2);
  if(!confirm('This will download the currently applied catalog as products.applied.json. To make it permanent, replace the repository file with this file. Continue?')) return;
  const blob = new Blob([data], { type: 'application/json' });
  const a = el('a'); a.href = URL.createObjectURL(blob); a.download = 'products.applied.json'; a.click();
  const backupKey = 'gold_products_backup_persist_'+Date.now(); localStorage.setItem(backupKey, data);
  showToast('Downloaded products.applied.json and saved a local backup ('+backupKey+')',6);
}catch(e){ console.error('Persist failed',e); showToast('Could not persist applied catalog',6); }}

function openBakeToRepoInstructions(){ const m = el('div','modal'); m.style.display='flex'; m.style.alignItems='center'; m.style.justifyContent='center'; const p = el('div'); p.className='modal-panel'; p.style.maxWidth='720px'; p.innerHTML = `<h3>Bake to repository (owner helper)</h3>
  <p style='color:#bbb'>This will download the currently applied catalog as <code>products.applied.json</code>. To write it into <code>products.builtin.json</code> and create a local git commit, run the included helper script in the project <code>tools/persist_applied_to_builtin.js</code>.</p>
  <p style='color:#ddd;font-size:13px'>Example commands (run in repository root):</p>
  <pre style='background:#111;color:#ddd;padding:12px;border-radius:8px'>node tools/persist_applied_to_builtin.js products.applied.json
# optionally push: node tools/persist_applied_to_builtin.js products.applied.json --push</pre>
  <div style='display:flex;gap:8px;margin-top:12px;justify-content:flex-end'><button id='bakeDl' class='admin-btn'>Download baked file</button><button id='bakeClose' class='admin-btn'>Close</button></div>`;
  m.appendChild(p); document.body.appendChild(m); addModalClose(p,m);
  p.querySelector('#bakeClose').addEventListener('click',()=>m.remove());
  p.querySelector('#bakeDl').addEventListener('click',()=>{ persistAppliedToFile(); }); }


// Edit footer social links (stores links in localStorage and applies them immediately)
function openEditSocialLinks(){ const m = el('div','modal'); m.style.display='flex'; m.style.alignItems='center'; m.style.justifyContent='center'; const p = el('div'); p.className='modal-panel'; p.style.maxWidth='520px'; const cur = JSON.parse(localStorage.getItem('gold_social_links') || '{}'); const fb = cur.facebook || document.querySelector('.site-footer .socials a[title="Facebook"]')?.href || ''; const wa = cur.whatsapp || document.querySelector('.site-footer .socials a[title="WhatsApp"]')?.href || ''; const ig = cur.instagram || document.querySelector('.site-footer .socials a[title="Instagram"]')?.href || ''; const tw = cur.twitter || document.querySelector('.site-footer .socials a[title="Twitter"]')?.href || ''; const tk = cur.tiktok || document.querySelector('.site-footer .socials a[title="TikTok"]')?.href || '';
  p.innerHTML = `<h3>Social Links</h3>
    <input id="s_fb" placeholder="Facebook URL" value="${fb}" />
    <input id="s_wa" placeholder="WhatsApp URL" value="${wa}" />
    <input id="s_ig" placeholder="Instagram URL" value="${ig}" />
    <input id="s_tw" placeholder="Twitter URL" value="${tw}" />
    <input id="s_tk" placeholder="TikTok URL" value="${tk}" />
    <div style="display:flex;gap:8px;margin-top:8px"><button id="s_save" class="gold">Save</button><button id="s_close">Close</button></div>`;
  m.appendChild(p); document.body.appendChild(m); addModalClose(p,m);
  p.querySelector('#s_close').addEventListener('click',()=>m.remove());
  p.querySelector('#s_save').addEventListener('click',()=>{
    const links = { facebook: p.querySelector('#s_fb').value.trim(), whatsapp: p.querySelector('#s_wa').value.trim(), instagram: p.querySelector('#s_ig').value.trim(), twitter: p.querySelector('#s_tw').value.trim(), tiktok: p.querySelector('#s_tk').value.trim() };
    localStorage.setItem('gold_social_links', JSON.stringify(links)); applySocialLinks(); m.remove(); showToast('Social links saved locally. To make them repo-permanent, replace footer HTML or commit a config file.',6);
  });
}

async function applySocialLinks(){ try{ let links = JSON.parse(localStorage.getItem('gold_social_links') || '{}'); // try to load a repo-level config file if present only when no local overrides exist
    try{ if(Object.keys(links).length === 0){ const resp = await fetch('/site.socials.json'); if(resp && resp.ok){ const repoLinks = await resp.json(); links = Object.assign({}, links, repoLinks); } } }catch(e){}
    const mapping = {facebook:'Facebook', whatsapp:'WhatsApp', instagram:'Instagram', twitter:'Twitter', tiktok:'TikTok', telegram:'Telegram'};
    const svgs = {
      facebook: '<svg viewBox="0 0 24 24" fill="#D4AF37"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
      whatsapp: '<svg viewBox="0 0 24 24" fill="#D4AF37"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
      telegram: '<svg viewBox="0 0 24 24" fill="#D4AF37"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
      instagram: '<svg viewBox="0 0 24 24" fill="#D4AF37"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>',
      twitter: '<svg viewBox="0 0 24 24" fill="#D4AF37"><path d="M23.954 4.569c-.885.389-1.83.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.951.555-2.005.959-3.127 1.184-.896-.959-2.173-1.559-3.591-1.559-2.717 0-4.92 2.203-4.92 4.917 0 .39.045.765.127 1.124C7.691 8.094 4.066 6.13 1.64 3.161c-.427.722-.666 1.561-.666 2.475 0 1.71.87 3.213 2.188 4.096-.807-.026-1.566-.248-2.228-.616v.061c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.604 3.417-1.68 1.319-3.809 2.105-6.102 2.105-.39 0-.779-.023-1.17-.067 2.189 1.394 4.768 2.209 7.557 2.209 9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63.961-.689 1.8-1.56 2.46-2.548l-.047-.02z"/></svg>',
      tiktok: '<svg viewBox="0 0 24 24" fill="#D4AF37"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>'
    };

    document.querySelectorAll('.site-footer .socials a').forEach(a=>{
      const title = a.getAttribute('aria-label') || a.getAttribute('title') || '';
      for(const k in mapping){ if(mapping[k] === title){ // set icon and href
          a.href = links[k] || '#'; a.target = '_blank'; a.rel = 'noopener'; a.style.opacity = '1'; a.innerHTML = svgs[k]; a.setAttribute('aria-label', mapping[k]); a.title = mapping[k];
        }
      }
    });
  }catch(e){} }

function ensurePersistentLayout(){ try{ if(!document.querySelector('.site-footer-wrap')){
    const f = document.createElement('footer'); f.className='site-footer-wrap'; f.innerHTML = `<div class='site-footer'><div class='inner'><div class='brand'><img src='logo.png' alt='Goldrart' class='footer-logo' style='height:72px'><div class='brand-line' style='color:#bbb'>Goldrart — Fine Painting Gallery</div></div><div style='display:flex;flex-direction:column;align-items:flex-end;gap:8px'><div class='socials'><a aria-label='Facebook' title='Facebook' href='#'></a><a aria-label='WhatsApp' title='WhatsApp' href='#'></a><a aria-label='Telegram' title='Telegram' href='#'></a><a aria-label='Instagram' title='Instagram' href='#'></a><a aria-label='TikTok' title='TikTok' href='#'></a></div><div style='font-size:12px;color:#888'>This Website Developed By Dr.Maru_Faltas</div></div></div></div>`; document.body.appendChild(f); applySocialLinks(); }
  }catch(e){} }
function requireAdmin(){ return !!currentAdminSession(); }

function loginAdminSession(username, role){ const token = 't_' + Math.random().toString(36).slice(2); sessionStorage.setItem('gold_admin_session', JSON.stringify({ token, username, role, loggedAt: Date.now() })); }

function addAudit(entry){ try{ const arr = JSON.parse(localStorage.getItem('gold_admin_audit')||'[]'); arr.unshift(entry); localStorage.setItem('gold_admin_audit', JSON.stringify(arr)); }catch(e){ console.error(e); } }

function addPendingAction(action){ try{ const arr = JSON.parse(localStorage.getItem('gold_admin_pending')||'[]'); action.id = 'ap_'+Date.now()+'_'+Math.random().toString(36).slice(2); action.status = 'pending'; arr.push(action); localStorage.setItem('gold_admin_pending', JSON.stringify(arr)); addAudit({type:'pending_created', actionId: action.id, actionType: action.type, user: action.createdBy, ts: Date.now()}); try{ renderAdminApprovals(); }catch(e){} return action; }catch(e){ console.error(e); return null; } }

async function applyAction(action){ try{
  if(action.type === 'bake'){
    return await doBake(true);
  } else if(action.type === 'undo_bake'){
    return await doUndoBake(true);
  } else if(action.type === 'normalize_refs'){
    return await doNormalizeRefs(true);
  } else if(action.type === 'apply_cleaned'){
    return await doApplyCleaned();
  } else if(action.type === 'import_users'){
    // payload should contain users object
    if(action.payload && typeof action.payload === 'object'){
      saveAdminUsersLocal(action.payload); return {ok:true};
    }
  }
  throw new Error('Unknown action type: ' + action.type);
 }catch(e){ console.error('applyAction failed', e); throw e; } }

async function doBake(fromAction){
  // extracted bake logic
  const ts = Date.now(); const backupKey = 'gold_products_backup_bake_' + ts; localStorage.setItem(backupKey, localStorage.getItem('gold_products') || JSON.stringify(CATALOG));
  let resp = null; const tryPaths = ['/products.builtin.json','/products.applied.merged.json','/products.applied.json','products.builtin.json','products.applied.merged.json','products.applied.json','./products.builtin.json','./products.applied.merged.json','./products.applied.json'];
  for(const p of tryPaths){ try{ resp = await fetch(p); if(resp && resp.ok) break; }catch(e){ resp = null; } }
  if(!resp || !resp.ok) throw new Error('No catalog file found (products.builtin.json or applied JSON)');
  const catalog = await resp.json(); if(!Array.isArray(catalog) || catalog.length===0) throw new Error('Fetched catalog invalid');
  localStorage.setItem('gold_products', JSON.stringify(catalog)); CATALOG = catalog; saveCatalogToLocal(); renderCatalog(); showToast('Baked catalog into site and saved backup: ' + backupKey); renderAdminProducts($('adminMain'));
  // trigger download of products.builtin.json so Owner can commit changes to repo
  try{
    const blob = new Blob([JSON.stringify(catalog, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'products.builtin.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    const m = el('div','modal'); const p = el('div'); p.className='modal-panel'; p.style.maxWidth='640px'; p.innerHTML = `<h3>Catalog baked</h3><p style='color:#bbb'>A <code>products.builtin.json</code> file has been downloaded to your computer. Replace the file in the site root (commit & push) to make the changes permanent on the live site. If you run the site locally, you can also run <code>node tools/bake_to_builtin.js path/to/products.builtin.json</code> to write directly to the repository copy.</p><div style='display:flex;justify-content:flex-end;gap:8px;margin-top:12px'><button id='bakeOk' class='gold'>Got it</button></div>`; m.appendChild(p); document.body.appendChild(m); m.querySelector('#bakeOk').addEventListener('click',()=>m.remove());
  }catch(e){ console.warn('Download failed', e); }
  // attempt to run normalization
  try{ if($('normalizeRefsBtn')){ $('normalizeRefsBtn').click(); showToast('Normalization triggered to replace encoded IDs',3); } }catch(e){}
  return {ok:true, backupKey};
}

async function doUndoBake(){
  const keys = Object.keys(localStorage).filter(k=>k.indexOf('gold_products_backup_bake_')===0).sort().reverse(); if(keys.length===0) throw new Error('No bake backups found');
  const latest = keys[0]; const raw = localStorage.getItem(latest); if(!raw) throw new Error('Backup missing: '+latest); const parsed = JSON.parse(raw); if(!Array.isArray(parsed) || parsed.length===0) throw new Error('Backup invalid: '+latest);
  const preKey = 'gold_products_backup_before_restore_'+Date.now(); localStorage.setItem(preKey, localStorage.getItem('gold_products') || JSON.stringify(CATALOG));
  localStorage.setItem('gold_products', JSON.stringify(parsed)); CATALOG = parsed; saveCatalogToLocal(); renderCatalog(); renderAdminProducts($('adminMain'));
  return {ok:true, restored: latest, preKey};
}

// apply cleaned catalog helper (used via owner apply or approval)
async function doApplyCleaned(){
  // try multiple paths for the applied catalog
  let resp = null; const tryPaths = ['/products.applied.merged.json','/products.applied.json','products.applied.merged.json','products.applied.json','./products.applied.merged.json','./products.applied.json'];
  for(const p of tryPaths){ try{ resp = await fetch(p); if(resp && resp.ok) break; }catch(e){ resp = null; } }
  if(!resp || !resp.ok) throw new Error('products.applied.json not found');
  const catalog = await resp.json();
  if(!Array.isArray(catalog) || catalog.length===0) throw new Error('Fetched catalog is empty or invalid');
  // attempt to merge titles/images from whatsapp CSV if available
  try{
    let respCsv=null; const tryPaths2 = ['/whatsapp_products.csv.csv','whatsapp_products.csv.csv','./whatsapp_products.csv.csv','/products.csv','products.csv','./products.csv'];
    for(const p of tryPaths2){ try{ respCsv = await fetch(p); if(respCsv && respCsv.ok) break; }catch(e){ respCsv = null; } }
    if(respCsv && respCsv.ok){
      const txt = await respCsv.text();
      const lines = txt.split(/\r?\n/);
      const starts = [];
      for(let i=0;i<lines.length;i++){
        if(/^"\d+/.test(lines[i].trim())) starts.push(i);
      }
      const map = {};
      for(let b=0;b<starts.length;b++){
        const s = starts[b];
        const e = (b+1<starts.length)? starts[b+1] : lines.length;
        const block = lines.slice(s,e).join('\n');
        const idm = block.match(/^"(\d+)/);
        if(!idm) continue;
        const id = idm[1];
        let title = '';
        let mm;
        const re = /""([^\"]+)""/g;
        while((mm = re.exec(block))){ const t = mm[1].trim(); if(!/Size\s*&?\s*Price/i.test(t) && t.length>1){ title = t; break; } }
        if(!title){ const re2 = /"([^\"]+)"/g; while((mm = re2.exec(block))){ const t = mm[1].trim(); if(!/Size\s*&?\s*Price/i.test(t) && t.length>1){ title = t; break; } } }
        title = title.replace(/^\*+/,'').replace(/\*+$/,'').replace(/\,$/,'').trim();
        const imgm = block.match(/https?:\/\/[^\s"']+/i);
        const img = imgm ? imgm[0] : '';
        if(title || img) map[id] = { title, img };
      }
      if(Object.keys(map).length>0){ catalog.forEach(cat=> (cat.items||[]).forEach(it=>{ if(it && it.id && map[it.id]){ it.title = map[it.id].title || it.title; it.img = map[it.id].img || it.img; } })); }
    }
  }catch(e){ console.warn('Merge titles failed', e); }
  const backupKey = 'gold_products_backup_' + Date.now();
  localStorage.setItem(backupKey, localStorage.getItem('gold_products') || JSON.stringify(CATALOG));
  localStorage.setItem('gold_products', JSON.stringify(catalog));
  CATALOG = catalog;
  saveCatalogToLocal();
  renderCatalog();
  renderAdminProducts($('adminMain'));
  return {ok:true, backupKey};
}

async function doNormalizeRefs(){
  // call existing normalize logic by triggering button (will create backup etc.)
  if(!confirm('Normalize product references across cart, wishlist, featured and catalog? This will create a backup in localStorage. Proceed?')) return {ok:false, canceled:true};
  try{
    // reuse existing code path by clicking the normalize button handler
    // The normalize button's handler will itself ask for confirm, so we call the internal normalize function if available
    if(typeof normalizeProductRefs === 'function'){
      await normalizeProductRefs(); return {ok:true};
    } else {
      $('normalizeRefsBtn').click(); return {ok:true};
    }
  }catch(e){ console.error(e); throw e; }
}

async function requestAdminAction(action){ // action: { type, payload }
  const sess = currentAdminSession(); if(!sess){ showToast('You must login as Admin to perform this action'); return; }
  action.createdBy = sess.username; action.createdAt = Date.now();
  if(sess.role === 'owner'){
    try{ const res = await applyAction(action); addAudit({type:'action_applied', actionType: action.type, actionId: action.id||null, by: sess.username, ts: Date.now(), res }); showToast('Action applied'); return { applied:true, res }; }catch(e){ addAudit({type:'action_failed', actionType: action.type, by: sess.username, ts: Date.now(), err: (e && e.message)}); showToast('Action failed: '+(e && e.message)); return { applied:false, err:e }; }
  } else {
    // non-owner => create pending request (confirm dialog)
    if(!confirm('You are not an Owner. This will create a pending request for Owner approval. Proceed?')) return { queued:false };
    const pending = addPendingAction(action); showToast('Action queued for Owner approval'); return { queued:true, id: pending && pending.id };
  }
}

function renderAdminApprovals(){ try{
  const root = $('adminMain'); if(!root) return; // if admin panel not open nothing to do
  const pending = JSON.parse(localStorage.getItem('gold_admin_pending')||'[]');
  // create approvals panel
  const m = el('div'); m.innerHTML = '<h3>Pending Admin Actions</h3>';
  if((pending||[]).length===0){ const n = el('div'); n.style.color='#bbb'; n.style.padding='8px'; n.textContent='No pending actions'; m.appendChild(n); } else {
    pending.forEach(it=>{
      const row = el('div'); row.className='list-row'; row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center'; row.style.padding='8px 0';
      row.innerHTML = `<div style='flex:1'><strong>${it.type}</strong><div style='color:#bbb;font-size:13px'>by ${it.createdBy} @ ${new Date(it.createdAt).toLocaleString()}</div><div style='color:#ddd;margin-top:6px;font-size:12px'>${JSON.stringify(it.payload||{})}</div></div>`;
      const controls = el('div');
      const view = el('button'); view.textContent='View'; view.addEventListener('click',()=>{ alert(JSON.stringify(it, null, 2)); }); controls.appendChild(view);
      if(isOwnerSession()){
        const acc = el('button','gold'); acc.textContent='Accept'; acc.addEventListener('click', async ()=>{ try{ await processPendingAction(it.id, true); showAdminPanel(); }catch(e){ showToast('Accept failed'); } }); controls.appendChild(acc);
        const rej = el('button'); rej.textContent='Reject'; rej.addEventListener('click', async ()=>{ try{ await processPendingAction(it.id, false); showAdminPanel(); }catch(e){ showToast('Reject failed'); } }); controls.appendChild(rej);
      }
      row.appendChild(controls); m.appendChild(row);
    });
  }
  root.innerHTML=''; root.appendChild(m);
}catch(e){ console.error(e); } }

async function processPendingAction(id, accept){ try{
  const arr = JSON.parse(localStorage.getItem('gold_admin_pending')||'[]'); const idx = arr.findIndex(a=>a.id===id); if(idx<0) throw new Error('Pending action not found'); const action = arr[idx]; const session = currentAdminSession(); const actedBy = session ? session.username : 'unknown'; if(accept){ try{ await applyAction(action); action.status = 'accepted'; action.resolvedBy = actedBy; action.resolvedAt = Date.now(); addAudit({type:'pending_accepted', actionId:id, by: actedBy, ts: Date.now(), actionType: action.type}); }catch(e){ action.status = 'failed'; action.error = (e && e.message); addAudit({type:'pending_failed_apply', actionId:id, by: actedBy, ts: Date.now(), err: (e && e.message)}); }
  } else {
    action.status = 'rejected'; action.resolvedBy = actedBy; action.resolvedAt = Date.now(); addAudit({type:'pending_rejected', actionId:id, by: actedBy, ts: Date.now(), actionType: action.type}); }
  arr[idx] = action; localStorage.setItem('gold_admin_pending', JSON.stringify(arr)); renderAdminApprovals(); showToast('Pending action ' + (accept ? 'accepted' : 'rejected'));
}catch(e){ console.error(e); throw e; } }

function openAdminUserImporter(){ const m = el('div','modal'); const p = el('div'); p.className='modal-panel'; p.style.maxWidth='720px'; p.innerHTML = `<h3>Import Admin Users (JSON)</h3><p>Upload a JSON file matching the schema in <code>admin_users.json</code>. This stores a local copy in <code>gold_admin_users</code> for development/testing.</p><div style='display:flex;gap:8px;align-items:center'><input id='adminUsersFile' type='file' accept='application/json'><button id='adminUsersImport' class='gold'>Import Locally</button><button id='adminUsersClose' class='admin-btn'>Close</button></div><div style='margin-top:8px;color:#bbb;font-size:13px'>Passwords must be stored as SHA-256 hex hashes in the file, or you can set them here after importing.</div>`; m.appendChild(p); document.body.appendChild(m); addModalClose(p,m);
  p.querySelector('#adminUsersImport').addEventListener('click',()=>{ const f = p.querySelector('#adminUsersFile').files[0]; if(!f){ alert('Choose a file first'); return; } const r = new FileReader(); r.onload = ()=>{ try{ const o = JSON.parse(r.result); saveAdminUsersLocal(o); addAudit({type:'admin_imported', by: currentAdminSession() && currentAdminSession().username || 'unknown', ts: Date.now()}); showToast('Admin users imported locally'); m.remove(); }catch(e){ alert('Invalid JSON'); } }; r.readAsText(f); });
}

function openManageCategories(){ const m = el('div','modal'); const p = el('div'); p.className='modal-panel'; p.style.maxWidth='640px'; p.innerHTML = `<h3>Manage Categories</h3><div id='catList' style='max-height:48vh;overflow:auto'></div><div style='display:flex;gap:8px;margin-top:10px;align-items:center'><input id='newCat' placeholder='New category'><button id='addCat' class='gold'>Add</button><button id='saveCats' class='gold'>Save</button><button id='closeCats' class='admin-btn'>Close</button></div><div style='margin-top:8px;color:#bbb;font-size:13px'>Categories determine sections where products are grouped. Use this to add the categories: Painting Art, Canvas print, Antiques, Plants, Tables, One of One.</div>`; m.appendChild(p); document.body.appendChild(m); addModalClose(p,m);
  const list = p.querySelector('#catList'); function refresh(){ const cats = loadCategories(); list.innerHTML=''; cats.forEach((c,idx)=>{ const row = el('div'); row.style.display='flex'; row.style.alignItems='center'; row.style.justifyContent='space-between'; row.style.padding='6px 0'; row.innerHTML = `<div style='flex:1'><input style='width:100%;padding:6px;border-radius:6px;border:0;background:#222;color:#ddd' class='cat-edit' value='${c}'></div><div style='display:flex;gap:6px'><button class='up' ${idx===0? 'disabled':''}>↑</button><button class='down' ${idx===cats.length-1? 'disabled':''}>↓</button><button class='rem'>Remove</button></div>`; list.appendChild(row);
    row.querySelector('.rem').addEventListener('click',()=>{ cats.splice(idx,1); saveCategories(cats); refresh(); renderCatalog(); });
    row.querySelector('.up').addEventListener('click',()=>{ if(idx>0){ const a=cats[idx-1]; cats[idx-1]=cats[idx]; cats[idx]=a; saveCategories(cats); refresh(); renderCatalog(); } });
    row.querySelector('.down').addEventListener('click',()=>{ if(idx<cats.length-1){ const a=cats[idx+1]; cats[idx+1]=cats[idx]; cats[idx]=a; saveCategories(cats); refresh(); renderCatalog(); } });
    row.querySelector('.cat-edit').addEventListener('change',(ev)=>{ cats[idx]=ev.target.value; saveCategories(cats); renderCatalog(); refresh(); });
  }); }
  p.querySelector('#addCat').addEventListener('click',()=>{ const v = p.querySelector('#newCat').value.trim(); if(!v) return; const cur = loadCategories(); if(cur.includes(v)) return showToast('Category exists'); cur.push(v); saveCategories(cur); p.querySelector('#newCat').value=''; refresh(); renderCatalog(); });
  p.querySelector('#saveCats').addEventListener('click',()=>{ showToast('Categories saved'); m.remove(); });
  p.querySelector('#closeCats').addEventListener('click',()=>m.remove());
  refresh(); }


function openAdminAuditViewer(){ const m = el('div','modal'); const p = el('div'); p.className='modal-panel'; p.style.maxWidth='720px'; p.innerHTML = `<h3>Admin Audit Log</h3><div id='auditList' style='max-height:60vh;overflow:auto'></div><div style='display:flex;justify-content:flex-end;margin-top:8px'><button id='auditClose' class='admin-btn'>Close</button></div>`; m.appendChild(p); document.body.appendChild(m); addModalClose(p,m);
  const list = p.querySelector('#auditList'); const entries = JSON.parse(localStorage.getItem('gold_admin_audit')||'[]'); if(entries.length===0){ list.innerHTML = '<div style="color:#bbb;padding:8px">No audit entries yet</div>'; } else { entries.forEach(e=>{ const row = el('div'); row.style.padding='8px'; row.style.borderBottom='1px solid rgba(255,255,255,0.02)'; row.innerHTML = `<div style='font-size:13px;color:#ddd'><strong>${e.type}</strong> &nbsp; <span style='color:#aaa;font-size:12px'>${e.by||e.user||''} @ ${new Date(e.ts||Date.now()).toLocaleString()}</span></div><div style='color:#bbb;margin-top:6px;font-size:12px'>${JSON.stringify(e, null, 2)}</div>`; list.appendChild(row); }); }
}


// Back to Top Button Functionality
document.addEventListener('DOMContentLoaded', ()=>{
  // Set social media links for all pages
  try{
    const socialLinks = {
      facebook: 'https://www.facebook.com/share/1BkKnZEg1u/',
      whatsapp: 'https://wa.me/201004135874',
      telegram: 'https://t.me/GoldrArt',
      instagram: 'https://www.instagram.com/goldrart_gallery?igsh=MWhycm9sZ203MmxuMQ==',
      tiktok: 'https://www.tiktok.com/@goldrart?_r=1&_t=ZS-92yuBAXlaIC'
    };
    localStorage.setItem('gold_social_links', JSON.stringify(socialLinks));
    // Apply links if footer exists on page
    if(document.querySelector('.site-footer .socials')) applySocialLinks();
  }catch(e){ console.warn('Failed to set social links', e); }
  
  const backBtn = document.getElementById('backToTop');
  if(!backBtn) return; // button not on page
  
  // Show/hide button based on scroll position
  window.addEventListener('scroll', ()=>{
    if(window.scrollY > 300){
      backBtn.classList.add('show');
    } else {
      backBtn.classList.remove('show');
    }
  });
  
  // Smooth scroll to top on click
  backBtn.addEventListener('click', ()=>{
    window.scrollTo({top: 0, behavior: 'smooth'});
  });
});

