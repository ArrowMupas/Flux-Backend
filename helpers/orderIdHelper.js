const generateOrderId = () => {
    const prefix = 'ALAS';
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2); // last two digits of year

    const randomNum = Math.floor(Math.random() * 1_000_000)
        .toString()
        .padStart(6, '0');

    return `${prefix}${mm}${dd}${yy}${randomNum}`; // e.g. ALAS052525004321
};

module.exports = { generateOrderId };
