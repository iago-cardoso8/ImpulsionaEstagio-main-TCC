const fetch = globalThis.fetch || require('node-fetch');
(async () => {
  try {
    const base = 'http://localhost:3000';
    const now = Date.now();
    const student = { name: 'Test Student '+now, email: `student${now}@example.com`, password: 'password123', role: 'student', course: 'Informática', campus: 'JP' };
    const company = { name: 'Test Company '+now, email: `company${now}@example.com`, password: 'password123', role: 'company' };

    console.log('Registering student...');
    let res = await fetch(base + '/api/auth/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(student) });
    let json = await res.json();
    console.log('Student register status:', res.status, json.erro ? json.erro : 'ok');

    console.log('Logging in student...');
    res = await fetch(base + '/api/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email: student.email, password: student.password }) });
    json = await res.json();
    console.log('Student login status:', res.status);
    if (res.ok) console.log('Student role from API:', json.usuario?.role);

    console.log('Registering company...');
    res = await fetch(base + '/api/auth/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(company) });
    json = await res.json();
    console.log('Company register status:', res.status, json.erro ? json.erro : 'ok');

    console.log('Logging in company...');
    res = await fetch(base + '/api/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email: company.email, password: company.password }) });
    json = await res.json();
    console.log('Company login status:', res.status);
    if (res.ok) console.log('Company role from API:', json.usuario?.role);

    console.log('\nAPI tests finished.');
  } catch (e) {
    console.error('Error in api_test:', e);
    process.exit(1);
  }
})();
