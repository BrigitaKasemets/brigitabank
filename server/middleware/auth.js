const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Hangi autoriseermistunnus p�isest
  const token = req.header('x-auth-token');

  // Kontrolli, kas token on olemas
  if (!token) {
    return res.status(401).json({ msg: 'Autoriseerimine eba�nnestus, token puudub' });
  }

  try {
    // Valideeri token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lisa kasutaja info p�ringule
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token ei kehti' });
  }
};