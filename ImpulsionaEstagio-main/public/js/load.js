"use strict";
/**
 * ── ARQUIVO DE CARREGAMENTO ──────────────────────────────────
 * Responsável por carregar dados do banco de dados (backend)
 * e integrar com o frontend
 * ──────────────────────────────────────────────────────────────
 */
/**
 * Carrega todas as vagas do banco de dados via API
 * @returns {Promise<Job[]>} Array de vagas do banco de dados
 */
async function loadJobsFromDatabase() {
    try {
        const response = await fetch('/api/vagas');
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }
        const resultado = await response.json();
        if (resultado.sucesso && resultado.dados) {
            console.log(`✅ ${resultado.quantidade} vagas carregadas do banco de dados`);
            return resultado.dados;
        }
        else {
            console.warn('⚠️ Nenhuma vaga encontrada no banco de dados');
            return [];
        }
    }
    catch (erro) {
        console.error('❌ Erro ao carregar vagas do banco de dados:', erro);
        return [];
    }
}
/**
 * Carrega uma vaga específica pelo ID
 * @param {number} id - ID da vaga
 * @returns {Promise<Job|null>} Objeto da vaga ou null se não encontrado
 */
async function loadJobById(id) {
    try {
        const response = await fetch(`/api/vagas/${id}`);
        if (!response.ok) {
            throw new Error(`Vaga não encontrada: ${response.status}`);
        }
        const resultado = await response.json();
        if (resultado.sucesso && resultado.dados) {
            console.log(`✅ Vaga ${id} carregada com sucesso`);
            return resultado.dados;
        }
        return null;
    }
    catch (erro) {
        console.error(`❌ Erro ao carregar vaga ${id}:`, erro);
        return null;
    }
}
/**
 * Sincroniza dados entre banco de dados e frontend
 * Útil para manter dados atualizados
 */
async function syncDatabase() {
    console.log('🔄 Sincronizando dados com banco de dados...');
    const vagasDb = await loadJobsFromDatabase();
    if (typeof jobs !== 'undefined') {
        jobs = vagasDb;
        console.log('✅ Sincronização concluída');
    }
    return jobs;
}
async function loadProfileFromDatabase() {
    try {
        const response = await authFetch('/api/perfil');
        if (!response.ok)
            throw new Error(`Erro na requisição: ${response.status}`);
        const resultado = await response.json();
        if (resultado.sucesso && resultado.dados) {
            console.log('✅ Perfil carregado do banco de dados');
            return resultado.dados;
        }
        return null;
    }
    catch (erro) {
        console.error('❌ Erro ao carregar perfil:', erro);
        return null;
    }
}
async function loadNotificationsFromDatabase() {
    try {
        const response = await fetch('/api/notificacoes');
        if (!response.ok)
            throw new Error(`Erro na requisição: ${response.status}`);
        const resultado = await response.json();
        if (resultado.sucesso && resultado.dados) {
            console.log(`✅ ${resultado.quantidade} notificações carregadas do banco de dados`);
            return resultado.dados;
        }
        return [];
    }
    catch (erro) {
        console.error('❌ Erro ao carregar notificações:', erro);
        return [];
    }
}
async function saveProfileToDatabase(profileData) {
    try {
        const response = await authFetch('/api/perfil', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profileData)
        });
        if (!response.ok) {
            const resultado = await response.json();
            throw new Error(resultado.erro || `Erro na requisição: ${response.status}`);
        }
        const resultado = await response.json();
        if (resultado.sucesso && resultado.dados) {
            console.log('✅ Perfil salvo no banco de dados');
            return resultado.dados;
        }
        throw new Error(resultado.erro || 'Erro ao salvar perfil');
    }
    catch (erro) {
        console.error('❌ Erro ao salvar perfil:', erro);
        throw erro;
    }
}
