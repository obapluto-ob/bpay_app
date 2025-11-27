import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createError } from './errorHandler';

const registrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match'
  }),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  phoneNumber: Joi.string().min(10).max(15).required(),
  country: Joi.string().valid('NG', 'KE').required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const verificationSchema = Joi.object({
  email: Joi.string().email().required(),
  code: Joi.string().length(6).pattern(/^\d+$/).required()
});

const tradeSchema = Joi.object({
  type: Joi.string().valid('buy', 'sell').required(),
  fromCurrency: Joi.string().required(),
  toCurrency: Joi.string().required(),
  fromAmount: Joi.number().positive().required(),
  paymentMethod: Joi.string().valid('bank_transfer', 'mobile_money', 'crypto_wallet').required(),
  paymentDetails: Joi.object().required()
});

export const validateRegistration = (req: Request, res: Response, next: NextFunction) => {
  const { error } = registrationSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }
  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }
  next();
};

export const validateVerification = (req: Request, res: Response, next: NextFunction) => {
  const { error } = verificationSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }
  next();
};

export const validateTrade = (req: Request, res: Response, next: NextFunction) => {
  const { error } = tradeSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }
  next();
};