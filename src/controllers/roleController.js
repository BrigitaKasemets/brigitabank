const Role = require('../models/Role');
const User = require('../models/User');

// Get all roles
exports.getAllRoles = async (req, res) => {
    try {
        // Only admins can see all roles
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Permission denied' });
        }

        const roles = await Role.findAll();

        if (!roles || roles.length === 0) {
            return res.status(404).json({ message: 'No roles found' });
        }

        res.status(200).json(roles);
    } catch (err) {
        console.error('Error fetching roles:', err);
        res.status(500).json({
            message: 'Server error occurred while fetching roles',
            error: err.message
        });
    }
};

// Get role by ID
exports.getRoleById = async (req, res) => {
    try {
        // Only admins can view role details
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Permission denied' });
        }

        const { id } = req.params;

        const role = await Role.findByPk(id);

        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        res.status(200).json(role);
    } catch (err) {
        console.error('Error fetching role:', err);
        res.status(500).json({
            message: 'Server error occurred while fetching role',
            error: err.message
        });
    }
};

// Create new role (admin only)
exports.createRole = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can create roles' });
        }

        const { name, description, permissions } = req.body;

        // Validate input
        if (!name) {
            return res.status(400).json({ message: 'Role name is required' });
        }

        // Check if role already exists
        const existingRole = await Role.findOne({ where: { name } });

        if (existingRole) {
            return res.status(409).json({ message: 'Role already exists' });
        }

        // Create new role
        const role = await Role.create({
            name,
            description,
            permissions: permissions ? JSON.stringify(permissions) : JSON.stringify([])
        });

        res.status(201).json(role);
    } catch (err) {
        console.error('Error creating role:', err);
        res.status(500).json({
            message: 'Server error occurred while creating role',
            error: err.message
        });
    }
};

// Update role (admin only)
exports.updateRole = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can update roles' });
        }

        const { id } = req.params;
        const { name, description, permissions } = req.body;

        const role = await Role.findByPk(id);

        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        // Don't allow modification of built-in admin role
        if (role.name === 'admin' && name !== 'admin') {
            return res.status(400).json({ message: 'Cannot modify the name of the admin role' });
        }

        // Update fields
        if (name) role.name = name;
        if (description !== undefined) role.description = description;
        if (permissions !== undefined) {
            role.permissions = JSON.stringify(permissions);
        }

        await role.save();

        res.status(200).json(role);
    } catch (err) {
        console.error('Error updating role:', err);
        res.status(500).json({
            message: 'Server error occurred while updating role',
            error: err.message
        });
    }
};

// Delete role (admin only)
exports.deleteRole = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can delete roles' });
        }

        const { id } = req.params;

        const role = await Role.findByPk(id);

        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        // Prevent deletion of built-in roles
        if (['admin', 'user'].includes(role.name)) {
            return res.status(400).json({ message: 'Cannot delete built-in roles' });
        }

        // Check if role is assigned to any users
        const userCount = await User.count({ where: { roleId: id } });

        if (userCount > 0) {
            return res.status(400).json({
                message: 'Cannot delete role that is assigned to users',
                userCount
            });
        }

        // Delete the role
        await role.destroy();

        res.status(200).json({ message: 'Role successfully deleted' });
    } catch (err) {
        console.error('Error deleting role:', err);
        res.status(500).json({
            message: 'Server error occurred while deleting role',
            error: err.message
        });
    }
};

// Assign role to user (admin only)
exports.assignRoleToUser = async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can assign roles' });
        }

        const { userId, roleId } = req.body;

        // Validate input
        if (!userId || !roleId) {
            return res.status(400).json({ message: 'Both userId and roleId are required' });
        }

        // Check if user exists
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if role exists
        const role = await Role.findByPk(roleId);

        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        // Assign role to user
        user.roleId = roleId;
        await user.save();

        res.status(200).json({
            message: 'Role successfully assigned to user',
            user: {
                id: user.id,
                username: user.username,
                role: role.name
            }
        });
    } catch (err) {
        console.error('Error assigning role to user:', err);
        res.status(500).json({
            message: 'Server error occurred while assigning role',
            error: err.message
        });
    }
};