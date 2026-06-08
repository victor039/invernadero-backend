const app = require('./src/app');
const sequelize = require('./src/config/database');
const { DataTypes } = require('sequelize');
require('./src/models');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

async function asegurarColumnasVentas() {
    const queryInterface = sequelize.getQueryInterface();
    const tablaVentas = await queryInterface.describeTable('ventas');
    const columnasNecesarias = {
        tipo_cliente: { type: DataTypes.STRING, defaultValue: 'registrado' },
        cliente_paso: { type: DataTypes.STRING, allowNull: true },
        metodo_pago: { type: DataTypes.STRING, allowNull: true },
        referencia_pago: { type: DataTypes.STRING, allowNull: true },
        ticket_descarga: { type: DataTypes.BOOLEAN, defaultValue: true },
        ticket_correo: { type: DataTypes.BOOLEAN, defaultValue: false },
        correo_ticket: { type: DataTypes.STRING, allowNull: true }
    };

    for (const [columna, definicion] of Object.entries(columnasNecesarias)) {
        if (!tablaVentas[columna]) {
            await queryInterface.addColumn('ventas', columna, definicion);
        }
    }

    await sequelize.query("UPDATE ventas SET tipo_cliente = 'registrado' WHERE tipo_cliente IS NULL");
    await sequelize.query('UPDATE ventas SET ticket_descarga = true WHERE ticket_descarga IS NULL');
    await sequelize.query('UPDATE ventas SET ticket_correo = false WHERE ticket_correo IS NULL');
}

async function asegurarColumnasEmpleados() {
    const queryInterface = sequelize.getQueryInterface();
    const tablaEmpleados = await queryInterface.describeTable('empleados');

    if (!tablaEmpleados.foto) {
        await queryInterface.addColumn('empleados', 'foto', {
            type: DataTypes.TEXT('long'),
            allowNull: true
        });
        return;
    }

    await queryInterface.changeColumn('empleados', 'foto', {
        type: DataTypes.TEXT('long'),
        allowNull: true
    });
}

async function startServer() {
    try {

        await sequelize.authenticate();
        await asegurarColumnasVentas();
        await asegurarColumnasEmpleados();

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
