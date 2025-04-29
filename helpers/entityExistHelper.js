const checkEntityExist = (entity, res, status = 404, message = 'Not found') => {
    if (!entity) {
        res.status(status);
        throw new Error(message);
    }
};

module.exports = checkEntityExist;

// Not sure if I will add more here
