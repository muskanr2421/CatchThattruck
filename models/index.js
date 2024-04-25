const Sequelize = require("sequelize");

// Assuming you have the URI stored in a variable
const dbURI = "mysql://avnadmin:AVNS_xhAlPqkeYAm9jmhPMEa@mysql-f7dd962-cisinlabs-9c72.a.aivencloud.com:21540/CatchThatTruck?ssl-mode=REQUIRED";

const sequelize = new Sequelize(dbURI, {
  logging: false, // optional, if you don't want to log SQL queries
  pool: {
    max: 5, // Maximum number of connection in pool
    min: 0, // Minimum number of connection in pool
    acquire: 30000, // The maximum time, in milliseconds, that pool will try to get connection before throwing error
    idle: 10000 // The maximum time, in milliseconds, that a connection can be idle before being released
  }
});
 
sequelize.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(error => {
    console.error('Unable to connect to the database: ', error);
  });

module.exports = sequelize;