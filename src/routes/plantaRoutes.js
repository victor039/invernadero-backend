const express = require('express')
const router = express.Router()

const authMiddleware = require('../middlewares/authMiddleware')
const upload = require('../config/multer')

const {
    crearPlanta,
    obtenerPlantas,
    obtenerPlanta,
    actualizarPlanta,
    eliminarPlanta
} = require('../controllers/plantaController')

// ✅ CREAR (con imagen)
router.post(
    '/',
    authMiddleware,
    upload.single('imagen'),
    crearPlanta
)

// GET
router.get('/', obtenerPlantas)
router.get('/:id', obtenerPlanta)

// ❌ AQUÍ ESTABA EL ERROR (faltaba upload)
router.put(
    '/:id',
    authMiddleware,
    upload.single('imagen'),
    actualizarPlanta
)

// DELETE
router.delete('/:id', authMiddleware, eliminarPlanta)

module.exports = router