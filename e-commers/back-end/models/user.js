module.exports = (sequelize, DataTypes) => {
	const User = sequelize.define(
		"User",
		{
			id: {
				// Use lowercase 'id' to match what's in the database
				type: DataTypes.INTEGER,
				primaryKey: true,
				autoIncrement: true,
				allowNull: false,
			},
			roleId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 2 },
			membershipId: {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 1,
			},
			firstname: { type: DataTypes.STRING, allowNull: false },
			lastname: { type: DataTypes.STRING, allowNull: false },
			username: { type: DataTypes.STRING, allowNull: false, unique: true },
			email: { type: DataTypes.STRING, allowNull: false, unique: true },
			password: { type: DataTypes.STRING, allowNull: false },
			address: { type: DataTypes.STRING, allowNull: false },
			phone: { type: DataTypes.STRING, allowNull: false },
			isAdmin: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false,
			},
		},
		{
			tableName: "users", // Lowercase table name
			timestamps: true,
		}
	);

	User.associate = (models) => {
		User.belongsTo(models.Role, { foreignKey: "roleId", as: "role" });
		User.belongsTo(models.Membership, {
			foreignKey: "membershipId",
			as: "membership",
		});
		User.hasMany(models.Cart, { foreignKey: "userId" });
		User.hasMany(models.Order, { foreignKey: "userId" });
	};

	return User;
};
