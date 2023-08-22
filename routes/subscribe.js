const express = require('express');
const router = express.Router();
const { subscribe } = require('../controller/subcribeController');

router.post('/', subscribe);


module.exports = router;