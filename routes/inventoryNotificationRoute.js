const express = require('express');
const router = express.Router();
const inventoryNotificationController = require('../controllers/inventoryNotificationController');
const authMiddleware = require('../middlewares/authMiddleware');
const accessMiddleware = require('../middlewares/accessMiddleware');

router.use(authMiddleware);

router.use(accessMiddleware(['admin', 'staff']));

router.get('/', inventoryNotificationController.getAllInventoryNotifications);

router.get('/critical', inventoryNotificationController.getCriticalNotifications);

router.get('/summary', inventoryNotificationController.getNotificationSummary);

router.get('/counts', inventoryNotificationController.getNotificationCounts);

router.get('/entity/:entity_type/:entity_id', inventoryNotificationController.getNotificationsByEntity);


router.post('/:notificationId/acknowledge', inventoryNotificationController.acknowledgeNotification);
router.post('/:notificationId/resolve', inventoryNotificationController.resolveNotification);

router.post('/entity/:entity_type/:entity_id/resolve', inventoryNotificationController.resolveNotifications);

router.post('/trigger/:entity_type/:entity_id', inventoryNotificationController.triggerStockCheck);

router.post('/trigger-batch', inventoryNotificationController.triggerBatchStockCheck);

router.delete('/cleanup', inventoryNotificationController.cleanupOldNotifications);

module.exports = router;
