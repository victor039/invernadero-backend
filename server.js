const app = require('./src/app');
const sequelize = require('./src/config/database');
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
require('./src/models');
require('dotenv').config();
const { Empleado } = require('./src/models');

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

    if (!tablaEmpleados.password_hash) {
        await queryInterface.addColumn('empleados', 'password_hash', {
            type: DataTypes.STRING,
            allowNull: true
        });
    }
}

async function asegurarContrasenasEncriptadas() {
    const empleados = await Empleado.findAll();

    for (const empleado of empleados) {
        const passwordActual = empleado.password_hash || empleado.contraseña || '';

        if (!passwordActual || passwordActual.startsWith('$2')) {
            if (passwordActual && (!empleado.password_hash || empleado.contraseña !== passwordActual)) {
                await empleado.update({
                    contraseña: passwordActual,
                    password_hash: passwordActual
                });
            }

            continue;
        }

        const passwordHash = await bcrypt.hash(passwordActual, 10);
        await empleado.update({
            contraseña: passwordHash,
            password_hash: passwordHash
        });
    }
}

async function startServer() {
    try {

        await sequelize.authenticate();
        await asegurarColumnasVentas();
        await asegurarColumnasEmpleados();
        await asegurarContrasenasEncriptadas();

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
