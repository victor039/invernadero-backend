const Rol = require('./Rol');
const Empleado = require('./Empleado');
const Categoria = require('./Categoria');
const Proveedor = require('./Proveedor');
const Planta = require('./Planta');
const Cliente = require('./Cliente');
const Venta = require('./Venta');
const DetalleVenta = require('./DetalleVenta');
const Envio = require('./Envio');
const Inventario = require('./Inventario');
const Usuario = require('./Usuario');

Rol.hasMany(Empleado, {
    foreignKey: 'id_rol'
});

Empleado.belongsTo(Rol, {
    foreignKey: 'id_rol'
});

module.exports = {
    Rol,
    Empleado,
    Categoria,
    Proveedor,
    Planta,
    Cliente,
    Venta,
    DetalleVenta,
    Envio,
    Inventario,
    Usuario
};
