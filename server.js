const app = require('./src/app');
const sequelize = require('./src/config/database');
require('./src/models');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {

        await sequelize.authenticate();

        if (process.env.DB_SYNC === 'true') {
            await sequelize.sync({ alter: true });
        }

        console.log('Base de datos conectada correctamente');

        app.listen(PORT, () => {
            console.log(`Servidor ejecutándose en puerto ${PORT}`);
        });

    } catch (error) {

        console.error('Error al conectar la base de datos:', error);

    }
}

startServer();
