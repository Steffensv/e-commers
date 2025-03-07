const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'In Progress',
      validate: {
        isIn: [['In Progress', 'Ordered', 'Completed']]
      }
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0
    },
    discountAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0
    },
    orderNumber: {
      type: DataTypes.STRING(8),
      allowNull: false,
      unique: true
    },
    membershipStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Bronze'
    },
    membershipDiscount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0
    },
    paymentDetails: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'orders'
  });

  Order.associate = function(models) {
    Order.belongsTo(models.User, { foreignKey: 'userId' });
    Order.hasMany(models.OrderItem, { foreignKey: 'orderId', onDelete: 'CASCADE' });
  };

  return Order;
};