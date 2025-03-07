const bcrypt = require('bcrypt');
const axios = require('axios');
const { Brand, Category, Membership, Product, Role, User, Cart, CartItem } = require('../models');
const { generateAndStoreAdminToken, generateAndStoreUserToken } = require('../services/tokenService');
require('dotenv').config();

const initDatabase = async (req, res) => {
  try {
    console.log("Starting database initialization...");

    // Add roles if they don't exist
    await Role.findOrCreate({ where: { id: 1 }, defaults: { name: "Admin" } });
    await Role.findOrCreate({ where: { id: 2 }, defaults: { name: "User" } });
    console.log("Roles initialized");

    // Add memberships if they don't exist
    await Membership.findOrCreate({ where: { id: 1 }, defaults: { name: "Bronze", discount: 0, minQuantity: 0, maxQuantity: 15 } });
    await Membership.findOrCreate({ where: { id: 2 }, defaults: { name: "Silver", discount: 15, minQuantity: 15, maxQuantity: 30 } });
    await Membership.findOrCreate({ where: { id: 3 }, defaults: { name: "Gold", discount: 30, minQuantity: 30 } });
    console.log("Memberships initialized");

    // Add admin user if they don't exist
    const hashedPassword1 = await bcrypt.hash("P@ssword2023", 10);
    const [adminUser, createdAdmin] = await User.findOrCreate({
      where: { email: "admin@noroff.no" },
      defaults: {
        firstname: "Admin",
        lastname: "Support",
        username: "Admin",
        password: hashedPassword1,
        address: "Online",
        phone: "+47 911 91 911",
        roleId: 1,
        isAdmin: true,
        membershipId: 1,
      },
    });
    console.log("Admin user initialized");

    // Add test user if they don't exist
    const hashedPassword2 = await bcrypt.hash("Test2!", 10);
    const [regularUser, createdUser] = await User.findOrCreate({
      where: { email: "test@shop.no" },
      defaults: {
        firstname: "Testuser",
        lastname: "TestUser",
        username: "Testuser",
        password: hashedPassword2,
        address: "Online1",
        phone: "+47 911 91 912",
        roleId: 2,
        isAdmin: false,
        membershipId: 1,
      },
    });
    console.log("Regular user initialized");

    // Create carts for users - this ensures the cart table exists with proper schema
// Create carts for users - this ensures the cart table exists with proper schema
try {
  // Get the user IDs - always use lowercase 'id'
  const adminUserId = adminUser.id;
  const regularUserId = regularUser.id;

  console.log(`Admin user ID: ${adminUserId}, Regular user ID: ${regularUserId}`);

  // Create cart for admin if needed
  const [adminCart] = await Cart.findOrCreate({
    where: { userId: adminUserId, status: 'active' },
    defaults: {
      userId: adminUserId,
      status: 'active'
    }
  });
  console.log("Admin cart initialized:", adminCart.id);
  
  // Create cart for regular user if needed
  const [userCart] = await Cart.findOrCreate({
    where: { userId: regularUserId, status: 'active' },
    defaults: {
      userId: regularUserId,
      status: 'active'
    }
  });
  console.log("User cart initialized:", userCart.id);
} catch (cartError) {
  console.error("Error initializing carts:", cartError);
}

    // Insert products from API
    try {
      const { data } = await axios.get("http://backend.restapi.co.za/items/products");
      console.log(`Fetched ${data.data.length} products from API`);

      for (const productData of data.data) {
        const [brand] = await Brand.findOrCreate({
          where: { name: productData.brand },
          defaults: {
            name: productData.brand,
          },
        });

        const [category] = await Category.findOrCreate({
          where: { name: productData.category },
          defaults: {
            name: productData.category,
          },
        });

        if (!brand || !category) {
          console.warn("Brand or category not found for product", productData.name);
          continue;
        }

        const [product] = await Product.findOrCreate({
          where: { name: productData.name },
          defaults: {
            name: productData.name,
            description: productData.description,
            price: productData.price,
            dateAdded: productData.date_added,
            imgUrl: productData.imgurl,
            quantity: productData.quantity,
            brandId: brand.id, // Use the id of the brand
            categoryId: category.id, // Use the id of the category
          },
        });

        // Log some products to verify
        if (productData.name.includes("iPhone")) {
          console.log(`Created/found product: ${product.name}, ID: ${product.id}`);
        }
      }
      console.log("Database initialized with API data");
    } catch (apiError) {
      console.error("Error during product data insertion:", apiError);
      console.error("API error details:", apiError.message);
    }

    // Make sure the tables are properly configured by displaying some records
    try {
      // Check User table
      const firstUser = await User.findByPk(1);
      console.log("First user ID property name:", Object.keys(firstUser.dataValues).find(key => /id/i.test(key)));
      
      // Check Cart table structure
      const cartColumns = Object.keys((await Cart.findOne()).dataValues);
      console.log("Cart columns:", cartColumns);
    } catch (checkError) {
      console.error("Error checking tables:", checkError);
    }

    res.status(200).json({ 
      message: "Database initialized successfully",
      adminId: adminUser.Id || adminUser.id,
      userId: regularUser.Id || regularUser.id
    });
  } catch (error) {
    console.error("Error during database initialization:", error);
    res.status(500).json({ 
      message: "Database initialization failed", 
      error: error.message,
      stack: error.stack
    });
  }
};

module.exports = { initDatabase };