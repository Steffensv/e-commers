module.exports = (sequelize, DataTypes) => {
  const Membership = sequelize.define('Membership', {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    discount: { type: DataTypes.FLOAT, allowNull: false },
    minQuantity: { type: DataTypes.INTEGER, allowNull: false },
    maxQuantity: { type: DataTypes.INTEGER, allowNull: true },
  }, { timestamps: false });

  Membership.associate = (models) => {
    Membership.hasMany(models.User, { foreignKey: 'membershipId', as: 'users' });
  };

  return Membership;
};