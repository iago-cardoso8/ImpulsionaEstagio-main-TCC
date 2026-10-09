interface AuthUser { id: number; name: string; email: string; role: string; campus?: string; }
let authenticatedUser: AuthUser | null = null;

function isAuthenticated(): boolean { return Boolean(localStorage.getItem('impulsiona_token')); }
function isCompanyUser(): boolean { return authenticatedUser?.role === 'company'; }
function canManageJob(ownerId?: number | null): boolean {
    return isCompanyUser() && ownerId === authenticatedUser?.id;
}

function updateRegistrationFields(role: string) {
    const isStudent = role === 'student';
    document.getElementById('authCourseField')?.classList.toggle('hidden', !isStudent);
    document.getElementById('authCampusField')?.classList.toggle('hidden', !isStudent);
    const course = document.getElementById('authCourse') as HTMLSelectElement | null;
    const campus = document.getElementById('authCampus') as HTMLSelectElement | null;
    if (course) course.required = isStudent;
    if (campus) campus.required = isStudent;
}

function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    const token = localStorage.getItem('impulsiona_token');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    return fetch(input, { ...init, headers }).then(async (response) => {
        if (response.status === 401 && input.toString().includes('/api/')) {
            localStorage.removeItem('impulsiona_token');
            localStorage.removeItem('impulsiona_user');
            authenticatedUser = null;
            if (typeof window !== 'undefined') {
                setAuthState(null);
                const panel = document.getElementById('auth-panel');
                if (panel) panel.classList.remove('hidden');
                const title = document.getElementById('authTitle');
                if (title) title.textContent = 'Entrar';
                const nameField = document.getElementById('authNameField');
                if (nameField) nameField.classList.add('hidden');
                const submitBtn = document.getElementById('authSubmitBtn');
                if (submitBtn) submitBtn.textContent = 'Entrar';
                setAuthMessage('Sessão expirada. Faça login novamente.');
            }
            return response;
        }
        return response;
    });
}
function setAuthState(user: AuthUser | null, token?: string) {
    authenticatedUser = user;
    if (token) localStorage.setItem('impulsiona_token', token);
    if (user) localStorage.setItem('impulsiona_user', JSON.stringify(user));
    else localStorage.removeItem('impulsiona_user');
    const label = document.getElementById('authUserLabel');
    const action = document.getElementById('authActionBtn');
    if (label) label.textContent = user ? `Olá, ${user.name}` : 'Visitante';
    if (action) action.textContent = user ? 'Sair' : 'Entrar';
    const roleBadge = document.getElementById('authRoleBadge');
    if (roleBadge) {
        roleBadge.textContent = user?.role === 'company' ? 'Empresa' : user ? 'Estudante' : '';
        roleBadge.classList.toggle('hidden', !user);
    }
    document.querySelectorAll<HTMLElement>('.company-only').forEach(element => {
        element.classList.toggle('hidden', user?.role !== 'company');
    });
    const profileName = document.getElementById('profileDisplayName');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileRoleLine = document.getElementById('profileRoleLine');
    const profileCampusLine = document.getElementById('profileCampusLine');
    if (profileName) profileName.textContent = user?.name || 'Visitante';
    if (profileAvatar) profileAvatar.textContent = user?.name?.charAt(0).toUpperCase() || '?';
    if (profileRoleLine) profileRoleLine.textContent = user?.role === 'company' ? 'Perfil empresarial' : user ? 'Estudante' : 'Entre para acessar seu perfil';
    if (profileCampusLine) profileCampusLine.textContent = user?.role === 'company'
        ? 'Empresa cadastrada'
        : user?.campus ? `IFPB - Campus ${user.campus}` : '';
    const courseField = document.getElementById('profileCourse')?.closest<HTMLElement>('.profile-field');
    const campusField = document.getElementById('profileCampus')?.closest<HTMLElement>('.profile-field');
    const isStudent = !user || user.role === 'student';
    courseField?.classList.toggle('hidden', !isStudent);
    campusField?.classList.toggle('hidden', !isStudent);
    const courseInput = document.getElementById('profileCourse') as HTMLInputElement | null;
    const campusInput = document.getElementById('profileCampus') as HTMLInputElement | null;
    if (courseInput) courseInput.required = isStudent;
    if (campusInput) campusInput.required = isStudent;
    const profileNameInput = document.getElementById('profileName') as HTMLInputElement | null;
    const profileEmailInput = document.getElementById('profileEmail') as HTMLInputElement | null;
    if (user?.role === 'company') {
        if (profileNameInput && !profileNameInput.value) profileNameInput.value = user.name;
        if (profileEmailInput && !profileEmailInput.value) profileEmailInput.value = user.email;
        if (profileNameInput) profileNameInput.placeholder = 'Nome da empresa';
        if (profileEmailInput) profileEmailInput.placeholder = 'E-mail corporativo';
    } else {
        if (profileNameInput) profileNameInput.placeholder = 'Nome completo';
        if (profileEmailInput) profileEmailInput.placeholder = 'E-mail acadêmico';
    }
    document.querySelectorAll<HTMLElement>('[data-auth-required]').forEach(element => {
        element.classList.toggle('auth-disabled', !user);
    });
}
function setAuthMessage(message: string, error = true) {
    const target = document.getElementById('authMessage');
    if (target) { target.textContent = message; target.style.color = error ? '#b00020' : '#1f8a3d'; }
}
async function loadAuthState() {
    if (!isAuthenticated()) return;
    const response = await authFetch('/api/auth/me');
    if (!response.ok) { localStorage.removeItem('impulsiona_token'); localStorage.removeItem('impulsiona_user'); return; }
    const result = await response.json(); setAuthState(result.usuario);
}
function openAuthPanel(register = false, selectedRole?: string) {
    const savedRole = localStorage.getItem('impulsiona_role_choice');
    const role = selectedRole === 'company' || selectedRole === 'student'
        ? selectedRole
        : savedRole === 'company' ? 'company' : 'student';
    const roleInput = document.querySelector<HTMLInputElement>(`input[name="authRole"][value="${role}"]`);
    if (roleInput) roleInput.checked = true;
    document.getElementById('auth-panel')?.classList.remove('hidden');
    document.getElementById('authTitle')!.textContent = register ? 'Criar conta' : 'Entrar';
    document.getElementById('authNameField')?.classList.toggle('hidden', !register);
    document.getElementById('authRoleField')?.classList.toggle('hidden', !register);
    updateRegistrationFields(register ? role : 'company');
    document.getElementById('authSubmitBtn')!.textContent = register ? 'Criar conta' : 'Entrar';
    const password = document.getElementById('authPassword') as HTMLInputElement | null;
    if (password) password.autocomplete = register ? 'new-password' : 'current-password';
    setAuthMessage('');
}
async function handleAuthSubmit(event: Event) {
    event.preventDefault();
    const register = !document.getElementById('authNameField')!.classList.contains('hidden');
    const value = (id: string) => (document.getElementById(id) as HTMLInputElement).value;
    const email = value('authEmail').trim().toLowerCase();
    const password = value('authPassword');
    const role = register
        ? document.querySelector<HTMLInputElement>('input[name="authRole"]:checked')?.value || 'student'
        : undefined;
    const course = register ? value('authCourse') : '';
    const campus = register ? value('authCampus') : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setAuthMessage('Informe um e-mail no formato nome@exemplo.com.'); return; }
    if (password.length < 6) { setAuthMessage('A senha deve ter no mínimo 6 caracteres.'); return; }
    if (register && role === 'student' && (!course || !campus)) { setAuthMessage('Selecione seu curso e campus.'); return; }
    try {
        const payload = register
            ? { name: value('authName'), email, password, role, course, campus }
            : { email, password };
        const response = await fetch(`/api/auth/${register ? 'register' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        const result = await response.json();
        if (!response.ok) {
            setAuthMessage(result.erro || 'Não foi possível autenticar.');
            return;
        }
        if (role) localStorage.setItem('impulsiona_role_choice', role);
        setAuthState(result.usuario, result.token); document.getElementById('auth-panel')?.classList.add('hidden');
    } catch { setAuthMessage('Não foi possível conectar ao servidor.'); }
}
document.getElementById('authActionBtn')?.addEventListener('click', () => {
    if (!isAuthenticated()) { openAuthPanel(); return; }
    localStorage.removeItem('impulsiona_token'); setAuthState(null); switchView('jobs');
});
document.getElementById('authCloseBtn')?.addEventListener('click', () => document.getElementById('auth-panel')?.classList.add('hidden'));
document.getElementById('authToggleBtn')?.addEventListener('click', () => openAuthPanel(document.getElementById('authTitle')?.textContent === 'Entrar'));
document.querySelectorAll<HTMLInputElement>('input[name="authRole"]').forEach(input => {
    input.addEventListener('change', () => {
        localStorage.setItem('impulsiona_role_choice', input.value);
        updateRegistrationFields(input.value);
    });
});
document.getElementById('choose-student')?.addEventListener('click', () => {
    document.getElementById('role-select-panel')?.classList.add('hidden');
    localStorage.setItem('impulsiona_role_choice', 'student');
    openAuthPanel(true, 'student');
});
document.getElementById('choose-company')?.addEventListener('click', () => {
    document.getElementById('role-select-panel')?.classList.add('hidden');
    localStorage.setItem('impulsiona_role_choice', 'company');
    openAuthPanel(true, 'company');
});
document.getElementById('role-close')?.addEventListener('click', () => {
    document.getElementById('role-select-panel')?.classList.add('hidden');
});
document.getElementById('togglePasswordBtn')?.addEventListener('click', () => {
    const password = document.getElementById('authPassword') as HTMLInputElement;
    const button = document.getElementById('togglePasswordBtn');
    password.type = password.type === 'password' ? 'text' : 'password';
    button?.setAttribute('aria-label', password.type === 'password' ? 'Mostrar senha' : 'Ocultar senha');
});
document.getElementById('authForm')?.addEventListener('submit', handleAuthSubmit);
void loadAuthState();