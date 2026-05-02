const mongoose = require('mongoose');

const serviceBookingSchema = new mongoose.Schema({
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bookingDate: {
        type: String,
        required: true
    },
    timeSlot: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Booked', 'Cancelled'],
        default: 'Booked'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ServiceBooking', serviceBookingSchema);
