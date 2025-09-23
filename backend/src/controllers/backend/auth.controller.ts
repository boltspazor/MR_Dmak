import { Request, Response } from 'express';
import { AuthService } from '../../services/auth.service';
import { schemas } from '../../utils/validation';
import logger from '../../utils/logger';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const { error, value } = schemas.user.register.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
      }

      const user = await authService.register(value.email, value.password, value.name);
      return res.status(201).json({ 
        message: 'User registered successfully',
        user 
      });
    } catch (error: any) {
      logger.error('Registration failed', { error: error.message, body: req.body });
      return res.status(400).json({ error: error.message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { error, value } = schemas.user.login.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
      }

      const result = await authService.login(value.email, value.password);
      return res.json(result);
    } catch (error: any) {
      logger.error('Login failed', { error: error.message, email: req.body.email });
      return res.status(401).json({ error: error.message });
    }
  }

  async me(req: any, res: Response) {
    try {
      const user = await authService.getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json({ user });
    } catch (error: any) {
      logger.error('Failed to get current user', { error: error.message });
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  async refreshToken(req: any, res: Response) {
    try {
      // Generate new token for the user
      const result = await authService.login(req.user.email, ''); // This is a simplified approach
      return res.json({ token: result.token });
    } catch (error: any) {
      logger.error('Token refresh failed', { error: error.message });
      return res.status(401).json({ error: 'Failed to refresh token' });
    }
  }
}