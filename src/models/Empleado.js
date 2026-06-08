const { DataTypes } = require('sequelize')

const sequelize = require('../config/database')

const Empleado = sequelize.define(
    'empleados',
    {

        id_empleado: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        nombre: {
            type: DataTypes.STRING
        },

        apellido: {
            type: DataTypes.STRING
        },

        correo: {
            type: DataTypes.STRING
        },

        telefono: {
            type: DataTypes.STRING
        },

        foto: {
            type: DataTypes.TEXT('long')
        },

        usuario: {
            type: DataTypes.STRING
        },

        contraseña: {
            type: DataTypes.STRING
        },

        id_rol: {
            type: DataTypes.INTEGER
        },

        fecha_registro: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }

    },
    {
        timestamps: false
    }
)

module.exports = Empleado
