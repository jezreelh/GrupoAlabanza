// src/controllers/auth.controller.js

const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Register
exports.register = async (req, res) => {
    const { username, password, role } = req.body;
  
    // Validar campos
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporciona usuario y contraseña'
      });
    }
  
    try {
      // Verificar si ya existe el usuario
      const userExists = await User.findOne({ username });
  
      if (userExists) {
        return res.status(400).json({
          success: false,
          message: 'El nombre de usuario ya está en uso'
        });
      }
  
      // Crear nuevo usuario
      const user = new User({ username, password, role });
      await user.save();
  
      // Crear token
      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'secretotemporaljwt',
        { expiresIn: '1d' }
      );
  
      res.status(201).json({
        success: true,
        token
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al registrar el usuario',
        error: error.message
      });
    }
  };
  

// Login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  
  // Validar campos
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Por favor proporciona usuario y contraseña'
    });
  }
  
  try {
    // Verificar si el usuario existe
    const user = await User.findOne({ username }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // Verificar si la contraseña coincide
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }
    
    // Crear token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'secretotemporaljwt',
      { expiresIn: '1d' }
    );
    
    res.status(200).json({
      success: true,
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};