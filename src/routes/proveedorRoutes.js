const express = require('express')

const router = express.Router()

const authMiddleware = require('../middlewares/authMiddleware')

const {
    crearProveedor,
    obtenerProveedores,
    actualizarProveedor,
    eliminarProveedor
} = require('../controllers/proveedorController')

/* =========================
   CREAR PROVEEDOR (PROTEGIDO)
========================= */
router.post(
    '/',
    authMiddleware,
    crearProveedor
)

/* =========================
   OBTENER PROVEEDORES (PÚBLICO)
   para mostrar en selects del frontend
========================= */
router.get(
    '/',
    obtenerProveedores
)

router.put(
    '/:id',
    authMiddleware,
    actualizarProveedor
)

router.delete(
    '/:id',
    authMiddleware,
    eliminarProveedor
)

module.exports = router
