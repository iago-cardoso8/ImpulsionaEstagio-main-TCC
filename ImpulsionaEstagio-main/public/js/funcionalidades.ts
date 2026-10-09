let profileData: Profile | null = null;
let notificationsList: NotificationItem[] = [];

function formatJobTime(job: Job): string {
    const publishedAt = job.createdAt ? new Date(job.createdAt).getTime() : Number.NaN;
    if (!Number.isFinite(publishedAt)) return job.time || 'Data não informada';

    const minutes = Math.max(0, Math.floor((Date.now() - publishedAt) / 60000));
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `Há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Há ${days} ${days === 1 ? 'dia' : 'dias'}`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `Há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    const months = Math.floor(days / 30);
    return `Há ${months} ${months === 1 ? 'mês' : 'meses'}`;
}

function wasPublishedWithin(job: Job, maxAgeMs: number, fallbackTerm: string): boolean {
    const publishedAt = job.createdAt ? new Date(job.createdAt).getTime() : Number.NaN;
    return Number.isFinite(publishedAt)
        ? Date.now() - publishedAt <= maxAgeMs
        : job.time.toLowerCase().includes(fallbackTerm);
}

async function carregarVagas() {
    try {
        const resposta = await fetch('/api/vagas');
        if (!resposta.ok) throw new Error('Erro ao carregar vagas');
        const resultado = await resposta.json() as ApiResponse<Job[]>;
        
        // A API retorna { sucesso: true, quantidade: X, dados: [...] }
        if (resultado.sucesso && resultado.dados) {
            jobs = resultado.dados;
            console.log(`✅ ${jobs.length} vagas carregadas`);
        } else {
            jobs = [];
            throw new Error('Resposta inválida da API');
        }
        
        renderJobs();
    } catch (erro) {
        console.error('❌ Erro ao carregar vagas:', erro);
        const countLabel = getElement<HTMLElement>('count-label');
        if (countLabel) countLabel.innerText = 'Erro ao carregar vagas';
    }
}

function switchView(viewName: string) {
    document.querySelectorAll<HTMLElement>('.view-section').forEach(el => el.classList.remove('active-view'));
    document.querySelectorAll<HTMLElement>('nav a').forEach(el => el.classList.remove('active'));

    const viewJobsContainer = getElement<HTMLElement>('view-jobs-container');
    const navVagas = getElement<HTMLElement>('nav-vagas');
    const viewRegisterContainer = getElement<HTMLElement>('view-register-container');
    const navCadastro = getElement<HTMLElement>('nav-cadastro');
    const viewNotificationsContainer = getElement<HTMLElement>('view-notifications-container');
    const navNotifications = getElement<HTMLElement>('nav-notifications');
    const viewProfileContainer = getElement<HTMLElement>('view-profile-container');
    const navPerfil = getElement<HTMLElement>('nav-perfil');

    if (viewName === 'jobs') {
        viewJobsContainer?.classList.add('active-view');
        navVagas?.classList.add('active');
        carregarVagas();
    } else if (viewName === 'register') {
        if (!isAuthenticated()) { openAuthPanel(); return; }
        if (!isCompanyUser()) {
            alert('Apenas empresas podem cadastrar vagas.');
            return;
        }
        viewRegisterContainer?.classList.add('active-view');
        navCadastro?.classList.add('active');
    } else if (viewName === 'notifications') {
        viewNotificationsContainer?.classList.add('active-view');
        navNotifications?.classList.add('active');
        fetchNotifications().then(() => renderNotifications());
    } else if (viewName === 'profile') {
        if (!isAuthenticated()) { openAuthPanel(); return; }
        viewProfileContainer?.classList.add('active-view');
        navPerfil?.classList.add('active');
        fetchProfile().then(data => {
            if (data) fillProfileForm(data);
            renderProfile();
        });
    }
}

async function fetchProfile(): Promise<Profile | null> {
    try {
        const response = await authFetch('/api/perfil');
        if (!response.ok) throw new Error('Erro ao carregar perfil');
        const result = await response.json() as ApiResponse<Profile>;
        if (result.sucesso && result.dados) {
            profileData = result.dados;
            return profileData;
        }
        return null;
    } catch (erro) {
        console.error(erro);
        return null;
    }
}

async function fetchNotifications(): Promise<NotificationItem[]> {
    try {
        const response = await fetch('/api/notificacoes');
        if (!response.ok) throw new Error('Erro ao carregar notificações');
        const result = await response.json() as ApiResponse<NotificationItem[]>;
        if (result.sucesso && result.dados) {
            notificationsList = result.dados;
            return notificationsList;
        }
        return [];
    } catch (erro) {
        console.error(erro);
        return [];
    }
}

async function saveProfile(profile: Profile): Promise<Profile> {
    try {
        const response = await authFetch('/api/perfil', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
        });
        const result = await response.json() as ApiResponse<Profile>;
        if (!response.ok) {
            throw new Error(result.erro || 'Erro ao salvar perfil');
        }
        profileData = result.dados ?? null;
        return profileData as Profile;
    } catch (erro) {
        console.error(erro);
        throw erro;
    }
}

function handleSearch() {
    renderJobs();
}

function showDetails(job: Job) {
    const isSaved = savedJobs.includes(job.id);
    const reqList = Array.isArray(job.requirements)
        ? job.requirements.map((r: string) => `<li>${escapeHtml(r)}</li>`).join("")
        : `<li>${escapeHtml(String(job.requirements))}</li>`;
    const benList = Array.isArray(job.benefits)
        ? job.benefits.map((b: string) => `<li>${escapeHtml(b)}</li>`).join("")
        : job.benefits ? `<li>${escapeHtml(String(job.benefits))}</li>` : '<li>Nenhum benefício listado</li>';
    const managementActions = canManageJob(job.usuarioId)
            ? `<button class="btn-action" onclick="startJobEdit(${job.id})">Editar</button>
                <button class="btn-action btn-delete" onclick="deleteJob(${job.id})">Excluir</button>`
            : '';

    const jobDetails = getElement<HTMLElement>('job-details');
    if (!jobDetails) return;
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
          <button class="btn-save ${isSaved ? 'saved' : ''}" onclick="toggleSave(${job.id})">
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
    </div>
  `;
}

function toggleSave(jobId: number) {
    if (savedJobs.includes(jobId)) {
        savedJobs = savedJobs.filter(id => id !== jobId);
    } else {
        savedJobs.push(jobId);
    }
    localStorage.setItem("ifpb_saved", JSON.stringify(savedJobs));
    renderJobs();
    const job = jobs.find(j => j.id === jobId);
    if (job) showDetails(job);
}

function renderNotifications() {
    const listContainer = document.getElementById('notification-list');
    if (!listContainer) return;

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
            if (!data) return;
            profileData = data;
            fillProfileForm(data);
        });
    } else if (profileData) {
        fillProfileForm(profileData);
    }

    const savedCountEl = getElement<HTMLElement>('saved-jobs-count');
    if (savedCountEl) {
        savedCountEl.textContent = String(savedJobs.length);
    }
}

function fillProfileForm(profile: Profile) {
    getInputElement('profileName')!.value = profile.name || '';
    getInputElement('profileEmail')!.value = profile.email || '';
    getInputElement('profileCourse')!.value = profile.course || '';
    getInputElement('profileCampus')!.value = profile.campus || '';
    getInputElement('profileStatus')!.value = profile.status || '';
    getInputElement('profileAvailability')!.value = profile.availability || '';
}

function setProfileMessage(message: string, isError = true) {
    const profileMessage = getElement<HTMLElement>('profileMessage');
    if (!profileMessage) return;
    profileMessage.textContent = message;
    profileMessage.style.color = isError ? '#b00020' : '#1f8a3d';
}

function clearProfileMessage() {
    const profileMessage = getElement<HTMLElement>('profileMessage');
    if (!profileMessage) return;
    profileMessage.textContent = '';
}

async function handleSaveProfile() {
    const profile: Profile = {
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
    } catch (erro) {
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
    const listContainer = getElement<HTMLElement>('job-list');
    const searchText = getInputValue('jobSearch').toLowerCase();
    if (!listContainer) return;
    listContainer.innerHTML = "";

    const cidadesMarcadas = Array.from(document.querySelectorAll<HTMLInputElement>('.cb-filtro[data-tipo="cidade"]:checked')).map(cb => cb.value);
    const cursosMarcados = Array.from(document.querySelectorAll<HTMLInputElement>('.cb-filtro[data-tipo="curso"]:checked')).map(cb => cb.value);
    const empresasMarcadas = Array.from(document.querySelectorAll<HTMLInputElement>('.cb-filtro[data-tipo="empresa"]:checked')).map(cb => cb.value);
    const remunMarcadas = Array.from(document.querySelectorAll<HTMLInputElement>('.cb-filtro[data-tipo="remuneracao"]:checked')).map(cb => cb.value);
    const datasMarcadas = Array.from(document.querySelectorAll<HTMLInputElement>('.cb-filtro[data-tipo="data"]:checked')).map(cb => cb.value);

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
                if (opcao === 'ate_800') return valorSalario <= 800;
                if (opcao === 'acima_800') return valorSalario > 800;
                return false;
            });
        }

        let matchData = true;
        if (datasMarcadas.length > 0) {
            matchData = datasMarcadas.some(opcao => {
                if (opcao === 'hoje') return wasPublishedWithin(job, 24 * 60 * 60 * 1000, 'hora');
                if (opcao === 'semana') return wasPublishedWithin(job, 7 * 24 * 60 * 60 * 1000, 'dia');
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
        const countLabel = getElement<HTMLElement>('count-label');
        if (countLabel) countLabel.innerText = '0 vagas encontradas';
        return;
    }

    filtered.forEach(job => {
        const isSaved = savedJobs.includes(job.id);
        const card = document.createElement("div");
        card.className = "job-card";
        card.id = `card-${job.id}`;

        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=2d9669&color=fff`;

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

    const countLabel = getElement<HTMLElement>('count-label');
    if (countLabel) countLabel.innerText = `${filtered.length} vagas encontradas`;
}
