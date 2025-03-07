module.exports = (sequelize, DataTypes) => {
  const Cart = sequelize.define('Cart', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',  // lowercase table name
        key: 'id'       // lowercase id
      }
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active'
    }
  }, {
    tableName: 'carts',
    timestamps: true
  });

  // Define association methods
  Cart.associate = function(models) {
    // Remove targetKey - use default primary key
    Cart.belongsTo(models.User, { foreignKey: 'userId' });
    Cart.hasMany(models.CartItem, { 
      foreignKey: 'cartId', 
      onDelete: 'CASCADE',
      hooks: true
    });
  };

  return Cart;
};