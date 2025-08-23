import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { AuthUser } from '../types/mongodb';
import logger from '../utils/logger';

export class AuthService {
  async register(email: string, password: string, name: string): Promise<AuthUser> {
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new Error('User already exists');
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await User.create({
        email,
        password: hashedPassword,
        name,
      }) as IUser;

      logger.info('User registered successfully', { userId: user._id, email });

      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      };
    } catch (error) {
      logger.error('Registration failed', { email, error });
      throw error;
    }
  }

  async login(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
    try {
      const user = await User.findOne({ email }) as IUser | null;
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      const token = jwt.sign(
        { userId: user._id.toString(), email: user.email, role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
      );

      logger.info('User logged in successfully', { userId: user._id, email });

      return {
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      };
    } catch (error) {
      logger.error('Login failed', { email, error });
      throw error;
    }
  }

  async getUserById(id: string): Promise<AuthUser | null> {
    try {
      const user = await User.findById(id) as IUser | null;
      if (!user) return null;

      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      };
    } catch (error) {
      logger.error('Failed to get user by ID', { id, error });
      return null;
    }
  }
}