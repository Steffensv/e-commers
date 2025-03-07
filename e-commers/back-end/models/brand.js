module.exports = (sequelize, DataTypes) => {
  const Brand = sequelize.define('Brand', {
    name: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true 
    },
  }, { timestamps: false });

  Brand.associate = (models) => {
    Brand.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
  };

  return Brand;
}