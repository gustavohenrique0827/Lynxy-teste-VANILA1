 
(function(){
  const STORAGE_KEY = 'lynxy_carts_v1';
  const PER_PAGE = 5;
  let page = 1;
  let rows = [];
  const tbody = document.getElementById('table-body');
  const template = document.getElementById('row-template');
  const metricCount = document.getElementById('metric-count');
  const metricValue = document.getElementById('metric-value');
  const metricRate = document.getElementById('metric-rate');
  const metricExp = document.getElementById('metric-expected');
  const toastEl = document.getElementById('toast');

  // sample seed
  const sampleSeed = [
    {id:'C-001', name:'Ana Silva', phone:'(11) 98765-4321', email:'ana.silva@email.com', address:'Rua das Flores, 123, São Paulo, SP', createdAt:'2023-10-15T14:30:00Z', clientImage:'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face', items:[{title:'Camisa Polo',price:199.99,image:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=60&h=60&fit=crop'},{title:'Tênis Run',price:199.98,image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=60&h=60&fit=crop'}], value:399.97, origin:'WEBSITE', status:'novo', time:'22min'},
    {id:'C-002', name:'Carlos Santos', phone:'(21) 91234-5678', email:'carlos.santos@email.com', address:'Av. Atlântica, 456, Rio de Janeiro, RJ', createdAt:'2023-10-14T10:15:00Z', clientImage:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face', items:[{title:'Smartphone X',price:899.99,image:'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=60&h=60&fit=crop'}], value:899.99, origin:'ORGÂNICO', status:'em-curso', time:'2h'},
    {id:'C-003', name:'Maria Oliveira', phone:'(31) 99876-1122', email:'maria.oliveira@email.com', address:'Rua da Bahia, 789, Belo Horizonte, MG', createdAt:'2023-10-13T16:45:00Z', clientImage:'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face', items:[{title:'Mouse Pro',price:129.99,image:'https://images.unsplash.com/photo-1527814050087-3793815479db?w=60&h=60&fit=crop'},{title:'Teclado Mec',price:2449.99,image:'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=60&h=60&fit=crop'}], value:2579.98, origin:'META ADS', status:'recuperado', time:'1h 15m'},
    {id:'C-004', name:'João Pedro', phone:'(41) 99111-2233', email:'joao.pedro@email.com', address:'Rua XV de Novembro, 101, Curitiba, PR', createdAt:'2023-10-12T12:20:00Z', clientImage:'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face', items:[{title:'Smartwatch',price:1199.00,image:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=60&h=60&fit=crop'}], value:1199.00, origin:'SOCIALMEDIA', status:'em-curso', time:'32min'},
    {id:'C-005', name:'Luiza Costa', phone:'(85) 98888-3333', email:'luiza.costa@email.com', address:'Av. Borges de Medeiros, 202, Porto Alegre, RS', createdAt:'2023-10-11T09:30:00Z', clientImage:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=64&h=64&fit=crop&crop=face', items:[{title:'Notebook',price:3499.50,image:'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=60&h=60&fit=crop'},{title:'Capa',price:400.00,image:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=60&h=60&fit=crop'}], value:3899.50, origin:'WEBSITE', status:'novo', time:'12min'},
    {id:'C-006', name:'Bruno Lima', phone:'(11) 97777-1111', email:'bruno.lima@email.com', address:'SQN 308 Bloco A, Brasília, DF', createdAt:'2023-10-10T15:10:00Z', clientImage:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop&crop=face', items:[{title:'Fone',price:199.90,image:'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=60&h=60&fit=crop'}], value:199.90, origin:'ORGÂNICO', status:'novo', time:'3h'},
  ];

  // persistence (ensures sample if empty)
  function loadData(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) { localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleSeed)); return sampleSeed.slice(); }
      const parsed = JSON.parse(raw);
      if(!Array.isArray(parsed) || parsed.length === 0){
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleSeed));
        return sampleSeed.slice();
      }
      return parsed;
    }catch(e){
      console.error(e);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleSeed));
      return sampleSeed.slice();
    }
  }
  function saveData(data){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // metrics
  function updateMetrics(){
    const total = rows.length;
    const value = rows.reduce((s,r)=>s+(Number(r.value)||0),0);
    const recovered = rows.filter(r=>r.status==='recuperado').length;
    metricCount.textContent = total;
    metricValue.textContent = formatCurrency(value);
    metricRate.textContent = `${Math.round((recovered/(total||1))*100)}%`;
    metricExp.textContent = formatCurrency(value * 0.7);
  }

  // render table with pagination safety
  function renderTable(){
    tbody.innerHTML = '';
    const maxPage = Math.max(1, Math.ceil(rows.length / PER_PAGE));
    if(page > maxPage) page = maxPage;
    const start = (page-1)*PER_PAGE;
    const slice = rows.slice(start, start+PER_PAGE);
    if(slice.length === 0){
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="7" style="padding:18px;color:#6b7280">Nenhum carrinho encontrado</td>';
      tbody.appendChild(tr);
      updateFooterInfo();
      return;
    }
    slice.forEach((r) => {
      const clone = template.content.cloneNode(true);
      clone.querySelector('.table-row').dataset.id = r.id;
      clone.querySelector('.client-name').textContent = r.name;
      clone.querySelector('.client-sub').textContent = `${r.phone} • ${r.id}`;
      const avatarSm = clone.querySelector('.avatar-sm');
      avatarSm.style.backgroundImage = `url(${r.clientImage || 'https://via.placeholder.com/40x40/E84393/FFFFFF?text=?'})`;
      avatarSm.style.backgroundSize = 'cover';
      avatarSm.style.backgroundPosition = 'center';
      avatarSm.textContent = '';
      const itemsWrap = clone.querySelector('.items-list');
      itemsWrap.innerHTML = '';
      r.items.slice(0,3).forEach(it => {
        const d = document.createElement('div'); d.className='thumb';
        d.style.backgroundImage = `url(${it.image || 'https://via.placeholder.com/48x32/E84393/FFFFFF?text=?'})`;
        d.style.backgroundSize = 'cover';
        d.style.backgroundPosition = 'center';
        d.textContent = '';
        itemsWrap.appendChild(d);
      });
      if(r.items.length>3){
        const more = document.createElement('div'); more.className='thumb'; more.textContent = '+' + (r.items.length-3);
        itemsWrap.appendChild(more);
      }
      clone.querySelector('.col-value').textContent = formatCurrency(r.value);
      clone.querySelector('.col-origin').textContent = r.origin;
      const badge = clone.querySelector('.col-status .badge');
      badge.textContent = badgeText(r.status);
      badge.className = 'badge ' + (r.status==='novo' ? 'new' : r.status==='recuperado' ? 'sent' : 'pending');
      clone.querySelector('.col-date').textContent = r.time;
      tbody.appendChild(clone);
    });
    updateFooterInfo();
  }

  function updateFooterInfo(){
    document.getElementById('rows-info').textContent = `${rows.length} itens`;
    document.getElementById('page-num').textContent = page;
  }

  // helpers
  function initials(name){ return String(name||'').split(' ').map(s=>s[0]||'').slice(0,2).join('').toUpperCase(); }
  function itShort(it){ return it.length>12? it.slice(0,12)+'…' : it; }
  function badgeText(s){ if(s==='novo') return 'Novo'; if(s==='recuperado') return 'Recuperado'; return 'Em recuperação'; }
  function formatCurrency(n){ return Number(n).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }

  // toast
  let toastTimer = null;
  function showToast(msg, time=3000){
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=>{ toastEl.classList.remove('show'); }, time);
  }

  // debounce
  function debounce(fn, wait=250){ let t; return (...a)=>{ clearTimeout(t); t = setTimeout(()=>fn.apply(this,a), wait); }; }

  // filter logic (dialog)
  const filterModal = document.getElementById('filter-modal');
  const filterBackdrop = document.getElementById('filter-backdrop');
  const filterBtn = document.getElementById('filter-btn');
  const filterClose = document.getElementById('filter-close');
  const filterForm = document.getElementById('filter-form');
  const filterReset = document.getElementById('filter-reset');
  const filterProduct = document.getElementById('f-product');
  const filterOrigin = document.getElementById('f-origin');
  const filterDateStart = document.getElementById('f-date-start');
  const filterDateEnd = document.getElementById('f-date-end');

  function openFilterModal(){
    filterModal.classList.add('show');
    filterModal.setAttribute('aria-hidden','false');
    filterProduct.focus();
    document.addEventListener('keydown', onKeyDownFilter);
  }
  function closeFilterModal(){
    filterModal.classList.remove('show');
    filterModal.removeAttribute('aria-hidden');
    document.removeEventListener('keydown', onKeyDownFilter);
  }
  function onKeyDownFilter(e){
    if(e.key === 'Escape') closeFilterModal();
  }
  filterBtn.addEventListener('click', openFilterModal);
  filterBackdrop.addEventListener('click', closeFilterModal);
  filterClose.addEventListener('click', closeFilterModal);

  filterReset.addEventListener('click', (e)=>{
    e.preventDefault();
    filterForm.reset();
    // Reset tags
    document.querySelectorAll('#filter-modal .tag').forEach(tag => tag.classList.remove('active'));
  });

  // Tag click handlers
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('tag')) {
      e.target.classList.toggle('active');
    }
  });



  filterForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const product = filterProduct.value.toLowerCase();
    const origin = filterOrigin.value.toLowerCase();
    const dateStart = filterDateStart.value;
    const dateEnd = filterDateEnd.value;

    // Get active tags
    const activePaymentTags = Array.from(document.querySelectorAll('#filter-modal .tags[data-field="payment"] .tag.active')).map(tag => tag.dataset.value);
    const activeStatusTags = Array.from(document.querySelectorAll('#filter-modal .tags[data-field="status"] .tag.active')).map(tag => tag.dataset.value);
    const activeProductTags = Array.from(document.querySelectorAll('#filter-modal .tags[data-field="product"] .tag.active')).map(tag => tag.dataset.value);

    const all = loadData();
    rows = all.filter(r => {
      if(product && !r.items.some(i => i.title.toLowerCase().includes(product))) return false;
      if(origin && !r.origin.toLowerCase().includes(origin)) return false;
      if(dateStart && r.createdAt < dateStart) return false;
      if(dateEnd && r.createdAt > dateEnd) return false;
      if(activePaymentTags.length > 0 && !activePaymentTags.includes(r.paymentMethod)) return false;
      if(activeStatusTags.length > 0 && !activeStatusTags.includes(r.status)) return false;
      if(activeProductTags.length > 0 && !activeProductTags.some(tag => r.items.some(i => i.title.toLowerCase().includes(tag)))) return false;
      return true;
    });
    page = 1;
    renderTable();
    updateMetrics();
    showToast(`${rows.length} carrinhos encontrados`);
    closeFilterModal();
  });



  // pagination
  document.getElementById('prev-page').addEventListener('click', ()=>{
    if(page>1) page--, renderTable();
  });
  document.getElementById('next-page').addEventListener('click', ()=>{
    const max = Math.ceil(rows.length / PER_PAGE) || 1;
    if(page<max) page++, renderTable();
  });

  // table actions via delegation
  tbody.addEventListener('click', (e)=>{
    const tr = e.target.closest('tr.table-row');
    if(!tr) return;
    const id = tr.dataset.id;
    if(e.target.closest('.action-btn.send')){
      simulateSend(id);
    } else if(e.target.closest('.action-btn.view')){
      openModal(id);
    } else if(e.target.closest('.action-btn.delete')){
      if(!confirm('Remover este carrinho?')) return;
      const all = loadData().filter(x=>x.id!==id);
      saveData(all);
      rows = all.slice();
      const max = Math.max(1, Math.ceil(rows.length / PER_PAGE));
      if(page > max) page = max;
      renderTable();
      updateMetrics();
      showToast('Carrinho removido');
    }
  });

  // simulate send single
  function simulateSend(id){
    const all = loadData();
    const item = all.find(x=>x.id===id);
    if(!item) return;
    item.status = 'recuperado';
    saveData(all);
    rows = all.slice();
    renderTable();
    updateMetrics();
    showToast('E-mail de recuperação enviado com sucesso!');
  }

  // modal for view (updated)
  const modal = document.getElementById('modal');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalClose = document.getElementById('modal-close');
  const modalClose2 = document.getElementById('modal-close-2');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalSend = document.getElementById('modal-send');
  const modalCall = document.getElementById('modal-call');
  const modalWhatsapp = document.getElementById('modal-whatsapp');

  // mapping for item titles to SVG icons
  const itemIconMap = {
    'Camisa': 'camisa.svg',
    'Tênis': 'tenis.svg',
    'Smartphone': 'phone.svg',
    'Mouse': 'mouse.svg',
    'Teclado': 'keyboard.svg',
    'Smartwatch': 'watch.svg',
    'Fone': 'fone.svg',
    'Notebook': 'laptop.svg',
    'Capa': 'case.svg'
  };

  function getItemIcon(title) {
    for (const [key, icon] of Object.entries(itemIconMap)) {
      if (title.toLowerCase().includes(key.toLowerCase())) return icon;
    }
    return 'case.svg'; // default
  }

  function openModal(id){
    const all = loadData();
    const r = all.find(x=>x.id===id);
    if(!r) return;

    const avatarLarge = modalBody.querySelector('.avatar-large');
    const clientName = modalBody.querySelector('.client-details h3');
    const clientPhone = modalBody.querySelector('.client-details p');
    const clientEmail = modalBody.querySelector('.client-email');
    const clientAddress = modalBody.querySelector('.client-address');
    const totalValue = modalBody.querySelector('.summary-item .value');
    const statusBadge = modalBody.querySelector('.summary-item .badge');
    const originText = modalBody.querySelector('.summary-item .origin');
    const creationDate = modalBody.querySelector('.creation-date');
    const abandonedTime = modalBody.querySelector('.abandoned-time');
    const totalItems = modalBody.querySelector('.total-items');
    const itemsGrid = document.getElementById('cart-items-grid');

    avatarLarge.style.backgroundImage = `url(${r.clientImage || 'https://via.placeholder.com/64x64/E84393/FFFFFF?text=?'})`;
    avatarLarge.style.backgroundSize = 'cover';
    avatarLarge.style.backgroundPosition = 'center';
    avatarLarge.textContent = '';
    clientName.textContent = escapeHtml(r.name);
    clientPhone.textContent = escapeHtml(r.id);
    clientEmail.textContent = escapeHtml(r.email || 'email@cliente.com');
    clientAddress.textContent = escapeHtml(r.address || 'Endereço não informado');
    totalValue.textContent = formatCurrency(r.value);
    statusBadge.textContent = badgeText(r.status);
    statusBadge.className = 'badge ' + (r.status==='novo' ? 'new' : r.status==='recuperado' ? 'sent' : 'pending');
    originText.textContent = r.origin;
    creationDate.textContent = new Date(r.createdAt).toLocaleDateString('pt-BR');
    abandonedTime.textContent = r.time;
    totalItems.textContent = r.items.length;

    itemsGrid.innerHTML = '';
    r.items.forEach(item => {
      const itemCard = document.createElement('div');
      itemCard.className = 'item-card';
      itemCard.innerHTML = `
        <div class="item-image" style="background-image: url(${item.image || 'https://via.placeholder.com/60x60/E84393/FFFFFF?text=?'}); background-size: cover; background-position: center;"></div>
        <div class="item-info">
          <div class="item-name">${escapeHtml(item.title)}</div>
          <div class="item-price">${formatCurrency(item.price)}</div>
        </div>
      `;
      itemsGrid.appendChild(itemCard);
    });

    modal.dataset.id = id;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
    modalSend.focus();
    document.addEventListener('keydown', onKeyDownModal);
  }
  function closeModal(){ modal.classList.remove('show'); modal.removeAttribute('aria-hidden'); document.removeEventListener('keydown', onKeyDownModal); }
  function onKeyDownModal(e){ if(e.key === 'Escape') closeModal(); }
  modalBackdrop.addEventListener('click', closeModal);
  modalClose.addEventListener('click', closeModal);
  modalClose2.addEventListener('click', closeModal);
  modalSend.addEventListener('click', ()=>{
    const id = modal.dataset.id;
    simulateSend(id);
    closeModal();
  });
  modalCall.addEventListener('click', ()=>{
    const id = modal.dataset.id;
    const all = loadData();
    const r = all.find(x=>x.id===id);
    if(r) {
      window.open(`tel:${r.phone}`, '_blank');
      showToast('Abrindo discador...');
    }
  });
  modalWhatsapp.addEventListener('click', ()=>{
    const id = modal.dataset.id;
    const all = loadData();
    const r = all.find(x=>x.id===id);
    if(r) {
      const message = encodeURIComponent(`Olá ${r.name}, vimos que você abandonou seu carrinho na nossa loja. Podemos ajudar com alguma dúvida?`);
      window.open(`https://wa.me/55${r.phone.replace(/\D/g,'')}?text=${message}`, '_blank');
      showToast('Abrindo WhatsApp...');
    }
  });

  // search handlers
  const globalSearch = document.getElementById('global-search');
  const miniSearch = document.getElementById('mini-search');
  const doFilter = debounce(q => {
    // reuse filterRows search
    if(!q){ rows = loadData().slice(); page = 1; renderTable(); updateMetrics(); return; }
    const all = loadData();
    rows = all.filter(r => (r.name + ' ' + r.phone + ' ' + r.id + ' ' + r.items.map(i=>i.title).join(' ')).toLowerCase().includes(q.toLowerCase()));
    page = 1;
    renderTable();
    updateMetrics();
  }, 250);
  globalSearch.addEventListener('input', e => doFilter(e.target.value));
  miniSearch.addEventListener('input', e => doFilter(e.target.value));

  // util
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // init
  function init(){
    rows = loadData().slice();
    updateMetrics();
    renderTable();
  }
  init();

})();