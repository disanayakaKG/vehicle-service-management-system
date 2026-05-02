const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
    getServices,
    createService,
    updateService,
    deleteService,
    getAvailability,
    createBooking,
    updateBooking,
    getMyBookings,
    cancelBooking
} = require('../controllers/serviceController');

router.get('/', protect, getServices);
router.post('/', protect, adminOnly, upload.single('image'), createService);
router.put('/:id', protect, adminOnly, upload.single('image'), updateService);
router.delete('/:id', protect, adminOnly, deleteService);
router.get('/:id/availability', protect, getAvailability);

router.post('/:id/book', protect, createBooking);
router.put('/bookings/:bookingId', protect, updateBooking);
router.get('/bookings/my', protect, getMyBookings);
router.put('/bookings/:bookingId/cancel', protect, cancelBooking);

module.exports = router;
