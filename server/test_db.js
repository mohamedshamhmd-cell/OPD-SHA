const initSqlJs = require('sql.js');

async function test() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run('CREATE TABLE test (id INT, name TEXT);');
  db.run('INSERT INTO test VALUES (?, ?);', [1, 'Hospital Test']);
  const res = db.exec('SELECT * FROM test;');
  console.log('SUCCESS:', res);
}

test().catch(console.error);
