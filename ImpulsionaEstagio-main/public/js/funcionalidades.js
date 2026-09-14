"use strict";
let profileData = null;
let notificationsList = [];
async function carregarVagas() {
    try {
        const resposta = await fetch('/api/vagas');
        if (!resposta.ok)
            throw new Error('Erro ao carregar vagas');
        const resultado = await resposta.json();
        // A API retorna { sucesso: true, quantidade: X, dados: [...] }
        if (resultado.sucesso && resultado.dados) {
            jobs = resultado.dados;
            console.log(`✅ ${jobs.length} vagas carregadas`);
        }
        else {
            jobs = [];
            throw new Error('Resposta inválida da API');
        }
        renderJobs();
    }
    catch (erro) {
        console.error('❌ Erro ao carregar vagas:', erro);
        const countLabel = getElement('count-label');
        if (countLabel)
            countLabel.innerText = 'Erro ao carregar vagas';
    }
}
function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active-view'));
    document.querySelectorAll('nav a').forEach(el => el.classList.remove('active'));
    const viewJobsContainer = getElement('view-jobs-container');
    const navVagas = getElement('nav-vagas');
    const viewRegisterContainer = getElement('view-register-container');
    const navCadastro = getElement('nav-cadastro');
    const viewNotificationsContainer = getElement('view-notifications-container');
    const navNotifications = getElement('nav-notifications');
    const viewProfileContainer = getElement('view-profile-container');
    const navPerfil = getElement('nav-perfil');
    if (viewName === 'jobs') {
        viewJobsContainer?.classList.add('active-view');
        navVagas?.classList.add('active');
        carregarVagas();
    }
    else if (viewName === 'register') {
        if (!isAuthenticated()) {
            openAuthPanel();
            return;
        }
        viewRegisterContainer?.classList.add('active-view');
        navCadastro?.classList.add('active');
    }
    else if (viewName === 'notifications') {
        viewNotificationsContainer?.classList.add('active-view');
        navNotifications?.classList.add('active');
        fetchNotifications().then(() => renderNotifications());
    }
    else if (viewName === 'profile') {
        if (!isAuthenticated()) {
            openAuthPanel();
            return;
        }
        viewProfileContainer?.classList.add('active-view');
        navPerfil?.classList.add('active');
        fetchProfile().then(data => {
            if (data)
                fillProfileForm(data);
            renderProfile();
        });
    }
}
async function fetchProfile() {
    try {
        const response = await authFetch('/api/perfil');
        if (!response.ok)
            throw new Error('Erro ao carregar perfil');
        const result = await response.json();
        if (result.sucesso && result.dados) {
            profileData = result.dados;
            return profileData;
        }
        return null;
    }
    catch (erro) {
        console.error(erro);
        return null;
    }
}
async function fetchNotifications() {
    try {
        const response = await fetch('/api/notificacoes');
        if (!response.ok)
            throw new Error('Erro ao carregar notificações');
        const result = await response.json();
        if (result.sucesso && result.dados) {
            notificationsList = result.dados;
            return notificationsList;
        }
        return [];
    }
    catch (erro) {
        console.error(erro);
        return [];
    }
}
async function saveProfile(profile) {
    try {
        const response = await authFetch('/api/perfil', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.erro || 'Erro ao salvar perfil');
        }
        profileData = result.dados ?? null;
        return profileData;
    }
    catch (erro) {
        console.error(erro);
        throw erro;
    }
}
function handleSearch() {
    renderJobs();
}
function showDetails(job) {
    const isSaved = savedJobs.includes(job.id);
    const reqList = Array.isArray(job.requirements)
        ? job.requirements.map((r) => `<li>${r}</li>`).join("")
        : `<li>${job.requirements}</li>`;
    const benList = Array.isArray(job.benefits)
        ? job.benefits.map((b) => `<li>${b}</li>`).join("")
        : job.benefits ? `<li>${job.benefits}</li>` : '<li>Nenhum benefício listado</li>';
    const managementActions = isAuthenticated()
        ? `<button class="btn-action" onclick="startJobEdit(${job.id})">Editar</button>
                    <button class="btn-action btn-delete" onclick="deleteJob(${job.id})">Excluir</button>`
        : '';
    const jobDetails = getElement('job-details');
    if (!jobDetails)
        return;
    jobDetails.innerHTML = `
    <div class="detail-card">
      <div class="detail-header">
        <div>
          <p class="detail-eyebrow">Oportunidade disponível</p>
          <h2>${job.title}</h2>
          <h4>${job.company}</h4>
          <p class="detail-meta">${job.location} · <strong>${job.salary}</strong></p>
          <p class="detail-email">E-mail: ${job.email || 'Não informado'}</p>
        </div>
        <div class="detail-actions">
                    ${managementActions}
          <button class="btn-save ${isSaved ? 'saved' : ''}" onclick="toggleSave(${job.id})">
            ${isSaved ? '♥ Salvo' : '♡ Salvar Vaga'}
          </button>
        </div>
      </div>
      <div class="detail-badges">
        <span class="tag">${job.target}</span>
        <span class="tag">${job.type}</span>
      </div>
      <div class="info-block">
        <h4>Sobre a Vaga</h4>
        <p style="color:#555; line-height:1.6; margin:0">${job.desc}</p>
      </div>
      <div class="info-block">
        <h4>Requisitos</h4>
        <ul>${reqList}</ul>
      </div>
      <div class="info-block">
        <h4>Benefícios</h4>
        <ul>${benList}</ul>
      </div>
    </div>
  `;
}
function toggleSave(jobId) {
    if (savedJobs.includes(jobId)) {
        savedJobs = savedJobs.filter(id => id !== jobId);
    }
    else {
        savedJobs.push(jobId);
    }
    localStorage.setItem("ifpb_saved", JSON.stringify(savedJobs));
    renderJobs();
    const job = jobs.find(j => j.id === jobId);
    if (job)
        showDetails(job);
}
function renderNotifications() {
    const listContainer = document.getElementById('notification-list');
    if (!listContainer)
        return;
    const notificationsToShow = notificationsList.length > 0 ? notificationsList : [];
    if (notificationsToShow.length === 0) {
        listContainer.innerHTML = '<p class="notification-empty">Nenhuma notificação disponível.</p>';
        return;
    }
    listContainer.innerHTML = notificationsToShow.map(notification => `
        <div class="notification-card">
            <div class="notification-header">
                <strong>${notification.title}</strong>
                <span>${notification.time}</span>
            </div>
            <p>${notification.message}</p>
        </div>
    `).join('');
}
function renderProfile() {
    if (!profileData) {
        fetchProfile().then(data => {
            if (!data)
                return;
            profileData = data;
            fillProfileForm(data);
        });
    }
    else if (profileData) {
        fillProfileForm(profileData);
    }
    const savedCountEl = getElement('saved-jobs-count');
    if (savedCountEl) {
        savedCountEl.textContent = String(savedJobs.length);
    }
}
function fillProfileForm(profile) {
    getInputElement('profileName').value = profile.name || '';
    getInputElement('profileEmail').value = profile.email || '';
    getInputElement('profileCourse').value = profile.course || '';
    getInputElement('profileCampus').value = profile.campus || '';
    getInputElement('profileStatus').value = profile.status || '';
    getInputElement('profileAvailability').value = profile.availability || '';
}
function setProfileMessage(message, isError = true) {
    const profileMessage = getElement('profileMessage');
    if (!profileMessage)
        return;
    profileMessage.textContent = message;
    profileMessage.style.color = isError ? '#b00020' : '#1f8a3d';
}
function clearProfileMessage() {
    const profileMessage = getElement('profileMessage');
    if (!profileMessage)
        return;
    profileMessage.textContent = '';
}
async function handleSaveProfile() {
    const profile = {
        name: getInputValue('profileName'),
        email: getInputValue('profileEmail'),
        course: getInputValue('profileCourse'),
        campus: getInputValue('profileCampus'),
        status: getInputValue('profileStatus'),
        availability: getInputValue('profileAvailability')
    };
    try {
        const saved = await saveProfile(profile);
        setProfileMessage('Perfil salvo com sucesso.', false);
        fillProfileForm(saved);
    }
    catch (erro) {
        const message = erro instanceof Error ? erro.message : String(erro);
        setProfileMessage(message || 'Não foi possível salvar o perfil.');
    }
}
function handleCancelProfile() {
    if (profileData) {
        fillProfileForm(profileData);
    }
    clearProfileMessage();
}
const saveProfileBtn = document.getElementById('saveProfileBtn');
const cancelProfileBtn = document.getElementById('cancelProfileBtn');
if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', handleSaveProfile);
}
if (cancelProfileBtn) {
    cancelProfileBtn.addEventListener('click', handleCancelProfile);
}
function renderJobs() {
    const listContainer = getElement('job-list');
    const searchText = getInputValue('jobSearch').toLowerCase();
    if (!listContainer)
        return;
    listContainer.innerHTML = "";
    const cidadesMarcadas = Array.from(document.querySelectorAll('.cb-filtro[data-tipo="cidade"]:checked')).map(cb => cb.value);
    const cursosMarcados = Array.from(document.querySelectorAll('.cb-filtro[data-tipo="curso"]:checked')).map(cb => cb.value);
    const empresasMarcadas = Array.from(document.querySelectorAll('.cb-filtro[data-tipo="empresa"]:checked')).map(cb => cb.value);
    const remunMarcadas = Array.from(document.querySelectorAll('.cb-filtro[data-tipo="remuneracao"]:checked')).map(cb => cb.value);
    const datasMarcadas = Array.from(document.querySelectorAll('.cb-filtro[data-tipo="data"]:checked')).map(cb => cb.value);
    const filtered = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchText) ||
            job.company.toLowerCase().includes(searchText);
        const matchCidade = cidadesMarcadas.length === 0 ||
            cidadesMarcadas.some(cidade => job.location.includes(cidade));
        const matchCurso = cursosMarcados.length === 0 ||
            cursosMarcados.includes(job.target);
        const matchEmpresa = empresasMarcadas.length === 0 ||
            empresasMarcadas.some(empresa => job.company.includes(empresa));
        let matchRemun = true;
        if (remunMarcadas.length > 0) {
            const valorSalario = parseFloat(job.salary.replace(/[^\d,]/g, '').replace(',', '.'));
            matchRemun = remunMarcadas.some(opcao => {
                if (opcao === 'ate_800')
                    return valorSalario <= 800;
                if (opcao === 'acima_800')
                    return valorSalario > 800;
                return false;
            });
        }
        let matchData = true;
        if (datasMarcadas.length > 0) {
            matchData = datasMarcadas.some(opcao => {
                if (opcao === 'hoje')
                    return job.time.includes('hora');
                if (opcao === 'semana')
                    return job.time.includes('dia');
                return false;
            });
        }
        return matchesSearch && matchCidade && matchCurso && matchEmpresa && matchRemun && matchData;
    });
    if (filtered.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <h4>Nenhuma vaga encontrada</h4>
                <p>Tente ajustar os filtros ou buscar por outro termo.</p>
            </div>
        `;
        const countLabel = getElement('count-label');
        if (countLabel)
            countLabel.innerText = '0 vagas encontradas';
        return;
    }
    filtered.forEach(job => {
        const isSaved = savedJobs.includes(job.id);
        const card = document.createElement("div");
        card.className = "job-card";
        card.id = `card-${job.id}`;
        const avatarUrl = `https://ui-avatars.com/api/?name=${job.company}&background=2d9669&color=fff`;
        card.innerHTML = `
      <img src="${avatarUrl}" alt="Logo">
      <div class="job-card-info">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <h4>${job.title}</h4>
            ${isSaved ? '<span style="color:#e91e63; font-size:1.1rem;">♥</span>' : ''}
        </div>
        <p><strong>${job.company}</strong></p>
        <p>${job.location}</p>
        <small style="color:#2d9669; font-weight:600">${job.time}</small>
      </div>
    `;
        card.onclick = () => {
            document.querySelectorAll(".job-card").forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            showDetails(job);
        };
        listContainer.appendChild(card);
    });
    const countLabel = getElement('count-label');
    if (countLabel)
        countLabel.innerText = `${filtered.length} vagas encontradas`;
}
