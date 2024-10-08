const AppError = require("./../utils/appError");
const express = require("express");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please login again!", 401);

const handleTokenExpiredError = () =>
  new AppError("Token expired. Please login again!", 401);

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong",
      msg: err.message,
    });
  }
};

const sendErrorProd = (err, req, result) => {
  if (req.originalUrl.startsWith("/api")) {
    //Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
      //Programming or other error: don't leak error details
    }
      //Log err
      console.error("Error", err);

      //Send Generic message
      return res.status(500).json({
        status: err.status,
        message: "Something went very wrong",
      });
  }
    if (err.isOperational) {
        res.status(err.statusCode).render("error", {
            title: "Something went wrong",
            msg: err.message,
          });
        //Programming or other error: don't leak error details
      } else {
        //Log err
        console.error("Error", err);
  
        //Send Generic message
        res.status(err.statusCode).render("error", {
            title: "Something went wrong",
            msg: 'Please try again later.'
          });
      }
};

module.exports = (err, req, res, next) => {
  //console.log(err.stack)
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    error.message = err.message;
    
    if (error.name === "CastError") error = handleCastErrorDB(err);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === "ValidationError")
      error = handleValidationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleTokenExpiredError();
    sendErrorProd(error, req, res);
  }
};
