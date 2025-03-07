const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database'); 

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    dateAdded: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'date_added',
    },
    imgUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'imgurl',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    brandId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Brands',
        key: 'id',
      },
    },
    categoryId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Categories',
        key: 'id',
      },
    },
  }, {
    sequelize,
    modelName: 'Product',
    underscored: true,
  });

  // Define associations
  Product.associate = (models) => {
    Product.belongsTo(models.Brand, { foreignKey: 'brandId', as: 'brand' });
    Product.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
  };

  return Product;
};