const regexValidation = (fields) => {
    return (req, res, next) => {
        const { username, email, password } = req.body;

        // Validate input fields
        for (let field of fields) {
            if (!req.body[field]) {
                res.status(400);
                return next(new Error(`Please provide a valid ${field}`));
            }
        }

        // Regex validation
        if (fields.includes('username')) {
            const usernameRegex = /^[a-zA-Z][A-Za-z0-9-_]{7,15}$/;
            if (!usernameRegex.test(username)) {
                res.status(400);
                return next(
                    new Error(
                        'Username must be 8-15 characters long and contain only alphanumeric characters, hyphens, and underscores.'
                    )
                );
            }
        }

        if (fields.includes('password' || 'newPassword')) {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])[A-Za-z\d]{8,}$/;
            if (!passwordRegex.test(password)) {
                res.status(400);
                return next(
                    new Error(
                        'Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, and one number.'
                    )
                );
            }
        }

        if (fields.includes('email')) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                res.status(400);
                return next(new Error('Please provide a valid email address.'));
            }
        }
        next();
    };
};

module.exports = { regexValidation };
