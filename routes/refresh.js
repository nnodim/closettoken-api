const express = require('express');
const router = express.Router();
const { handleRefreshToken } = require('../controller/refreshTokenController');

router.get('/', handleRefreshToken);

module.exports = router;