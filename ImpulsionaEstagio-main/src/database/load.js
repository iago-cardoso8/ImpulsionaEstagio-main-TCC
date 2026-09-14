/**
 * ── CARREGADOR DE BANCO DE DADOS ────────────────────────────
 * Responsável por inicializar e carregar o banco de dados
 * ──────────────────────────────────────────────────────────────
 */

const db = require('./database');
const { runMigration } = require('./migration');
const { runSeeders } = require('./seeders');
src/controllers
/**
 * Inicializa o banco de dados completamente
 * Executa migrations e seeders
 */
function initializeDatabase() {
    console.log('🔄 Inicializando banco de dados...');
    
    try {
        // Executa as migrações
        runMigration();
        console.log('✅ Migrações executadas com sucesso');
        
        // Executa os seeders
        runSeeders();
        console.log('✅ Seeders executados com sucesso');
        
        console.log('✅ Banco de dados inicializado!');
        return true;
    } catch (erro) {
        console.error('❌ Erro ao inicializar banco de dados:', erro);
        return false;
    }
}

/**
 * Retorna a instância do banco de dados
 */
function getDatabase() {
    return db;
}

/**
 * Verifica a saúde do banco de dados
 */
function checkDatabaseHealth() {
    try {
        const result = db.prepare('SELECT COUNT(*) as count FROM vagas').get();
        console.log(`✅ Banco de dados saudável. Total de vagas: ${result.count}`);
        return true;
    } catch (erro) {
        console.error('❌ Erro na saúde do banco de dados:', erro);
        return false;
    }
}

module.exports = {
    initializeDatabase,
    getDatabase,
    checkDatabaseHealth
};
