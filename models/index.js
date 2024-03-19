const Sequelize = require("sequelize");

const dbConfig = require("../config/config.json");

const sequelize = new Sequelize(
  dbConfig.test.database,
  dbConfig.test.username,
  dbConfig.test.password,
  {
    host: dbConfig.test.host,
    dialect: 'mysql',
    logging: false
  },
 
);

sequelize.authenticate().then(() => {
  console.log('Connection has been established successfully.');
}).catch((error) => {
  console.error('Unable to connect to the database: ', error);
});

module.exports = sequelize;
