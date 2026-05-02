const Service = require('../models/Service');
const ServiceBooking = require('../models/ServiceBooking');

const DEFAULT_SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00'];

const getServices = async (req, res) => {
    try {
        const filter = req.user?.role === 'admin' ? {} : { isActive: true };
        const services = await Service.find(filter).sort({ createdAt: -1 });
        res.status(200).json(services);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createService = async (req, res) => {
    try {
        const { name, description, price, durationMinutes } = req.body;
        const service = await Service.create({
            name,
            description,
            price,
            durationMinutes: durationMinutes || 60,
            image: req.file ? `/uploads/${req.file.filename}` : (req.body.image || '')
        });
        res.status(201).json(service);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const updateService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }

        const { name, description, price, durationMinutes, isActive } = req.body;
        
        if (name) service.name = name;
        if (description !== undefined) service.description = description;
        if (price !== undefined) service.price = price;
        if (durationMinutes !== undefined) service.durationMinutes = durationMinutes;
        if (isActive !== undefined) service.isActive = isActive;
        
        if (req.file) {
            service.image = `/uploads/${req.file.filename}`;
        } else if (req.body.image !== undefined) {
            service.image = req.body.image;
        }

        await service.save();
        res.status(200).json(service);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const deleteService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'Service not found' });
        }
        await service.deleteOne();
        res.status(200).json({ message: 'Service deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }

        const bookings = await ServiceBooking.find({
            service: id,
            bookingDate: date,
            status: 'Booked'
        });

        const bookedSlots = bookings.map((booking) => booking.timeSlot);
        const availableSlots = DEFAULT_SLOTS.filter((slot) => !bookedSlots.includes(slot));

        res.status(200).json({ date, availableSlots, bookedSlots });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createBooking = async (req, res) => {
    try {
        const { date, timeSlot } = req.body;
        const { id } = req.params;

        if (!date || !timeSlot) {
            return res.status(400).json({ message: 'Date and time slot are required' });
        }

        if (!DEFAULT_SLOTS.includes(timeSlot)) {
            return res.status(400).json({ message: 'Invalid time slot' });
        }

        const service = await Service.findById(id);
        if (!service || !service.isActive) {
            return res.status(404).json({ message: 'Service not available' });
        }

        const existing = await ServiceBooking.findOne({
            service: id,
            bookingDate: date,
            timeSlot,
            status: 'Booked'
        });

        if (existing) {
            return res.status(400).json({ message: 'This slot is already booked' });
        }

        const booking = await ServiceBooking.create({
            service: id,
            customer: req.user._id,
            bookingDate: date,
            timeSlot
        });

        const populated = await booking.populate('service customer', 'name email');
        res.status(201).json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getMyBookings = async (req, res) => {
    try {
        const bookings = await ServiceBooking.find({ customer: req.user._id })
            .populate('service', 'name price')
            .sort({ createdAt: -1 });
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateBooking = async (req, res) => {
    try {
        const booking = await ServiceBooking.findById(req.params.bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (String(booking.customer) !== String(req.user._id)) {
            return res.status(403).json({ message: 'You can update only your own bookings' });
        }

        // Check if 1-minute edit window has passed
        const bookingTime = new Date(booking.createdAt);
        const currentTime = new Date();
        const timeDiffInSeconds = (currentTime - bookingTime) / 1000;
        
        console.log('Backend Edit Check:', {
            bookingId: booking._id,
            createdAt: booking.createdAt,
            bookingTime: bookingTime,
            currentTime: currentTime,
            timeDiffInSeconds: timeDiffInSeconds,
            allowedTime: 60
        });
        
        if (timeDiffInSeconds > 60) {
            return res.status(403).json({ message: 'Edit window has expired. You can only edit bookings within 1 minute of booking.' });
        }

        const { bookingDate, timeSlot } = req.body;
        
        if (bookingDate && timeSlot) {
            if (!DEFAULT_SLOTS.includes(timeSlot)) {
                return res.status(400).json({ message: 'Invalid time slot' });
            }

            const existing = await ServiceBooking.findOne({
                _id: { $ne: req.params.bookingId },
                service: booking.service,
                bookingDate,
                timeSlot,
                status: 'Booked'
            });

            if (existing) {
                return res.status(400).json({ message: 'This slot is already booked' });
            }

            booking.bookingDate = bookingDate;
            booking.timeSlot = timeSlot;
        } else if (bookingDate) {
            booking.bookingDate = bookingDate;
        } else if (timeSlot) {
            if (!DEFAULT_SLOTS.includes(timeSlot)) {
                return res.status(400).json({ message: 'Invalid time slot' });
            }

            const existing = await ServiceBooking.findOne({
                _id: { $ne: req.params.bookingId },
                service: booking.service,
                bookingDate: booking.bookingDate,
                timeSlot,
                status: 'Booked'
            });

            if (existing) {
                return res.status(400).json({ message: 'This slot is already booked' });
            }

            booking.timeSlot = timeSlot;
        }

        await booking.save();
        const populated = await booking.populate('service customer', 'name email');
        res.status(200).json(populated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const cancelBooking = async (req, res) => {
    try {
        const booking = await ServiceBooking.findById(req.params.bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (String(booking.customer) !== String(req.user._id)) {
            return res.status(403).json({ message: 'You can cancel only your own bookings' });
        }

        booking.status = 'Cancelled';
        await booking.save();
        res.status(200).json(booking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getServices,
    createService,
    updateService,
    deleteService,
    getAvailability,
    createBooking,
    updateBooking,
    getMyBookings,
    cancelBooking,
    DEFAULT_SLOTS
};
