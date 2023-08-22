const express = require('express');
const router = express.Router();
const { checkPosition } = require('../controller/subcribeController');

router.post('/', checkPosition);

module.exports = router;