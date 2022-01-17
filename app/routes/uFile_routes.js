const express = require('express')
const passport = require('passport')
const multer = require('multer')
const fs = require('fs')
const path = require('path')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

const upload = multer({storage: storage})

const File = require('../models/file')

const requireToken = passport.authenticate('bearer', { session: false })

const router = express.Router()

router.post('/files', requireToken, upload.single('file'), (req, res, next) => {
  File.create({
    name: req.file.filename,
    fieldName: req.file.fieldname,
    encoding: req.file.encoding,
    mimetype: req.file.mimetype,
    destination: req.file.destination,
    originalName: req.file.originalname,
    path: req.file.path,
    size: req.file.size,
    owner: req.user._id
  })
    .then(() => res.status(201).send('File uploaded successfully! '))
    .catch(next)
})

router.get('/files/:id', requireToken, (req, res, next) => {
  File.findOne({ _id: req.params.id, owner: req.user.id })
    .then(file => res.status(201).json(file))
    .catch(next)
})

router.get('/files', requireToken, (req, res, next) => {
  File.find({ owner: req.user.id })
    .then(file => res.status(201).json(file))
    .catch(next)
})

router.get('/download/:id', requireToken, function (req, res) {
  File.findOne({ _id: req.params.id, owner: req.user.id })
    .then(file => {
      console.log(file.path)
      res.setHeader('Content-disposition', 'attachment; filename=' + file.filename)
      res.setHeader('Content-type', file.mimetype)
      const fileStream = fs.createReadStream(file.path)
      fileStream.pipe(res)
    })
})

router.patch('/files/:id', requireToken, (req, res, next) => {
  File.findOne({ _id: req.params.id, owner: req.user.id })
    .then(file => {
      const newName = req.body.name + path.parse(file.originalName).ext
      const newPath = 'uploads/' + req.body.name + path.parse(file.originalName).ext
      fs.renameSync('uploads/New-Name.png', newPath)
      return File.findOneAndUpdate({ _id: req.params.id, owner: req.user.id }, { name: newName, path: newPath })
    })
    .then(file => res.status(200).json(file))
    .catch(next)
})

router.delete('/files/:id', requireToken, (req, res, next) => {
  File.deleteOne({ _id: req.params.id, owner: req.user._id })
    .then(file => {
      // fs.unlink(file.path)
      res.status(201).json(file)
    })
    .catch(next)
})

module.exports = router
