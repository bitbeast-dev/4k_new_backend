// import pkg from 'pg';
// import chalk from 'chalk';

// const { Pool } = pkg;

// // Replace [YOUR-PASSWORD] with your actual password

// const postgresql = "postgresql://postgres.lkvwezsadxzpxnwqlznv:rwandarwejotuyizerehonoreofficalweb1234@aws-1-eu-north-1.pooler.supabase.com:6543/postgres";

// const db = new Pool({
//     connectionString: postgresql,
//     ssl: {
//         rejectUnauthorized: false, // needed for some cloud providers like Supabase
//     },
// });

// db.connect((err) => {
//     if (err) {
//         console.error(chalk.red("Database connection failed: " + err));
//         return;
//     }
//     console.log(chalk.yellow("Database successfully connected"));
// });

// export default db;


// db.js
import { Pool } from 'pg';
import chalk from 'chalk';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL connection string (can also put in .env)
const postgresql =
  "postgresql://postgres.lkvwezsadxzpxnwqlznv:rwandarwejotuyizerehonoreofficalweb1234@aws-1-eu-north-1.pooler.supabase.com:6543/postgres";

// Connect to PostgreSQL
const db = new Pool({
  connectionString: postgresql,
  ssl: { rejectUnauthorized: false }, // required for Supabase
});


export default db;
