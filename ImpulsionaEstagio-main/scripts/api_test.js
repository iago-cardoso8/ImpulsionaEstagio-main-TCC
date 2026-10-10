const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { after, before, test } = require('node:test');

const root = path.resolve(__dirname, '..');
const dbName = `test-${process.pid}.db`;
const databaseUrl = `file:./${dbName}`;
const jwtSecret = `automated-test-secret-${process.pid}-must-be-over-32`;
let server;
let baseUrl;
let companyToken;
let otherCompanyToken;
let studentToken;
let companyId;
let jobId;
let candidatureId;
let stderr = '';

function report(scenario, expected, actual) {
  console.log(`CENÁRIO: ${scenario} | Esperado: ${expected} | Obtido: ${actual}`);
  assert.equal(actual, expected, scenario);
}

async function request(route, { method = 'GET', token, body } = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { response, data: await response.json() };
}

async function freePort() {
  return new Promise((resolve, reject) => {
    const listener = net.createServer();
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', () => {
      const address = listener.address();
      listener.close(error => error ? reject(error) : resolve(address.port));
    });
  });
}

before(async () => {
  const port = await freePort();
  baseUrl = `http://127.0.0.1:${port}`;
  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    NODE_ENV: 'test',
    PORT: String(port),
  };
  execFileSync(path.join(root, 'node_modules/.bin/prisma'), ['migrate', 'deploy'], {
    cwd: root,
    env,
    stdio: 'inherit',
  });
  server = spawn(process.execPath, ['-r', 'dotenv/config', '-r', 'ts-node/register', 'server.ts'], {
    cwd: root,
    env,
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  server.stderr.on('data', chunk => { stderr += chunk.toString(); });

  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`API não iniciou: ${stderr}`);
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  throw new Error(`Timeout iniciando API: ${stderr}`);
});

after(async () => {
  if (server && server.exitCode === null) {
    server.kill('SIGTERM');
    await new Promise(resolve => server.once('exit', resolve));
  }
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    const file = path.join(root, 'prisma', dbName + suffix);
    if (fs.existsSync(file)) fs.rmSync(file);
  }
});

test('Fluxos de autenticação, permissões, vagas, perfil, notificações e candidaturas', async t => {
  const stamp = `${Date.now()}-${process.pid}`;
  const company = { name: 'Empresa de Teste', email: `empresa-${stamp}@example.com`, password: 'senha1234', role: 'company' };
  const otherCompany = { name: 'Outra Empresa', email: `outra-${stamp}@example.com`, password: 'senha1234', role: 'company' };
  const student = { name: 'Estudante de Teste', email: `estudante-${stamp}@example.com`, password: 'senha1234', role: 'student', course: 'Informática', campus: 'João Pessoa' };

  await t.test('recusa registro inválido e permite registro válido', async () => {
    let result = await request('/api/auth/register', { method: 'POST', body: { name: '', email: 'invalido', password: '123' } });
    report('Registro inválido', 400, result.response.status);
    result = await request('/api/auth/register', { method: 'POST', body: company });
    report('Registro de empresa', 201, result.response.status);
    companyToken = result.data.token;
    companyId = result.data.usuario.id;
    result = await request('/api/auth/register', { method: 'POST', body: student });
    report('Registro de estudante', 201, result.response.status);
    studentToken = result.data.token;
    result = await request('/api/auth/register', { method: 'POST', body: otherCompany });
    report('Registro da segunda empresa', 201, result.response.status);
    otherCompanyToken = result.data.token;
  });

  await t.test('impede e-mail duplicado e login inválido', async () => {
    let result = await request('/api/auth/register', { method: 'POST', body: company });
    report('E-mail duplicado', 409, result.response.status);
    result = await request('/api/auth/login', { method: 'POST', body: { email: student.email, password: 'incorreta' } });
    report('Credenciais inválidas', 401, result.response.status);
    result = await request('/api/auth/login', { method: 'POST', body: { email: student.email, password: student.password } });
    report('Login válido de estudante', 200, result.response.status);
    studentToken = result.data.token;
  });

  await t.test('protege rotas e aplica permissões por papel', async () => {
    let result = await request('/api/perfil');
    report('Perfil sem token', 401, result.response.status);
    result = await request('/api/vagas', { method: 'POST', token: studentToken, body: { title: 'Vaga inválida' } });
    report('Estudante tenta cadastrar vaga', 403, result.response.status);
    result = await request('/api/rota-inexistente');
    report('Rota inexistente da API', 404, result.response.status);
    assert.equal(result.data.sucesso, false);
  });

  await t.test('cria, atualiza, protege e exclui vaga pelo dono', async () => {
    const body = { title: 'Estágio de Teste', company: 'Ignorada pelo servidor', email: company.email, location: 'João Pessoa - PB', salary: 'R$ 900,00', target: 'Informática', desc: 'Teste automatizado' };
    let result = await request('/api/vagas', { method: 'POST', token: companyToken, body });
    report('Empresa cria vaga', 201, result.response.status);
    jobId = result.data.dados.id;
    assert.equal(result.data.dados.usuarioId, companyId);
    assert.equal(result.data.dados.company, company.name);
    result = await request(`/api/vagas/${jobId}`, { method: 'PUT', token: otherCompanyToken, body: { title: 'Alteração indevida' } });
    report('Outra empresa tenta editar vaga', 403, result.response.status);
    result = await request(`/api/vagas/${jobId}`, { method: 'PUT', token: companyToken, body: { title: 'Estágio atualizado' } });
    report('Dono atualiza vaga', 200, result.response.status);
    result = await request(`/api/vagas/${jobId}`, { method: 'DELETE', token: companyToken });
    report('Dono exclui vaga', 200, result.response.status);
  });

  await t.test('valida e atualiza perfil de estudante', async () => {
    let result = await request('/api/perfil', { method: 'PUT', token: studentToken, body: { name: '' } });
    report('Perfil inválido não é gravado', 400, result.response.status);
    result = await request('/api/perfil', { method: 'PUT', token: studentToken, body: { name: student.name, email: student.email, course: student.course, campus: student.campus, status: 'Disponível' } });
    report('Estudante atualiza perfil', 200, result.response.status);
    result = await request('/api/perfil', { method: 'PUT', token: otherCompanyToken, body: { name: '', email: '' } });
    report('Perfil de empresa com campos vazios', 400, result.response.status);
    result = await request('/api/perfil', { method: 'PUT', token: otherCompanyToken, body: { name: otherCompany.name, email: otherCompany.email } });
    report('Empresa cria perfil com campos obrigatórios', 200, result.response.status);
  });

  await t.test('restringe notificações a empresas', async () => {
    let result = await request('/api/notificacoes', { token: studentToken });
    report('Estudante acessa notificações', 403, result.response.status);
    result = await request('/api/notificacoes', { method: 'POST', token: studentToken, body: { title: 'Proibida', message: 'Proibida', time: 'Agora' } });
    report('Estudante cria notificação', 403, result.response.status);
    result = await request('/api/notificacoes', { token: companyToken });
    report('Empresa lista notificações', 200, result.response.status);
    result = await request('/api/notificacoes', { method: 'POST', token: companyToken, body: { title: 'Aviso de teste', message: 'Mensagem', time: 'Agora' } });
    report('Empresa cria notificação', 201, result.response.status);
  });

  await t.test('candidaturas são individuais e status fica sob controle da empresa dona', async () => {
    const job = await request('/api/vagas', { method: 'POST', token: companyToken, body: { title: 'Vaga para candidatura', company: company.name, email: company.email, location: 'João Pessoa - PB', salary: 'A combinar', target: 'Informática' } });
    report('Empresa cria vaga para candidatura', 201, job.response.status);
    jobId = job.data.dados.id;
    let result = await request(`/api/vagas/${jobId}/candidaturas`, { method: 'POST', token: companyToken });
    report('Empresa tenta se candidatar', 403, result.response.status);
    result = await request(`/api/vagas/${jobId}/candidaturas`, { method: 'POST', token: studentToken });
    report('Estudante envia candidatura', 201, result.response.status);
    candidatureId = result.data.dados.id;
    assert.equal(Object.hasOwn(result.data.dados.usuario, 'passwordHash'), false);
    result = await request(`/api/vagas/${jobId}/candidaturas`, { method: 'POST', token: studentToken });
    report('Candidatura duplicada', 409, result.response.status);
    result = await request('/api/candidaturas/minhas', { token: studentToken });
    report('Estudante lista candidaturas próprias', 200, result.response.status);
    assert.equal(result.data.dados.length, 1);
    result = await request(`/api/vagas/${jobId}/candidaturas`, { token: otherCompanyToken });
    report('Outra empresa lista candidaturas', 403, result.response.status);
    result = await request(`/api/vagas/${jobId}/candidaturas`, { token: companyToken });
    report('Dona da vaga lista candidaturas', 200, result.response.status);
    result = await request(`/api/candidaturas/${candidatureId}/status`, { method: 'PATCH', token: companyToken, body: { status: 'Aceito' } });
    report('Dona atualiza status', 200, result.response.status);
    result = await request(`/api/candidaturas/${candidatureId}/status`, { method: 'PATCH', token: studentToken, body: { status: 'Rejeitado' } });
    report('Estudante tenta alterar status', 403, result.response.status);
  });

  await t.test('limita tentativas de autenticação', async () => {
    let result;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      result = await request('/api/auth/login', { method: 'POST', body: { email: `inexistente-${attempt}@example.com`, password: 'invalida' } });
      assert.equal(result.response.status, 401);
    }
    result = await request('/api/auth/login', { method: 'POST', body: { email: 'bloqueado@example.com', password: 'invalida' } });
    report('Tentativa excedente de login', 429, result.response.status);
  });
});
