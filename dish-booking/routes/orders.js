const router = require('express').Router();
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const ctrl = require('../controllers/orderController');

router.post('/', auth, role('user'), ctrl.createOrder);
router.get('/me', auth, role('user'), ctrl.getUserOrders);
router.get('/', auth, role('admin'), ctrl.listAll);
router.patch('/:id/status', auth, role(['chef','admin']), ctrl.updateStatus);

module.exports = router;
