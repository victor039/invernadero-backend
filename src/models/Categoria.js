const { DataTypes } = require('sequelize');

const sequelize = require('../config/database');

const Categoria = sequelize.define('categorias', {

    id_categoria: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    nombre_categoria: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },

    descripcion: {
        type: DataTypes.TEXT
    }

}, {
    timestamps: false
});

module.exports = Categoria;