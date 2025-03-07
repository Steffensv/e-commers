module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    name: { type: DataTypes.STRING, allowNull: false },
  }, { timestamps: false });

  Role.associate = (models) => {
    Role.hasMany(models.User, { foreignKey: 'roleId', as: 'users' });
  };

  return Role;
};