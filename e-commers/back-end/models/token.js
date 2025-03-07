module.exports = (sequelize, DataTypes) => {
  const Token = sequelize.define('Token', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, { timestamps: true });

  Token.associate = (models) => {
    Token.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Token;
};