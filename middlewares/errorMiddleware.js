const errorMiddleware = (err, req, res, next) => {
  const statusCode =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  console.error(`Error: ${err.message}`);
  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorMiddleware;
