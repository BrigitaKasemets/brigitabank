const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Role extends Model {}

Role.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    permissions: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'JSON array of permission strings'
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
    modelName: 'Role',
    timestamps: true
});

module.exports = Role;