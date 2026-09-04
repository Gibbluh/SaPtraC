// Centralized error handler middleware for Express
const mongoose = require('mongoose');

function errorHandler(err, req, res, next) {

  console.error("=== ERROR HANDLER ===");
  console.error(err);

  let statusCode = err.status || 500;
  let message = err.message || "Internal Server Error";
  let errors = null;

  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = 'Validation error';
    errors = Object.values(err.errors).map(e => e.message);
  }

  // Mongoose bad ObjectId
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Duplicate key error (MongoServerError)
  if (err.code && err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}`;
  }

  // Express-validator errors (from validation middleware)
  if (err.errors && Array.isArray(err.errors)) {
    statusCode = 400;
    message = 'Validation error';
    errors = err.errors.map(e => e.msg || e.message);
  }

  // Hide stack/message in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Something went wrong.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
}

module.exports = errorHandler;
