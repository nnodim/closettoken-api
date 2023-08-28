const User = require('../model/user');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const handleRefreshToken = async (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) {
      return res.sendStatus(401);
    }
  
    const refreshToken = cookies.jwt;
  
    const user = await User.findOne({ refresh_token: refreshToken }).exec();

    if (!user) {
      return res.sendStatus(403);
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      if (user.email !== decoded.email) {
        return res.sendStatus(403);
      }
  
      const accessToken = jwt.sign({ email: user.email }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h',
      });
  
      res.json({ accessToken, position: user.position, email: user.email });
    } catch (err) {
      return res.sendStatus(403);
    }
  };

module.exports = {
    handleRefreshToken
}