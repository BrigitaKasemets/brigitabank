const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');

class User extends Model {
  // Password comparison method
  async comparePassword(candidatePassword) {
    try {
      // Add logging to debug
      console.log('Comparing password...');
      const isMatch = await bcrypt.compare(candidatePassword, this.password);
      console.log('Password match result:', isMatch);
      return isMatch;
    } catch (error) {
      console.error('Error comparing passwords:', error);
      return false;
    }
  }
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fullName: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Roles',
      key: 'id'
    },
    defaultValue: 2 // Default to user role (where 2 is the 'user' role ID)
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
    comment: 'Legacy field, use roleId instead'
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'User',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Define associations - will be called in models/index.js
User.associate = (models) => {
  User.belongsTo(models.Role, { foreignKey: 'roleId' });
  User.hasMany(models.Account, { foreignKey: 'userId' });
};

module.exports = User;