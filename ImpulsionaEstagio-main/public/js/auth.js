"use strict";
let authenticatedUser = null;
function isAuthenticated() { return Boolean(localStorage.getItem('impulsiona_token')); }
function authFetch(input, init = {}) {
    const headers = new Headers(init.headers);
    const token = localStorage.getItem('impulsiona_token');
    if (token)
        headers.set('Authorization', `Bearer ${token}`);
    return fetch(input, { ...init, headers });
}
function setAuthState(user, token) {
    authenticatedUser = user;
    if (token)
        localStorage.setItem('impulsiona_token', token);
    if (user)
        localStorage.setItem('impulsiona_user', JSON.stringify(user));
    else
        localStorage.removeItem('impulsiona_user');
    const label = document.getElementById('authUserLabel');
    const action = document.getElementById('authActionBtn');
    if (label)
        label.textContent = user ? `Olá, ${user.name}` : 'Visitante';
    if (action)
        action.textContent = user ? 'Sair' : 'Entrar';
    const profileName = document.getElementById('profileDisplayName');
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileName)
        profileName.textContent = user?.name || 'Visitante';
    if (profileAvatar)
        profileAvatar.textContent = user?.name?.charAt(0).toUpperCase() || '?';
    document.querySelectorAll('[data-auth-required]').forEach(element => {
        element.classList.toggle('auth-disabled', !user);
    });
}
function setAuthMessage(message, error = true) {
    const target = document.getElementById('authMessage');
    if (target) {
        target.textContent = message;
        target.style.color = error ? '#b00020' : '#1f8a3d';
    }
}
async function loadAuthState() {
    if (!isAuthenticated())
        return;
    const response = await authFetch('/api/auth/me');
    if (!response.ok) {
        localStorage.removeItem('impulsiona_token');
        localStorage.removeItem('impulsiona_user');
        return;
    }
    const result = await response.json();
    setAuthState(result.usuario);
}
function openAuthPanel(register = false) {
    document.getElementById('auth-panel')?.classList.remove('hidden');
    document.getElementById('authTitle').textContent = register ? 'Criar conta' : 'Entrar';
    document.getElementById('authNameField')?.classList.toggle('hidden', !register);
    document.getElementById('authSubmitBtn').textContent = register ? 'Criar conta' : 'Entrar';
    setAuthMessage('');
}
async function handleAuthSubmit(event) {
    event.preventDefault();
    const register = !document.getElementById('authNameField').classList.contains('hidden');
    const value = (id) => document.getElementById(id).value;
    const email = value('authEmail').trim().toLowerCase();
    const password = value('authPassword');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setAuthMessage('Informe um e-mail no formato nome@exemplo.com.');
        return;
    }
    if (password.length < 6) {
        setAuthMessage('A senha deve ter no mínimo 6 caracteres.');
        return;
    }
    try {
        const response = await fetch(`/api/auth/${register ? 'register' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: value('authName'), email, password }) });
        const result = await response.json();
        if (!response.ok) {
            setAuthMessage(result.erro || 'Não foi possível autenticar.');
            return;
        }
        setAuthState(result.usuario, result.token);
        document.getElementById('auth-panel')?.classList.add('hidden');
    }
    catch {
        setAuthMessage('Não foi possível conectar ao servidor.');
    }
}
document.getElementById('authActionBtn')?.addEventListener('click', () => {
    if (!isAuthenticated()) {
        openAuthPanel();
        return;
    }
    localStorage.removeItem('impulsiona_token');
    setAuthState(null);
    switchView('jobs');
});
document.getElementById('authCloseBtn')?.addEventListener('click', () => document.getElementById('auth-panel')?.classList.add('hidden'));
document.getElementById('authToggleBtn')?.addEventListener('click', () => openAuthPanel(document.getElementById('authTitle')?.textContent === 'Entrar'));
document.getElementById('togglePasswordBtn')?.addEventListener('click', () => {
    const password = document.getElementById('authPassword');
    const button = document.getElementById('togglePasswordBtn');
    password.type = password.type === 'password' ? 'text' : 'password';
    button?.setAttribute('aria-label', password.type === 'password' ? 'Mostrar senha' : 'Ocultar senha');
});
document.getElementById('authForm')?.addEventListener('submit', handleAuthSubmit);
void loadAuthState();
