const express = require('express');
const router = express.Router();
const { logout } = require('../controller/subcribeController'); 

router.get('/', logout);

module.exports = router;