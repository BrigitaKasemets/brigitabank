const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Hangi autoriseermistunnus päisest
  const token = req.header('x-auth-token');

  // Kontrolli, kas token on olemas
  if (!token) {
    return res.status(401).json({ msg: 'Autoriseerimine ebaõnnestus, token puudub' });
  }

  try {
    // Valideeri token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lisa kasutaja info päringule
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token ei kehti' });
  }
};