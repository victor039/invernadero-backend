const multer = require('multer')
const path = require('path')
const fs = require('fs')

// 🔥 crear carpeta si no existe
const uploadPath = path.join(__dirname, '../../uploads')
const perfilesPath = path.join(uploadPath, 'perfiles')

if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true })
}

if (!fs.existsSync(perfilesPath)) {
    fs.mkdirSync(perfilesPath, { recursive: true })
}

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, file.fieldname === 'foto' ? perfilesPath : uploadPath)
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname) || '.jpg'
        cb(
            null,
            `${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`
        )
    }

})

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
})

module.exports = upload
