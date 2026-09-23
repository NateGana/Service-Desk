/* ============================================================
   ServiceDesk — Application Logic
   Vanilla JS, LocalStorage persistence, no external frameworks
   ============================================================ */

(function () {
  'use strict';

  /* ---------------- Storage keys & state ---------------- */
  const K_CUSTOMERS = 'servicedesk_customers';
  const K_TECHNICIANS = 'servicedesk_technicians';
  const K_REQUESTS = 'servicedesk_requests';
  const K_SEEDED = 'servicedesk_seeded';

  let state = {
    customers: [],
    technicians: [],
    requests: [],
    currentView: 'dashboard',
    deleteTarget: null // { type, id }
  };

  const STATUS_FLOW = ['Received', 'Diagnosing', 'In Repair', 'Waiting for Parts', 'Ready for Pickup', 'Completed'];
  const TIMELINE_STEPS = ['Received', 'Diagnosing', 'In Repair', 'Ready for Pickup', 'Completed'];

  /* ---------------- Utilities ---------------- */
  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function currency(n) {
    return '₱' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }
  function badgeClass(status) {
    return 'badge-' + String(status).toLowerCase().replace(/\s+/g, '');
  }
  function initials(name) {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  /* ---------------- Persistence ---------------- */
  function saveCustomers() { localStorage.setItem(K_CUSTOMERS, JSON.stringify(state.customers)); }
  function saveTechnicians() { localStorage.setItem(K_TECHNICIANS, JSON.stringify(state.technicians)); }
  function saveRequests() { localStorage.setItem(K_REQUESTS, JSON.stringify(state.requests)); }
  function loadData() {
    state.customers = JSON.parse(localStorage.getItem(K_CUSTOMERS) || '[]');
    state.technicians = JSON.parse(localStorage.getItem(K_TECHNICIANS) || '[]');
    state.requests = JSON.parse(localStorage.getItem(K_REQUESTS) || '[]');
  }

  /* ---------------- Seed data ---------------- */
  function seedIfEmpty() {
    if (localStorage.getItem(K_SEEDED)) return;

    const today = new Date();
    const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

    const customers = [
      { id: uid('CUS'), name: 'Ramon Villafuerte', phone: '0917-402-8834', email: 'ramon.villafuerte@mail.com', address: '18 Acacia St, Quezon City', regDate: addDays(-210) },
      { id: uid('CUS'), name: 'Ma. Teresa Ongsiako', phone: '0928-661-3392', email: 'teresa.ongsiako@mail.com', address: '45 Magnolia Ave, Makati City', regDate: addDays(-180) },
      { id: uid('CUS'), name: 'Carlo Espino', phone: '0915-773-9021', email: 'carlo.espino@mail.com', address: '9 Ilang-Ilang St, Pasig City', regDate: addDays(-150) },
      { id: uid('CUS'), name: 'Jasmine Dy', phone: '0933-208-4471', email: 'jasmine.dy@mail.com', address: '112 Kalayaan Blvd, Taguig City', regDate: addDays(-120) },
      { id: uid('CUS'), name: 'Patrick Abenoja', phone: '0918-556-2290', email: 'patrick.abenoja@mail.com', address: '27 Narra St, Mandaluyong City', regDate: addDays(-95) },
      { id: uid('CUS'), name: 'Grace Kimuell', phone: '0921-390-7768', email: 'grace.kimuell@mail.com', address: '63 Sampaguita Rd, San Juan City', regDate: addDays(-70) },
      { id: uid('CUS'), name: 'Oliver Tantoco', phone: '0930-884-1156', email: 'oliver.tantoco@mail.com', address: '8 Yakal St, Mandaluyong City', regDate: addDays(-55) },
      { id: uid('CUS'), name: 'Michelle Bartolome', phone: '0919-662-3387', email: 'michelle.bartolome@mail.com', address: '150 Molave St, Quezon City', regDate: addDays(-40) },
      { id: uid('CUS'), name: 'Enzo Gatchalian', phone: '0917-225-6690', email: 'enzo.gatchalian@mail.com', address: '5 Banaba St, Pasay City', regDate: addDays(-25) },
      { id: uid('CUS'), name: 'Ysabel Formoso', phone: '0932-441-7723', email: 'ysabel.formoso@mail.com', address: '77 Camia St, Manila', regDate: addDays(-12) }
    ];

    const technicians = [
      { id: uid('TEC'), name: 'Ferdinand Lacson', specialization: 'Laptop & Desktop Hardware', phone: '0917-660-2231', email: 'ferdinand.lacson@servicedesk.com', status: 'Available' },
      { id: uid('TEC'), name: 'Rhea Concepcion', specialization: 'Smartphone & Tablet Repair', phone: '0928-773-4415', email: 'rhea.concepcion@servicedesk.com', status: 'Busy' },
      { id: uid('TEC'), name: 'Boyet Marasigan', specialization: 'Printer & Peripheral Repair', phone: '0915-220-8867', email: 'boyet.marasigan@servicedesk.com', status: 'Available' },
      { id: uid('TEC'), name: 'Angeline Custodio', specialization: 'Appliance & Electronics Repair', phone: '0933-556-1129', email: 'angeline.custodio@servicedesk.com', status: 'On Leave' }
    ];

    const devices = [
      ['Laptop', 'Lenovo ThinkPad T14'], ['Laptop', 'Dell XPS 13'], ['Desktop', 'Custom Ryzen 5600 Build'],
      ['Smartphone', 'Samsung Galaxy S22'], ['Smartphone', 'iPhone 12'], ['Tablet', 'iPad 9th Gen'],
      ['Printer', 'Epson L3210'], ['Home Appliance', 'LG Front-Load Washer'], ['Laptop', 'ASUS ROG Strix G15'],
      ['Smartphone', 'Xiaomi Redmi Note 11'], ['Desktop', 'HP Pavilion Desktop'], ['Home Appliance', 'Samsung Microwave Oven']
    ];

    const problems = [
      'Device won\u2019t power on, no response to charging.',
      'Screen flickering intermittently and showing color distortion.',
      'Overheats and shuts down after 20 minutes of use.',
      'Battery drains very quickly, dead within an hour.',
      'Unusual grinding noise coming from the internal fan.',
      'Cracked screen after being dropped, touch response is patchy.',
      'Not connecting to Wi-Fi despite being in range of the router.',
      'Frequent blue screen errors during normal use.',
      'Print output has streaks and faded sections.',
      'Water damage after exposure to rain, currently not turning on.',
      'Keyboard keys are unresponsive on the left-hand side.',
      'Making a loud buzzing sound during the spin cycle.'
    ];

    const priorities = ['Low', 'Medium', 'High', 'Urgent'];
    const requests = [];

    // Historical (completed) requests
    for (let i = 0; i < 7; i++) {
      const cust = customers[i % customers.length];
      const dev = devices[i % devices.length];
      const tech = technicians[i % (technicians.length - 1)]; // skip the on-leave tech mostly
      const received = addDays(-60 + i * 5);
      const estCost = 800 + (i % 5) * 350;
      const finalCost = estCost + (i % 3) * 150;
      const isPaid = i % 4 !== 0;
      requests.push({
        id: uid('SR'),
        customerId: cust.id,
        deviceType: dev[0],
        deviceName: dev[1],
        problem: problems[i % problems.length],
        dateReceived: received,
        estCompletion: addDays(-60 + i * 5 + 4),
        technicianId: tech.id,
        priority: priorities[i % priorities.length],
        status: 'Completed',
        estCost, finalCost,
        paymentStatus: isPaid ? 'Paid' : 'Pending',
        paymentMethod: isPaid ? ['Cash', 'Card', 'GCash', 'Bank Transfer'][i % 4] : '',
        paymentDate: isPaid ? addDays(-60 + i * 5 + 5) : ''
      });
    }

    // Active / in-progress requests
    const activeStatuses = ['Received', 'Diagnosing', 'In Repair', 'In Repair', 'Waiting for Parts', 'Ready for Pickup'];
    for (let i = 0; i < 6; i++) {
      const cust = customers[(i + 4) % customers.length];
      const dev = devices[(i + 5) % devices.length];
      const tech = technicians[i % technicians.length];
      const received = addDays(-6 + i);
      requests.push({
        id: uid('SR'),
        customerId: cust.id,
        deviceType: dev[0],
        deviceName: dev[1],
        problem: problems[(i + 6) % problems.length],
        dateReceived: received,
        estCompletion: addDays(3 + i),
        technicianId: tech.status === 'On Leave' ? technicians[0].id : tech.id,
        priority: priorities[(i + 1) % priorities.length],
        status: activeStatuses[i % activeStatuses.length],
        estCost: 900 + (i % 4) * 400,
        finalCost: '',
        paymentStatus: 'Not Required',
        paymentMethod: '',
        paymentDate: ''
      });
    }

    // One cancelled request for realism
    requests.push({
      id: uid('SR'), customerId: customers[2].id, deviceType: 'Smartphone', deviceName: 'OPPO Reno 7',
      problem: 'Customer requested cancellation after finding the issue was a loose charging cable, not a device fault.',
      dateReceived: addDays(-4), estCompletion: '', technicianId: technicians[1].id, priority: 'Low',
      status: 'Cancelled', estCost: 500, finalCost: '', paymentStatus: 'Not Required', paymentMethod: '', paymentDate: ''
    });

    state.customers = customers;
    state.technicians = technicians;
    state.requests = requests;
    saveCustomers();
    saveTechnicians();
    saveRequests();
    localStorage.setItem(K_SEEDED, '1');
  }

  /* ---------------- Derived helpers ---------------- */
  function getCustomer(id) { return state.customers.find(c => c.id === id); }
  function getTechnician(id) { return state.technicians.find(t => t.id === id); }
  function requestsForCustomer(id) { return state.requests.filter(r => r.customerId === id); }
  function activeRequestsForTech(id) {
    return state.requests.filter(r => r.technicianId === id && !['Completed', 'Cancelled'].includes(r.status));
  }
  function completedRequestsForTech(id) {
    return state.requests.filter(r => r.technicianId === id && r.status === 'Completed');
  }

  /* ============================================================
     NAVIGATION
     ============================================================ */
  const viewTitles = {
    dashboard: ['Dashboard', 'Shop-wide overview of requests and revenue'],
    requests: ['Service Requests', 'Track and manage every repair job'],
    customers: ['Customers', 'Manage your customer records'],
    technicians: ['Technicians', 'Monitor technician workload and status'],
    payments: ['Payments', 'Revenue and payment status for completed services']
  };

  function switchView(view) {
    state.currentView = view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('is-active'));
    document.getElementById('view-' + view).classList.add('is-active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('is-active', n.dataset.view === view));
    document.getElementById('viewTitle').textContent = viewTitles[view][0];
    document.getElementById('viewSubtitle').textContent = viewTitles[view][1];
    document.getElementById('sidebar').classList.remove('is-open');
    renderCurrentView();
  }

  function renderCurrentView() {
    if (state.currentView === 'dashboard') renderDashboard();
    else if (state.currentView === 'requests') renderRequests();
    else if (state.currentView === 'customers') renderCustomers();
    else if (state.currentView === 'technicians') renderTechnicians();
    else if (state.currentView === 'payments') renderPayments();
  }

  /* ============================================================
     DASHBOARD
     ============================================================ */
  function renderDashboard() {
    const total = state.requests.length;
    const pending = state.requests.filter(r => r.status === 'Received').length;
    const active = state.requests.filter(r => !['Completed', 'Cancelled', 'Received'].includes(r.status)).length;
    const completed = state.requests.filter(r => r.status === 'Completed').length;
    const totalCustomers = state.customers.length;
    const revenue = state.requests
      .filter(r => r.status === 'Completed' && r.paymentStatus === 'Paid')
      .reduce((s, r) => s + (parseFloat(r.finalCost) || 0), 0);

    const stats = [
      { label: 'Total Service Requests', value: total, accent: 'orange' },
      { label: 'Pending Requests', value: pending, accent: 'amber' },
      { label: 'Active Repairs', value: active, accent: 'blue' },
      { label: 'Completed Repairs', value: completed, accent: 'green' },
      { label: 'Total Customers', value: totalCustomers, accent: 'blue' },
      { label: 'Total Revenue', value: currency(revenue), accent: 'green' }
    ];
    document.getElementById('statGrid').innerHTML = stats.map(s => `
      <div class="stat-card accent-${s.accent}">
        <p class="stat-label">${s.label}</p>
        <p class="stat-value">${s.value}</p>
      </div>`).join('');

    // Recent requests
    const recent = [...state.requests].sort((a, b) => b.dateReceived.localeCompare(a.dateReceived)).slice(0, 5);
    document.getElementById('recentRequestsList').innerHTML = recent.length ? recent.map(r => {
      const cust = getCustomer(r.customerId);
      return `
        <div class="mini-item">
          <div class="mini-icon">${deviceIconSvg()}</div>
          <div class="mini-info">
            <strong>${escapeHtml(r.deviceName)}</strong>
            <span>${cust ? escapeHtml(cust.name) : 'Unknown customer'} · ${formatDate(r.dateReceived)}</span>
          </div>
          <span class="badge ${badgeClass(r.status)}">${r.status}</span>
        </div>`;
    }).join('') : '<p class="empty-inline">No service requests yet.</p>';

    // Technician workload
    document.getElementById('workloadList').innerHTML = state.technicians.map(t => {
      const activeCount = activeRequestsForTech(t.id).length;
      const pct = Math.min(100, activeCount * 20);
      return `
        <div class="workload-row">
          <span class="wl-name">${escapeHtml(t.name)}</span>
          <div class="wl-track"><div class="wl-fill" style="width:${pct}%"></div></div>
          <span class="wl-count">${activeCount} Active Jobs</span>
        </div>`;
    }).join('');

    // Status overview
    const statuses = [...STATUS_FLOW, 'Cancelled'];
    const colors = { Received: 'var(--blue)', Diagnosing: 'var(--amber)', 'In Repair': 'var(--orange)', 'Waiting for Parts': 'var(--red)', 'Ready for Pickup': 'var(--green)', Completed: 'var(--text-400)', Cancelled: 'var(--red)' };
    document.getElementById('statusOverview').innerHTML = statuses.map(s => {
      const count = state.requests.filter(r => r.status === s).length;
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return `
        <div class="breakdown-row">
          <span class="bd-label">${s}</span>
          <div class="bd-track"><div class="bd-fill" style="width:${pct}%;background:${colors[s]}"></div></div>
          <span class="bd-count">${count}</span>
        </div>`;
    }).join('');
  }

  function deviceIconSvg() {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M12 18h.01"/></svg>';
  }

  /* ============================================================
     SERVICE REQUESTS
     ============================================================ */
  function populateRequestFilterOptions() {
    document.getElementById('requestStatusFilter').innerHTML = '<option value="">All Statuses</option>' +
      [...STATUS_FLOW, 'Cancelled'].map(s => `<option value="${s}">${s}</option>`).join('');
    document.getElementById('requestPriorityFilter').innerHTML = '<option value="">All Priorities</option>' +
      ['Low', 'Medium', 'High', 'Urgent'].map(s => `<option value="${s}">${s}</option>`).join('');
  }
  function populateRequestTechFilter() {
    const sel = document.getElementById('requestTechFilter');
    const current = sel.value;
    sel.innerHTML = '<option value="">All Technicians</option>' +
      state.technicians.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
    sel.value = current;
  }
  function populateRequestFormSelects() {
    document.getElementById('requestCustomer').innerHTML = '<option value="">Select a customer</option>' +
      state.customers.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    document.getElementById('requestTechnician').innerHTML = '<option value="">Unassigned</option>' +
      state.technicians.map(t => `<option value="${t.id}">${escapeHtml(t.name)} — ${escapeHtml(t.specialization)}</option>`).join('');
  }

  function getFilteredRequests() {
    const q = document.getElementById('requestSearch').value.trim().toLowerCase();
    const status = document.getElementById('requestStatusFilter').value;
    const priority = document.getElementById('requestPriorityFilter').value;
    const tech = document.getElementById('requestTechFilter').value;
    const sort = document.getElementById('requestSort').value;

    let list = state.requests.filter(r => {
      const cust = getCustomer(r.customerId);
      const matchesQ = !q || r.deviceName.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) ||
        (cust && cust.name.toLowerCase().includes(q));
      const matchesStatus = !status || r.status === status;
      const matchesPriority = !priority || r.priority === priority;
      const matchesTech = !tech || r.technicianId === tech;
      return matchesQ && matchesStatus && matchesPriority && matchesTech;
    });

    list.sort((a, b) => sort === 'date-asc' ? a.dateReceived.localeCompare(b.dateReceived) : b.dateReceived.localeCompare(a.dateReceived));
    return list;
  }

  function renderRequests() {
    const list = getFilteredRequests();
    const tbody = document.getElementById('requestsTableBody');
    const emptyEl = document.getElementById('requestsEmpty');

    if (!list.length) {
      tbody.innerHTML = '';
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;

    tbody.innerHTML = list.map(r => {
      const cust = getCustomer(r.customerId);
      const tech = getTechnician(r.technicianId);
      return `
        <tr data-id="${r.id}">
          <td>
            <div class="cell-name"><strong>${escapeHtml(r.deviceName)}</strong><span class="req-id">${r.id}</span></div>
          </td>
          <td>${cust ? escapeHtml(cust.name) : '<em>Deleted customer</em>'}</td>
          <td>${escapeHtml(r.deviceType)}</td>
          <td>${tech ? escapeHtml(tech.name) : '<em>Unassigned</em>'}</td>
          <td><span class="priority-tag priority-${r.priority.toLowerCase()}">${r.priority}</span></td>
          <td>
            <select class="select-input select-inline" data-action="change-status" data-id="${r.id}">
              ${[...STATUS_FLOW, 'Cancelled'].map(s => `<option value="${s}" ${r.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </td>
          <td>${currency(r.estCost)}</td>
          <td>
            <div class="row-actions">
              <button class="btn btn-ghost btn-sm" data-action="view-request" data-id="${r.id}">View</button>
              <button class="btn btn-ghost btn-sm" data-action="edit-request" data-id="${r.id}">Edit</button>
              <button class="btn btn-ghost btn-sm" data-action="delete-request" data-id="${r.id}">Delete</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  function openRequestModal(requestId) {
    const form = document.getElementById('requestForm');
    form.reset();
    clearFormErrors(form);
    populateRequestFormSelects();
    document.getElementById('requestId').value = '';

    if (requestId) {
      const r = state.requests.find(x => x.id === requestId);
      if (!r) return;
      document.getElementById('requestModalTitle').textContent = 'Edit Service Request';
      document.getElementById('requestId').value = r.id;
      document.getElementById('requestCustomer').value = r.customerId;
      document.getElementById('requestDeviceType').value = r.deviceType;
      document.getElementById('requestDeviceName').value = r.deviceName;
      document.getElementById('requestProblem').value = r.problem;
      document.getElementById('requestDateReceived').value = r.dateReceived;
      document.getElementById('requestEstCompletion').value = r.estCompletion || '';
      document.getElementById('requestTechnician').value = r.technicianId || '';
      document.getElementById('requestPriority').value = r.priority;
      document.getElementById('requestStatus').value = r.status;
      document.getElementById('requestEstCost').value = r.estCost;
      document.getElementById('requestFinalCost').value = r.finalCost || '';
    } else {
      document.getElementById('requestModalTitle').textContent = 'New Service Request';
      document.getElementById('requestDateReceived').value = new Date().toISOString().slice(0, 10);
      document.getElementById('requestStatus').value = 'Received';
      document.getElementById('requestPriority').value = 'Medium';
    }
    openModal('requestModalBackdrop');
  }

  function handleRequestFormSubmit(e) {
    e.preventDefault();
    clearFormErrors(e.target);

    const customerId = document.getElementById('requestCustomer').value;
    const deviceType = document.getElementById('requestDeviceType').value;
    const deviceName = document.getElementById('requestDeviceName').value.trim();
    const problem = document.getElementById('requestProblem').value.trim();
    const dateReceived = document.getElementById('requestDateReceived').value;

    let hasError = false;
    if (!customerId) { setFieldError('requestCustomer', 'Please select a customer.'); hasError = true; }
    if (!deviceType) { setFieldError('requestDeviceType', 'Please select a device type.'); hasError = true; }
    if (!deviceName) { setFieldError('requestDeviceName', 'Device / item name is required.'); hasError = true; }
    if (!problem) { setFieldError('requestProblem', 'Please describe the problem.'); hasError = true; }
    if (!dateReceived) { hasError = true; }

    if (hasError) return;

    const id = document.getElementById('requestId').value;
    const status = document.getElementById('requestStatus').value;
    const finalCostVal = document.getElementById('requestFinalCost').value;

    const payload = {
      customerId, deviceType, deviceName, problem, dateReceived,
      estCompletion: document.getElementById('requestEstCompletion').value,
      technicianId: document.getElementById('requestTechnician').value,
      priority: document.getElementById('requestPriority').value,
      status,
      estCost: parseFloat(document.getElementById('requestEstCost').value) || 0,
      finalCost: finalCostVal ? parseFloat(finalCostVal) : ''
    };

    if (id) {
      const idx = state.requests.findIndex(r => r.id === id);
      const existing = state.requests[idx];
      payload.paymentStatus = existing.paymentStatus || 'Not Required';
      payload.paymentMethod = existing.paymentMethod || '';
      payload.paymentDate = existing.paymentDate || '';
      if (status === 'Completed' && payload.finalCost !== '' && (!existing.paymentStatus || existing.paymentStatus === 'Not Required')) {
        payload.paymentStatus = 'Pending';
      }
      state.requests[idx] = { ...existing, ...payload };
      showToast('Service request updated successfully.');
    } else {
      payload.id = uid('SR');
      payload.paymentStatus = status === 'Completed' && payload.finalCost !== '' ? 'Pending' : 'Not Required';
      payload.paymentMethod = '';
      payload.paymentDate = '';
      state.requests.push(payload);
      showToast('Service request created successfully.');
    }

    saveRequests();
    closeModal('requestModalBackdrop');
    renderCurrentView();
  }

  function viewRequestDetails(requestId) {
    const r = state.requests.find(x => x.id === requestId);
    if (!r) return;
    const cust = getCustomer(r.customerId);
    const tech = getTechnician(r.technicianId);

    let timelineHtml;
    if (r.status === 'Cancelled') {
      timelineHtml = '<div class="timeline-cancelled">This service request was cancelled.</div>';
    } else {
      const currentIdx = TIMELINE_STEPS.indexOf(r.status === 'Waiting for Parts' ? 'In Repair' : r.status);
      timelineHtml = '<div class="timeline">' + TIMELINE_STEPS.map((step, i) => {
        const cls = i < currentIdx ? 'is-done' : i === currentIdx ? 'is-current' : '';
        return `<div class="timeline-step ${cls}"><span class="ts-line"></span><span class="ts-dot"></span><span class="ts-label">${step}</span></div>`;
      }).join('') + '</div>';
      if (r.status === 'Waiting for Parts') {
        timelineHtml += '<p class="empty-inline">Currently on hold: waiting for parts before repair can continue.</p>';
      }
    }

    document.getElementById('detailsBody').innerHTML = `
      <div class="details-section">
        <h4>Customer</h4>
        <div class="details-grid">
          <div class="details-field"><span>Name</span><strong>${cust ? escapeHtml(cust.name) : 'Unknown'}</strong></div>
          <div class="details-field"><span>Contact</span><strong>${cust ? escapeHtml(cust.phone) : '—'}</strong></div>
        </div>
      </div>
      <div class="details-divider"></div>
      <div class="details-section">
        <h4>Device</h4>
        <div class="details-grid">
          <div class="details-field"><span>Device Type</span><strong>${escapeHtml(r.deviceType)}</strong></div>
          <div class="details-field"><span>Device / Item</span><strong>${escapeHtml(r.deviceName)}</strong></div>
        </div>
        <div class="details-field" style="margin-top:10px"><span>Problem Description</span><strong style="font-weight:400">${escapeHtml(r.problem)}</strong></div>
      </div>
      <div class="details-divider"></div>
      <div class="details-section">
        <h4>Repair</h4>
        <div class="details-grid">
          <div class="details-field"><span>Assigned Technician</span><strong>${tech ? escapeHtml(tech.name) : 'Unassigned'}</strong></div>
          <div class="details-field"><span>Priority</span><strong><span class="priority-tag priority-${r.priority.toLowerCase()}">${r.priority}</span></strong></div>
          <div class="details-field"><span>Date Received</span><strong>${formatDate(r.dateReceived)}</strong></div>
          <div class="details-field"><span>Estimated Completion</span><strong>${r.estCompletion ? formatDate(r.estCompletion) : '—'}</strong></div>
        </div>
        ${timelineHtml}
      </div>
      <div class="details-divider"></div>
      <div class="details-section">
        <h4>Financial</h4>
        <div class="details-grid">
          <div class="details-field"><span>Estimated Cost</span><strong>${currency(r.estCost)}</strong></div>
          <div class="details-field"><span>Final Cost</span><strong>${r.finalCost !== '' && r.finalCost != null ? currency(r.finalCost) : 'Not yet finalized'}</strong></div>
          <div class="details-field"><span>Payment Status</span><strong><span class="badge ${badgeClass(r.paymentStatus)}">${r.paymentStatus}</span></strong></div>
          <div class="details-field"><span>Payment Method</span><strong>${r.paymentMethod || '—'}</strong></div>
        </div>
      </div>
    `;
    openModal('detailsModalBackdrop');
  }

  function deleteRequest(id) {
    state.requests = state.requests.filter(r => r.id !== id);
    saveRequests();
    showToast('Service request deleted.', 'error');
    renderCurrentView();
  }

  function changeRequestStatus(id, status) {
    const idx = state.requests.findIndex(r => r.id === id);
    if (idx === -1) return;
    state.requests[idx].status = status;
    if (status === 'Completed' && state.requests[idx].finalCost !== '' && state.requests[idx].paymentStatus === 'Not Required') {
      state.requests[idx].paymentStatus = 'Pending';
    }
    saveRequests();
    showToast('Status updated to "' + status + '".');
    renderCurrentView();
  }

  /* ============================================================
     CUSTOMERS
     ============================================================ */
  function getFilteredCustomers() {
    const q = document.getElementById('customerSearch').value.trim().toLowerCase();
    return state.customers.filter(c =>
      !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q)
    ).sort((a, b) => a.name.localeCompare(b.name));
  }

  function renderCustomers() {
    const list = getFilteredCustomers();
    const tbody = document.getElementById('customersTableBody');
    const emptyEl = document.getElementById('customersEmpty');
    if (!list.length) { tbody.innerHTML = ''; emptyEl.hidden = false; return; }
    emptyEl.hidden = true;

    tbody.innerHTML = list.map(c => `
      <tr data-id="${c.id}">
        <td class="cell-name"><strong>${escapeHtml(c.name)}</strong></td>
        <td class="cell-name"><span>${escapeHtml(c.phone)}</span><span>${escapeHtml(c.email)}</span></td>
        <td>${escapeHtml(c.address)}</td>
        <td>${formatDate(c.regDate)}</td>
        <td>${requestsForCustomer(c.id).length}</td>
        <td>
          <div class="row-actions">
            <button class="btn btn-ghost btn-sm" data-action="view-customer" data-id="${c.id}">View</button>
            <button class="btn btn-ghost btn-sm" data-action="edit-customer" data-id="${c.id}">Edit</button>
            <button class="btn btn-ghost btn-sm" data-action="delete-customer" data-id="${c.id}">Delete</button>
          </div>
        </td>
      </tr>`).join('');
  }

  function openCustomerModal(customerId) {
    const form = document.getElementById('customerForm');
    form.reset();
    clearFormErrors(form);
    document.getElementById('customerId').value = '';

    if (customerId) {
      const c = getCustomer(customerId);
      if (!c) return;
      document.getElementById('customerModalTitle').textContent = 'Edit Customer';
      document.getElementById('customerId').value = c.id;
      document.getElementById('customerName').value = c.name;
      document.getElementById('customerPhone').value = c.phone;
      document.getElementById('customerEmail').value = c.email;
      document.getElementById('customerAddress').value = c.address;
    } else {
      document.getElementById('customerModalTitle').textContent = 'Add Customer';
    }
    openModal('customerModalBackdrop');
  }

  function handleCustomerFormSubmit(e) {
    e.preventDefault();
    clearFormErrors(e.target);
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const address = document.getElementById('customerAddress').value.trim();

    let hasError = false;
    if (!name) { setFieldError('customerName', 'Full name is required.'); hasError = true; }
    if (!phone) { setFieldError('customerPhone', 'Phone number is required.'); hasError = true; }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) { setFieldError('customerEmail', 'Enter a valid email.'); hasError = true; }
    if (!address) { setFieldError('customerAddress', 'Address is required.'); hasError = true; }
    if (hasError) return;

    const id = document.getElementById('customerId').value;
    if (id) {
      const idx = state.customers.findIndex(c => c.id === id);
      state.customers[idx] = { ...state.customers[idx], name, phone, email, address };
      showToast('Customer updated successfully.');
    } else {
      state.customers.push({ id: uid('CUS'), name, phone, email, address, regDate: new Date().toISOString().slice(0, 10) });
      showToast('Customer added successfully.');
    }
    saveCustomers();
    closeModal('customerModalBackdrop');
    populateRequestFormSelects();
    renderCurrentView();
  }

  function viewCustomerDetails(customerId) {
    const c = getCustomer(customerId);
    if (!c) return;
    const reqs = requestsForCustomer(customerId);
    document.getElementById('customerDetailsBody').innerHTML = `
      <div class="details-grid">
        <div class="details-field"><span>Name</span><strong>${escapeHtml(c.name)}</strong></div>
        <div class="details-field"><span>Registered</span><strong>${formatDate(c.regDate)}</strong></div>
        <div class="details-field"><span>Phone</span><strong>${escapeHtml(c.phone)}</strong></div>
        <div class="details-field"><span>Email</span><strong>${escapeHtml(c.email)}</strong></div>
      </div>
      <div class="details-field" style="margin-top:12px"><span>Address</span><strong>${escapeHtml(c.address)}</strong></div>
      <div class="details-divider"></div>
      <h4 style="font-size:0.78rem;text-transform:uppercase;letter-spacing:0.04em;color:var(--text-400);margin-bottom:10px">Service History (${reqs.length})</h4>
      <div class="mini-list">
        ${reqs.length ? reqs.map(r => `
          <div class="mini-item">
            <div class="mini-info"><strong>${escapeHtml(r.deviceName)}</strong><span>${formatDate(r.dateReceived)}</span></div>
            <span class="badge ${badgeClass(r.status)}">${r.status}</span>
          </div>`).join('') : '<p class="empty-inline">No service requests yet.</p>'}
      </div>
    `;
    openModal('customerDetailsModalBackdrop');
  }

  function deleteCustomer(id) {
    state.customers = state.customers.filter(c => c.id !== id);
    state.requests = state.requests.filter(r => r.customerId !== id);
    saveCustomers();
    saveRequests();
    showToast('Customer deleted.', 'error');
    populateRequestFormSelects();
    renderCurrentView();
  }

  /* ============================================================
     TECHNICIANS
     ============================================================ */
  function getFilteredTechnicians() {
    const q = document.getElementById('technicianSearch').value.trim().toLowerCase();
    return state.technicians.filter(t =>
      !q || t.name.toLowerCase().includes(q) || t.specialization.toLowerCase().includes(q)
    );
  }

  function renderTechnicians() {
    const list = getFilteredTechnicians();
    const grid = document.getElementById('techniciansGrid');
    if (!list.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>No technicians found</p><span>Try a different search, or add a new technician.</span></div>`;
      return;
    }
    grid.innerHTML = list.map(t => {
      const activeCount = activeRequestsForTech(t.id).length;
      const completedCount = completedRequestsForTech(t.id).length;
      return `
        <div class="tech-card" data-id="${t.id}">
          <div class="tech-card-top">
            <div class="tech-avatar">${initials(t.name)}</div>
            <div>
              <div class="tech-name">${escapeHtml(t.name)}</div>
              <div class="tech-spec">${escapeHtml(t.specialization)}</div>
            </div>
          </div>
          <div class="tech-contact">
            <span>${escapeHtml(t.phone)}</span>
            <span>${escapeHtml(t.email)}</span>
          </div>
          <div class="tech-jobs">
            <div><div class="tj-val">${activeCount}</div><div class="tj-label">Active Jobs</div></div>
            <div><div class="tj-val">${completedCount}</div><div class="tj-label">Completed</div></div>
          </div>
          <div class="tech-card-foot">
            <span class="badge ${badgeClass(t.status)}">${t.status}</span>
            <div class="tech-actions">
              <button class="btn btn-ghost btn-sm" data-action="edit-technician" data-id="${t.id}">Edit</button>
              <button class="btn btn-ghost btn-sm" data-action="delete-technician" data-id="${t.id}">Delete</button>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  function openTechnicianModal(techId) {
    const form = document.getElementById('technicianForm');
    form.reset();
    clearFormErrors(form);
    document.getElementById('technicianId').value = '';

    if (techId) {
      const t = getTechnician(techId);
      if (!t) return;
      document.getElementById('technicianModalTitle').textContent = 'Edit Technician';
      document.getElementById('technicianId').value = t.id;
      document.getElementById('technicianName').value = t.name;
      document.getElementById('technicianSpecialization').value = t.specialization;
      document.getElementById('technicianPhone').value = t.phone;
      document.getElementById('technicianEmail').value = t.email;
      document.getElementById('technicianStatus').value = t.status;
    } else {
      document.getElementById('technicianModalTitle').textContent = 'Add Technician';
    }
    openModal('technicianModalBackdrop');
  }

  function handleTechnicianFormSubmit(e) {
    e.preventDefault();
    clearFormErrors(e.target);
    const name = document.getElementById('technicianName').value.trim();
    const specialization = document.getElementById('technicianSpecialization').value.trim();
    const phone = document.getElementById('technicianPhone').value.trim();
    const email = document.getElementById('technicianEmail').value.trim();

    let hasError = false;
    if (!name) { setFieldError('technicianName', 'Full name is required.'); hasError = true; }
    if (!specialization) { setFieldError('technicianSpecialization', 'Specialization is required.'); hasError = true; }
    if (!phone) { setFieldError('technicianPhone', 'Phone number is required.'); hasError = true; }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) { setFieldError('technicianEmail', 'Enter a valid email.'); hasError = true; }
    if (hasError) return;

    const id = document.getElementById('technicianId').value;
    const status = document.getElementById('technicianStatus').value;
    if (id) {
      const idx = state.technicians.findIndex(t => t.id === id);
      state.technicians[idx] = { ...state.technicians[idx], name, specialization, phone, email, status };
      showToast('Technician updated successfully.');
    } else {
      state.technicians.push({ id: uid('TEC'), name, specialization, phone, email, status });
      showToast('Technician added successfully.');
    }
    saveTechnicians();
    closeModal('technicianModalBackdrop');
    populateRequestFormSelects();
    populateRequestTechFilter();
    renderCurrentView();
  }

  function deleteTechnician(id) {
    state.technicians = state.technicians.filter(t => t.id !== id);
    state.requests.forEach(r => { if (r.technicianId === id) r.technicianId = ''; });
    saveTechnicians();
    saveRequests();
    showToast('Technician removed.', 'error');
    populateRequestFormSelects();
    populateRequestTechFilter();
    renderCurrentView();
  }

  /* ============================================================
     PAYMENTS
     ============================================================ */
  function renderPayments() {
    const completed = state.requests.filter(r => r.status === 'Completed');
    const revenue = completed.filter(r => r.paymentStatus === 'Paid').reduce((s, r) => s + (parseFloat(r.finalCost) || 0), 0);
    const pendingAmount = completed.filter(r => r.paymentStatus === 'Pending').reduce((s, r) => s + (parseFloat(r.finalCost) || 0), 0);
    const paidJobs = completed.filter(r => r.paymentStatus === 'Paid').length;
    const unpaidJobs = completed.filter(r => r.paymentStatus !== 'Paid').length;

    const stats = [
      { label: 'Completed Service Revenue', value: currency(revenue), accent: 'green' },
      { label: 'Pending Payments', value: currency(pendingAmount), accent: 'amber' },
      { label: 'Paid Jobs', value: paidJobs, accent: 'green' },
      { label: 'Unpaid Jobs', value: unpaidJobs, accent: 'red' }
    ];
    document.getElementById('paymentStatGrid').innerHTML = stats.map(s => `
      <div class="stat-card accent-${s.accent}">
        <p class="stat-label">${s.label}</p>
        <p class="stat-value">${s.value}</p>
      </div>`).join('');

    const tbody = document.getElementById('paymentsTableBody');
    const emptyEl = document.getElementById('paymentsEmpty');
    if (!completed.length) { tbody.innerHTML = ''; emptyEl.hidden = false; return; }
    emptyEl.hidden = true;

    tbody.innerHTML = [...completed].sort((a, b) => b.dateReceived.localeCompare(a.dateReceived)).map(r => {
      const cust = getCustomer(r.customerId);
      return `
        <tr data-id="${r.id}">
          <td><span class="req-id">${r.id}</span></td>
          <td>${cust ? escapeHtml(cust.name) : '<em>Deleted customer</em>'}</td>
          <td>${escapeHtml(r.deviceName)}</td>
          <td>${r.finalCost !== '' && r.finalCost != null ? currency(r.finalCost) : '—'}</td>
          <td><span class="badge ${badgeClass(r.paymentStatus)}">${r.paymentStatus}</span></td>
          <td>${r.paymentMethod || '—'}</td>
          <td>${r.paymentDate ? formatDate(r.paymentDate) : '—'}</td>
          <td>
            <div class="row-actions">
              <button class="btn btn-ghost btn-sm" data-action="record-payment" data-id="${r.id}">Record Payment</button>
            </div>
          </td>
        </tr>`;
    }).join('');
  }

  function openPaymentModal(requestId) {
    const r = state.requests.find(x => x.id === requestId);
    if (!r) return;
    document.getElementById('paymentRequestId').value = r.id;
    document.getElementById('paymentStatus').value = r.paymentStatus === 'Paid' ? 'Paid' : 'Pending';
    document.getElementById('paymentMethod').value = r.paymentMethod || 'Cash';
    document.getElementById('paymentDate').value = r.paymentDate || new Date().toISOString().slice(0, 10);
    openModal('paymentModalBackdrop');
  }

  function handlePaymentFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('paymentRequestId').value;
    const idx = state.requests.findIndex(r => r.id === id);
    if (idx === -1) return;

    const status = document.getElementById('paymentStatus').value;
    state.requests[idx].paymentStatus = status;
    state.requests[idx].paymentMethod = status === 'Paid' ? document.getElementById('paymentMethod').value : '';
    state.requests[idx].paymentDate = status === 'Paid' ? document.getElementById('paymentDate').value : '';

    saveRequests();
    showToast('Payment record saved.');
    closeModal('paymentModalBackdrop');
    renderCurrentView();
  }

  /* ============================================================
     MODALS, TOASTS, FORM HELPERS
     ============================================================ */
  function openModal(id) { document.getElementById(id).classList.add('is-open'); }
  function closeModal(id) { document.getElementById(id).classList.remove('is-open'); }

  function setFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    field.closest('.form-row').classList.add('has-error');
    const errEl = document.querySelector(`[data-error-for="${fieldId}"]`);
    if (errEl) errEl.textContent = message;
  }
  function clearFormErrors(form) {
    form.querySelectorAll('.form-row').forEach(r => r.classList.remove('has-error'));
    form.querySelectorAll('.field-error').forEach(e => e.textContent = '');
  }

  function showToast(message, type) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast' + (type === 'error' ? ' toast-error' : '');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'all .2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 2800);
  }

  /* ============================================================
     EVENT WIRING
     ============================================================ */
  function wireNav() {
    document.getElementById('mainNav').addEventListener('click', (e) => {
      const btn = e.target.closest('.nav-item');
      if (btn) switchView(btn.dataset.view);
    });
    document.querySelectorAll('[data-goto]').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.goto)));
    document.getElementById('menuToggle').addEventListener('click', () => document.getElementById('sidebar').classList.toggle('is-open'));
  }

  function wireModals() {
    document.querySelectorAll('[data-close-modal]').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.closeModal)));
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(backdrop.id); });
    });
  }

  function wireRequestControls() {
    document.getElementById('addRequestBtn').addEventListener('click', () => openRequestModal(null));
    document.getElementById('quickAddRequest').addEventListener('click', () => { switchView('requests'); openRequestModal(null); });
    document.getElementById('requestForm').addEventListener('submit', handleRequestFormSubmit);

    document.getElementById('requestSearch').addEventListener('input', renderRequests);
    document.getElementById('requestStatusFilter').addEventListener('change', renderRequests);
    document.getElementById('requestPriorityFilter').addEventListener('change', renderRequests);
    document.getElementById('requestTechFilter').addEventListener('change', renderRequests);
    document.getElementById('requestSort').addEventListener('change', renderRequests);

    document.getElementById('requestsTableBody').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.action === 'view-request') viewRequestDetails(id);
      else if (btn.dataset.action === 'edit-request') openRequestModal(id);
      else if (btn.dataset.action === 'delete-request') {
        state.deleteTarget = { type: 'request', id };
        document.getElementById('confirmMessage').textContent = 'Delete this service request? This cannot be undone.';
        openModal('confirmModalBackdrop');
      }
    });
    document.getElementById('requestsTableBody').addEventListener('change', (e) => {
      const sel = e.target.closest('[data-action="change-status"]');
      if (sel) changeRequestStatus(sel.dataset.id, sel.value);
    });
  }

  function wireCustomerControls() {
    document.getElementById('addCustomerBtn').addEventListener('click', () => openCustomerModal(null));
    document.getElementById('customerForm').addEventListener('submit', handleCustomerFormSubmit);
    document.getElementById('customerSearch').addEventListener('input', renderCustomers);

    document.getElementById('customersTableBody').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.action === 'view-customer') viewCustomerDetails(id);
      else if (btn.dataset.action === 'edit-customer') openCustomerModal(id);
      else if (btn.dataset.action === 'delete-customer') {
        state.deleteTarget = { type: 'customer', id };
        document.getElementById('confirmMessage').textContent = 'Delete this customer? Their service request history will also be removed. This cannot be undone.';
        openModal('confirmModalBackdrop');
      }
    });
  }

  function wireTechnicianControls() {
    document.getElementById('addTechnicianBtn').addEventListener('click', () => openTechnicianModal(null));
    document.getElementById('technicianForm').addEventListener('submit', handleTechnicianFormSubmit);
    document.getElementById('technicianSearch').addEventListener('input', renderTechnicians);

    document.getElementById('techniciansGrid').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.action === 'edit-technician') openTechnicianModal(id);
      else if (btn.dataset.action === 'delete-technician') {
        state.deleteTarget = { type: 'technician', id };
        document.getElementById('confirmMessage').textContent = 'Delete this technician? Their assigned requests will become unassigned. This cannot be undone.';
        openModal('confirmModalBackdrop');
      }
    });
  }

  function wirePaymentControls() {
    document.getElementById('paymentForm').addEventListener('submit', handlePaymentFormSubmit);
    document.getElementById('paymentsTableBody').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="record-payment"]');
      if (btn) openPaymentModal(btn.dataset.id);
    });
  }

  function wireConfirmDelete() {
    document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
      if (!state.deleteTarget) return;
      const { type, id } = state.deleteTarget;
      if (type === 'request') deleteRequest(id);
      else if (type === 'customer') deleteCustomer(id);
      else if (type === 'technician') deleteTechnician(id);
      state.deleteTarget = null;
      closeModal('confirmModalBackdrop');
    });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    seedIfEmpty();
    loadData();
    populateRequestFilterOptions();
    populateRequestTechFilter();
    populateRequestFormSelects();
    wireNav();
    wireModals();
    wireRequestControls();
    wireCustomerControls();
    wireTechnicianControls();
    wirePaymentControls();
    wireConfirmDelete();
    switchView('dashboard');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
