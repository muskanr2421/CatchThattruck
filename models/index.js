const Sequelize = require("sequelize");

// Assuming you have the URI stored in a variable
const dbURI = "mysql://avnadmin:AVNS_xhAlPqkeYAm9jmhPMEa@mysql-f7dd962-cisinlabs-9c72.a.aivencloud.com:21540/CatchThatTruck?ssl-mode=REQUIRED";

const sequelize = new Sequelize(dbURI, {
  logging: false // optional, if you don't want to log SQL queries
});
 
sequelize.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(error => {
    console.error('Unable to connect to the database: ', error);
  });

module.exports = sequelize;
