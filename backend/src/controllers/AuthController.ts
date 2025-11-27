import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../database/connection';
import { EmailService } from '../services/EmailService';
import { createError } from '../middleware/errorHandler';

export class AuthController {
  private emailService = new EmailService();

  register = async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, phoneNumber, country } = req.body;

      // Check if email exists
      const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        throw createError('Email already registered', 400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Generate verification code
      const verificationCode = this.emailService.generateVerificationCode();
      const codeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Create user
      const result = await query(`
        INSERT INTO users (email, password, first_name, last_name, phone_number, country, 
                          preferred_currency, verification_code, verification_code_expires)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, email
      `, [email, hashedPassword, firstName, lastName, phoneNumber, country, 
          country === 'NG' ? 'NGN' : 'KES', verificationCode, codeExpires]);

      // Send verification email
      await this.emailService.sendVerificationEmail(email, verificationCode, 'registration');

      res.status(201).json({
        message: 'Registration successful. Please check your email for verification code.',
        userId: result.rows[0].id
      });
    } catch (error: any) {
      throw createError(error.message || 'Registration failed', 400);
    }
  };

  verifyEmail = async (req: Request, res: Response) => {
    try {
      const { email, code } = req.body;

      const result = await query(`
        SELECT id, verification_code, verification_code_expires 
        FROM users 
        WHERE email = $1 AND email_verified = FALSE
      `, [email]);

      if (result.rows.length === 0) {
        throw createError('User not found or already verified', 400);
      }

      const user = result.rows[0];
      
      if (user.verification_code !== code) {
        throw createError('Invalid verification code', 400);
      }

      if (new Date() > user.verification_code_expires) {
        throw createError('Verification code expired', 400);
      }

      // Verify user and create wallets
      await query('BEGIN');
      
      await query(`
        UPDATE users 
        SET email_verified = TRUE, verification_code = NULL, verification_code_expires = NULL
        WHERE id = $1
      `, [user.id]);

      // Create default wallets
      const currencies = ['NGN', 'KES', 'BTC', 'ETH', 'USDT'];
      for (const currency of currencies) {
        await query(`
          INSERT INTO user_wallets (user_id, currency, balance, locked_balance)
          VALUES ($1, $2, 0, 0)
        `, [user.id, currency]);
      }

      await query('COMMIT');

      res.json({ message: 'Email verified successfully. You can now login.' });
    } catch (error: any) {
      await query('ROLLBACK');
      throw createError(error.message || 'Email verification failed', 400);
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const result = await query(`
        SELECT id, email, password, email_verified, first_name, last_name
        FROM users WHERE email = $1
      `, [email]);

      if (result.rows.length === 0) {
        throw createError('Invalid credentials', 401);
      }

      const user = result.rows[0];

      if (!user.email_verified) {
        throw createError('Please verify your email first', 401);
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw createError('Invalid credentials', 401);
      }

      // Generate login verification code
      const verificationCode = this.emailService.generateVerificationCode();
      const codeExpires = new Date(Date.now() + 10 * 60 * 1000);

      await query(`
        UPDATE users 
        SET verification_code = $1, verification_code_expires = $2
        WHERE id = $3
      `, [verificationCode, codeExpires, user.id]);

      // Send login verification email
      await this.emailService.sendVerificationEmail(email, verificationCode, 'login');

      res.json({
        message: 'Login verification code sent to your email.',
        userId: user.id
      });
    } catch (error: any) {
      throw createError(error.message || 'Login failed', 401);
    }
  };

  verifyLogin = async (req: Request, res: Response) => {
    try {
      const { email, code } = req.body;

      const result = await query(`
        SELECT id, email, first_name, last_name, verification_code, verification_code_expires
        FROM users 
        WHERE email = $1 AND email_verified = TRUE
      `, [email]);

      if (result.rows.length === 0) {
        throw createError('User not found', 400);
      }

      const user = result.rows[0];

      if (user.verification_code !== code) {
        throw createError('Invalid verification code', 400);
      }

      if (new Date() > user.verification_code_expires) {
        throw createError('Verification code expired', 400);
      }

      // Clear verification code
      await query(`
        UPDATE users 
        SET verification_code = NULL, verification_code_expires = NULL
        WHERE id = $1
      `, [user.id]);

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'bpay-test-secret-key-12345';
      const token = jwt.sign(
        { id: user.id, email: user.email },
        jwtSecret,
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name
        }
      });
    } catch (error: any) {
      throw createError(error.message || 'Login verification failed', 400);
    }
  };

  resendCode = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      const result = await query('SELECT id, email_verified FROM users WHERE email = $1', [email]);
      if (result.rows.length === 0) {
        throw createError('User not found', 404);
      }

      const verificationCode = this.emailService.generateVerificationCode();
      const codeExpires = new Date(Date.now() + 10 * 60 * 1000);

      await query(`
        UPDATE users 
        SET verification_code = $1, verification_code_expires = $2
        WHERE email = $3
      `, [verificationCode, codeExpires, email]);

      const type = result.rows[0].email_verified ? 'login' : 'registration';
      await this.emailService.sendVerificationEmail(email, verificationCode, type);

      res.json({ message: 'Verification code sent successfully' });
    } catch (error: any) {
      throw createError(error.message || 'Failed to resend code', 400);
    }
  };
}