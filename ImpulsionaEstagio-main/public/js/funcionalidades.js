"use strict";
let profileData = null;
let notificationsList = [];
function resetApplicationUserState() {
    profileData = null;
    notificationsList = [];
    savedJobs = readSavedJobs();
    const form = getElement('profileForm');
    form?.reset();
    const name = getElement('profileDisplayName');
    if (name)
        name.textContent = 'Visitante';
    const roleLine = getElement('profileRoleLine');
    if (roleLine)
        roleLine.textContent = 'Entre para acessar seu perfil';
    const campusLine = getElement('profileCampusLine');
    if (campusLine)
        campusLine.textContent = '';
    const notificationCount = getElement('notification-count');
    if (notificationCount)
        notificationCount.textContent = '0';
    const notificationList = getElement('notification-list');
    if (notificationList)
        notificationList.textContent = '';
    const jobDetails = getElement('job-details');
    if (jobDetails)
        jobDetails.innerHTML = '<p>Selecione uma vaga para ver os detalhes completos.</p>';
    renderJobs();
}
function formatJobTime(job) {
    const publishedAt = job.createdAt ? new Date(job.createdAt).getTime() : Number.NaN;
    if (!Number.isFinite(publishedAt))
        return job.time || 'Data não informada';
    const minutes = Math.max(0, Math.floor((Date.now() - publishedAt) / 60000));
    if (minutes < 1)
        return 'Agora mesmo';
    if (minutes < 60)
        return `Há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `Há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    const days = Math.floor(hours / 24);
    if (days < 7)
        return `Há ${days} ${days === 1 ? 'dia' : 'dias'}`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5)
        return `Há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    const months = Math.floor(days / 30);
    return `Há ${months} ${months === 1 ? 'mês' : 'meses'}`;
}
function wasPublishedWithin(job, maxAgeMs, fallbackTerm) {
    const publishedAt = job.createdAt ? new Date(job.createdAt).getTime() : Number.NaN;
    return Number.isFinite(publishedAt)
        ? Date.now() - publishedAt <= maxAgeMs
        : job.time.toLowerCase().includes(fallbackTerm);
}
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
    const viewApplications = getElement('view-applications-container');
    const navApplications = getElement('nav-applications');
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
        if (!isCompanyUser()) {
            alert('Apenas empresas podem cadastrar vagas.');
            return;
        }
        viewRegisterContainer?.classList.add('active-view');
        navCadastro?.classList.add('active');
    }
    else if (viewName === 'notifications') {
        if (!isCompanyUser()) {
            openAuthPanel();
            return;
        }
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
    else if (viewName === 'applications') {
        if (!isAuthenticated() || isCompanyUser()) {
            openAuthPanel();
            return;
        }
        viewApplications?.classList.add('active-view');
        navApplications?.classList.add('active');
        void fetchMyApplications();
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
        const response = await authFetch('/api/notificacoes');
        if (!response.ok)
            throw new Error('Erro ao carregar notificações');
        const result = await response.json();
        if (result.sucesso && result.dados) {
            notificationsList = result.dados;
            const notificationCount = getElement('notification-count');
            if (notificationCount)
                notificationCount.textContent = String(notificationsList.length);
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
        ? job.requirements.map((r) => `<li>${escapeHtml(r)}</li>`).join("")
        : `<li>${escapeHtml(String(job.requirements))}</li>`;
    const benList = Array.isArray(job.benefits)
        ? job.benefits.map((b) => `<li>${escapeHtml(b)}</li>`).join("")
        : job.benefits ? `<li>${escapeHtml(String(job.benefits))}</li>` : '<li>Nenhum benefício listado</li>';
    const managementActions = canManageJob(job.usuarioId)
        ? `<button class="btn-action" id="editJobButton">Editar</button>
                <button class="btn-action btn-delete" id="deleteJobButton">Excluir</button>`
        : '';
    const jobDetails = getElement('job-details');
    if (!jobDetails)
        return;
    jobDetails.innerHTML = `
    <div class="detail-card">
      <div class="detail-header">
        <div>
          <p class="detail-eyebrow">Oportunidade disponível</p>
          <h2>${escapeHtml(job.title)}</h2>
          <h4>${escapeHtml(job.company)}</h4>
          <p class="detail-meta">${escapeHtml(job.location)} · <strong>${escapeHtml(job.salary)}</strong></p>
          <p class="detail-email">E-mail: ${escapeHtml(job.email || 'Não informado')}</p>
        </div>
        <div class="detail-actions">
                    ${managementActions}
          <button class="btn-save ${isSaved ? 'saved' : ''}" id="toggleSaveButton">
            ${isSaved ? '♥ Salvo' : '♡ Salvar Vaga'}
          </button>
        </div>
      </div>
      <div class="detail-badges">
        <span class="tag">${escapeHtml(job.target)}</span>
        <span class="tag">${escapeHtml(job.type)}</span>
      </div>
      <div class="info-block">
        <h4>Sobre a Vaga</h4>
        <p style="color:#555; line-height:1.6; margin:0">${escapeHtml(job.desc)}</p>
      </div>
      <div class="info-block">
        <h4>Requisitos</h4>
        <ul>${reqList}</ul>
      </div>
      <div class="info-block">
        <h4>Benefícios</h4>
        <ul>${benList}</ul>
      </div>
      ${authenticatedUser?.role === 'student' ? '<button class="btn-register" id="applyJobBtn">Candidatar-se</button>' : ''}
      ${canManageJob(job.usuarioId) ? '<button class="btn-secondary" id="showApplicantsBtn">Ver candidaturas</button><div id="applicants-list"></div>' : ''}
    </div>
  `;
    getElement('applyJobBtn')?.addEventListener('click', () => void applyToJob(job.id));
    getElement('showApplicantsBtn')?.addEventListener('click', () => void fetchJobApplications(job.id));
    getElement('editJobButton')?.addEventListener('click', () => void startJobEdit(job.id));
    getElement('deleteJobButton')?.addEventListener('click', () => void deleteJob(job.id));
    getElement('toggleSaveButton')?.addEventListener('click', () => toggleSave(job.id));
}
async function applyToJob(jobId) {
    try {
        const response = await authFetch(`/api/vagas/${jobId}/candidaturas`, { method: 'POST' });
        const result = await response.json();
        if (!response.ok) {
            alert(result.erro || 'Não foi possível enviar a candidatura.');
            return;
        }
        alert('Candidatura enviada com sucesso.');
    }
    catch (error) {
        console.error('Erro ao se candidatar:', error);
        alert('Não foi possível conectar ao servidor.');
    }
}
async function fetchMyApplications() {
    const container = getElement('my-applications-list');
    if (!container)
        return;
    try {
        const response = await authFetch('/api/candidaturas/minhas');
        const result = await response.json();
        if (!response.ok)
            throw new Error(result.erro || 'Falha ao carregar candidaturas');
        const applications = result.dados || [];
        container.innerHTML = applications.length ? applications.map(application => `
          <article class="notification-card">
            <strong>${escapeHtml(application.vaga.title)}</strong>
            <p>${escapeHtml(application.vaga.company)} · ${escapeHtml(application.vaga.location)}</p>
            <p>Status: ${escapeHtml(application.status)}</p>
          </article>
        `).join('') : '<p>Você ainda não se candidatou a nenhuma vaga.</p>';
    }
    catch (error) {
        console.error(error);
        container.textContent = 'Não foi possível carregar suas candidaturas.';
    }
}
async function fetchJobApplications(jobId) {
    const container = getElement('applicants-list');
    if (!container)
        return;
    try {
        const response = await authFetch(`/api/vagas/${jobId}/candidaturas`);
        const result = await response.json();
        if (!response.ok)
            throw new Error(result.erro || 'Falha ao carregar candidaturas');
        const applications = result.dados || [];
        container.innerHTML = applications.length ? applications.map(application => `
          <article class="notification-card">
            <strong>${escapeHtml(application.usuario?.name || 'Estudante')}</strong>
            <p>${escapeHtml(application.usuario?.email || '')}</p>
            <label for="application-status-${application.id}">Status</label>
            <select id="application-status-${application.id}" data-application-id="${application.id}">
              ${['Pendente', 'Aceito', 'Rejeitado'].map(status => `<option ${status === application.status ? 'selected' : ''}>${status}</option>`).join('')}
            </select>
          </article>
        `).join('') : '<p>Nenhuma candidatura para esta vaga.</p>';
        container.querySelectorAll('select[data-application-id]').forEach(select => {
            select.addEventListener('change', () => void updateApplicationStatus(Number(select.dataset.applicationId), select.value));
        });
    }
    catch (error) {
        console.error(error);
        container.textContent = 'Não foi possível carregar as candidaturas.';
    }
}
async function updateApplicationStatus(id, status) {
    const response = await authFetch(`/api/candidaturas/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });
    if (!response.ok) {
        const result = await response.json();
        alert(result.erro || 'Não foi possível atualizar o status.');
    }
}
function toggleSave(jobId) {
    if (savedJobs.includes(jobId)) {
        savedJobs = savedJobs.filter(id => id !== jobId);
    }
    else {
        savedJobs.push(jobId);
    }
    localStorage.setItem(savedJobsStorageKey(), JSON.stringify(savedJobs));
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
                <strong>${escapeHtml(notification.title)}</strong>
                <span>${escapeHtml(notification.time)}</span>
            </div>
            <p>${escapeHtml(notification.message)}</p>
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
    renderCityFilters();
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
            const valorSalario = job.salary.toLowerCase().includes('a combinar')
                ? Number.NaN
                : parseFloat(job.salary.replace(/[^\d,]/g, '').replace(',', '.'));
            matchRemun = remunMarcadas.some(opcao => {
                if (!Number.isFinite(valorSalario))
                    return false;
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
                    return wasPublishedWithin(job, 24 * 60 * 60 * 1000, 'hora');
                if (opcao === 'semana')
                    return wasPublishedWithin(job, 7 * 24 * 60 * 60 * 1000, 'dia');
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
        const avatarUrl = '/img/logo_impulsiona.png';
        card.innerHTML = `
      <img src="${avatarUrl}" alt="Logo">
      <div class="job-card-info">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
            <h4>${escapeHtml(job.title)}</h4>
            ${isSaved ? '<span style="color:#e91e63; font-size:1.1rem;">♥</span>' : ''}
        </div>
        <p><strong>${escapeHtml(job.company)}</strong></p>
        <p>${escapeHtml(job.location)}</p>
        <small style="color:#2d9669; font-weight:600">${escapeHtml(formatJobTime(job))}</small>
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
function renderCityFilters() {
    const options = getElement('city-filter-options');
    if (!options)
        return;
    const selected = new Set(Array.from(options.querySelectorAll('input:checked')).map(input => input.value));
    const cities = Array.from(new Set(jobs.map(job => job.location.split(' - ')[0].trim()).filter(Boolean))).sort();
    options.innerHTML = cities.map(city => `
      <label><input type="checkbox" class="cb-filtro" data-tipo="cidade" value="${escapeHtml(city)}" ${selected.has(city) ? 'checked' : ''}> ${escapeHtml(city)}</label>
    `).join('');
}
