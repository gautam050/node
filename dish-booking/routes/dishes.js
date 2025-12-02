const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const ctrl = require('../controllers/dishController');

router.get('/', ctrl.list);
router.get('/:id', ctrl.get);
router.post('/', auth, role('admin'), ctrl.create);
router.put('/:id', auth, role('admin'), ctrl.update);
router.delete('/:id', auth, role('admin'), ctrl.remove);

module.exports = router;
