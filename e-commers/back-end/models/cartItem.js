module.exports = (sequelize, DataTypes) => {
  const CartItem = sequelize.define('CartItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    cartId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'carts',
        key: 'id'
      }
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Products',
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
    }
  }, {
    tableName: 'cart_items',
    timestamps: true
  });

  // Define association methods
  CartItem.associate = function(models) {
    CartItem.belongsTo(models.Cart, { 
      foreignKey: 'cartId',
      onDelete: 'CASCADE'
    });
    CartItem.belongsTo(models.Product, { foreignKey: 'productId' });
  };

  return CartItem;
};