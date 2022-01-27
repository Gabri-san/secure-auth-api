var mysql = require('mysql');
var conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'secure_auth'
}); 
 
conn.connect(function(err) {
  if (err) throw err;
  console.log('Connexion à la bdd réussie.');
});
module.exports = conn;