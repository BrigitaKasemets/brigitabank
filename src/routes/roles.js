const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');


router.get('/', auth, roleController.getAllRoles);

router.get('/:id', auth, roleController.getRoleById);


router.post('/',
    auth,
    [
        check('name', 'Role name is required').not().isEmpty(),
        check('permissions', 'Permissions must be an array').optional().isArray()
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    roleController.createRole
);


router.put('/:id',
    auth,
    [
        check('permissions', 'Permissions must be an array').optional().isArray()
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    roleController.updateRole
);


router.delete('/:id', auth, roleController.deleteRole);


router.post('/assign',
    auth,
    [
        check('userId', 'User ID is required').not().isEmpty(),
        check('roleId', 'Role ID is required').not().isEmpty()
    ],
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    },
    roleController.assignRoleToUser
);

module.exports = router;