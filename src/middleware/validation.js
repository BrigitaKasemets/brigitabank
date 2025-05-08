const { validationResult, check } = require('express-validator');

// Valideerimistulemuste kontrollimine
exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Registreerimise valideerimisreeglid
exports.registerValidation = [
  check('fullName', 'Ees- ja perekonnanimi on kohustuslikud').not().isEmpty(),
  check('username', 'Kasutajanimi on kohustuslik').not().isEmpty(),
  check('password', 'Parool peab olema vähemalt 6 tähemärki pikk').isLength({ min: 6 })
];

// Sisselogimise valideerimisreeglid
exports.loginValidation = [
  check('username', 'Palun sisestage korrektne kasutajanimi').not().isEmpty(),
  check('password', 'Parool on kohustuslik').exists()
];

// Konto loomise valideerimisreeglid
exports.accountValidation = [
  check('currency', 'Valuuta peab olema kas EUR, USD või GBP').isIn(['EUR', 'USD', 'GBP'])
];

// Tehingu valideerimisreeglid
exports.transactionValidation = [
  check('accountFrom', 'Saatja konto number on kohustuslik').not().isEmpty(),
  check('accountTo', 'Saaja konto number on kohustuslik').not().isEmpty(),
  check('amount', 'Summa peab olema positiivne arv').isFloat({ gt: 0 }),
  check('currency', 'Valuuta peab olema kas EUR, USD või GBP').isIn(['EUR', 'USD', 'GBP']),
  check('explanation', 'Selgitus on kohustuslik').not().isEmpty()
];