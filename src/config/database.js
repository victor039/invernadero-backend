const { Sequelize } = require('sequelize');
require('dotenv').config();

const dialect = process.env.DB_DIALECT || (process.env.DATABASE_URL ? 'postgres' : 'mysql')
const usarSSL = process.env.DB_SSL !== 'false'

const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect,
        protocol: 'postgres',
        dialectOptions: usarSSL ? {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        } : {},
        logging: process.env.DB_LOGGING === 'true' ? console.log : false
    })
    : new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
            host: process.env.DB_HOST,
            dialect,
            port: process.env.DB_PORT,
            logging: process.env.DB_LOGGING === 'true' ? console.log : false
        }
    );

module.exports = sequelize;
