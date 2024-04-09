const mysql = require("mysql2/promise"); // Import mysql2 promise-based version

const hostname = "6x2.h.filess.io";
const database = "Catchthat_onestemsas";
const port = "3307";
const username = "Catchthat_onestemsas";
const password = "928dc6adb8a44fb5952f7ee1016ceb09b547d1dc";

async function main() {
  try {
    const connection = await mysql.createConnection({
      host: hostname,
      user: username,
      password: password,
      database: database,
      port: port,
    });

    console.log("Connected to MySQL!");

    // Run your queries here
    const [rows, fields] = await connection.execute("SELECT 1+1");
    console.log(rows); // Output the result
  } catch (error) {
    console.error("Error connecting to MySQL:", error);
  }
}

main();
