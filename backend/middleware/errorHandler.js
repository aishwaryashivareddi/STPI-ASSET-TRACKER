import logger from '../config/logger.js';

const handleDuplicateFieldsDB = (err) => {
  const field = err.message.match(/(["'])(\\?.)*?\1/)[0];
  return { message: `Duplicate field value: ${field}. Please use another value!`, statusCode: 400 };
};

const handleValidationErrorDB = (err) => {
  return { message: 'Invalid input data', statusCode: 400 };
};

const handleJWTError = () => {
  return { message: 'Invalid token. Please log in again!', statusCode: 401 };
};

const handleJWTExpiredError = () => {
  return { message: 'Your token has expired! Please log in again.', statusCode: 401 };
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  } else {
    logger.error('ERROR 💥', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong!',
    });
  }
};

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err, message: err.message };

    if (err.code === 'ER_DUP_ENTRY') error = handleDuplicateFieldsDB(err);
    if (err.code === 'ER_BAD_FIELD_ERROR') error = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

export default errorHandler;
