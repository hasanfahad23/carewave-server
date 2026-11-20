import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { getUsersCollection } from '../config/db';
import { generateToken } from '../middleware/auth';
import { AuthRequest, IUser } from '../types';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, photoURL, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Name, email, and password are required fields.' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
      return;
    }

    // Password validation rule from prompt:
    // "must have an uppercase letter, a lowercase letter, and a length of at least 6 characters"
    if (password.length < 6) {
      res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
      return;
    }
    if (!/[A-Z]/.test(password)) {
      res.status(400).json({ success: false, message: 'Password must contain at least one uppercase letter.' });
      return;
    }
    if (!/[a-z]/.test(password)) {
      res.status(400).json({ success: false, message: 'Password must contain at least one lowercase letter.' });
      return;
    }

    const usersCol = getUsersCollection();
    const existingUser = await usersCol.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser: IUser = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      photoURL: photoURL?.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
      provider: 'credentials',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCol.insertOne(newUser);
    const userId = result.insertedId.toString();

    const token = generateToken({
      id: userId,
      email: newUser.email,
      name: newUser.name
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully! Welcome to CareWave.',
      token,
      user: {
        id: userId,
        name: newUser.name,
        email: newUser.email,
        photoURL: newUser.photoURL
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.', error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const usersCol = getUsersCollection();
    const user = await usersCol.findOne({ email: email.toLowerCase().trim() });

    if (!user || !user.password) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const userId = (user._id || '').toString();
    const token = generateToken({
      id: userId,
      email: user.email,
      name: user.name
    });

    res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.', error: error.message });
  }
};

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, photoURL } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'Google authentication requires email.' });
      return;
    }

    const usersCol = getUsersCollection();
    let user = await usersCol.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      const newUser: IUser = {
        name: name || email.split('@')[0],
        email: email.toLowerCase().trim(),
        photoURL: photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || email)}`,
        provider: 'google',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = await usersCol.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId.toString() };
    }

    const userId = (user._id || '').toString();
    const token = generateToken({
      id: userId,
      email: user.email,
      name: user.name
    });

    res.status(200).json({
      success: true,
      message: 'Authenticated successfully with Google!',
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL
      }
    });
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(500).json({ success: false, message: 'Server error during Google auth.', error: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const usersCol = getUsersCollection();
    let user = await usersCol.findOne({ email: req.user.email });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: (user._id || '').toString(),
        name: user.name,
        email: user.email,
        photoURL: user.photoURL
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error retrieving user.', error: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const { name, photoURL } = req.body;
    if (!name || name.trim() === '') {
      res.status(400).json({ success: false, message: 'Name cannot be empty.' });
      return;
    }

    const usersCol = getUsersCollection();
    const filter = { email: req.user.email };

    await usersCol.updateOne(filter, {
      $set: {
        name: name.trim(),
        photoURL: photoURL?.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`,
        updatedAt: new Date()
      }
    });

    const updatedUser = await usersCol.findOne(filter);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: (updatedUser?._id || '').toString(),
        name: updatedUser?.name,
        email: updatedUser?.email,
        photoURL: updatedUser?.photoURL
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Server error updating profile.', error: error.message });
  }
};
