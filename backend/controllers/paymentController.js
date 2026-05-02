const crypto = require('crypto');

// @desc    Create PayHere sandbox session payload
// @route   POST /api/payments/payhere/session
// @access  Private
const createPayHereSession = async (req, res) => {
    try {
        const {
            orderId,
            amount,
            currency = 'LKR',
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress
        } = req.body || {};

        const merchantId = process.env.PAYHERE_MERCHANT_ID;
        const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

        if (!merchantId || !merchantSecret) {
            return res.status(500).json({
                message: 'PayHere sandbox is not configured. Set PAYHERE_MERCHANT_ID and PAYHERE_MERCHANT_SECRET.'
            });
        }

        if (!orderId || !amount || !customerName || !customerEmail) {
            return res.status(400).json({ message: 'Missing required PayHere session fields' });
        }

        const parsedAmount = Number(amount);
        if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const amountString = parsedAmount.toFixed(2);
        const secretHash = crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase();
        const hash = crypto
            .createHash('md5')
            .update(`${merchantId}${orderId}${amountString}${currency}${secretHash}`)
            .digest('hex')
            .toUpperCase();

        const [firstName, ...restNames] = String(customerName).trim().split(' ');
        const lastName = restNames.join(' ') || '-';

        const payload = {
            sandbox: true,
            merchant_id: merchantId,
            return_url: 'https://example.com/payhere-return',
            cancel_url: 'https://example.com/payhere-cancel',
            notify_url: 'https://example.com/payhere-notify',
            order_id: orderId,
            items: `Order ${orderId}`,
            currency,
            amount: amountString,
            first_name: firstName || customerName,
            last_name: lastName,
            email: customerEmail,
            phone: customerPhone || '',
            address: shippingAddress || '',
            city: 'Colombo',
            country: 'Sri Lanka',
            hash
        };

        return res.status(200).json({
            checkoutUrl: 'https://sandbox.payhere.lk/pay/checkout',
            payload
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createPayHereSession
};
