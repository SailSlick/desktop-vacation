const DbConn = require('./middleware/db');


function checkdb() {
  const host = new DbConn('host');
  console.log(host);
  host.onLoad = () => {
    const check = host.findOne({ username: 'Sully' });
    console.log(check);
  };
}

checkdb();
