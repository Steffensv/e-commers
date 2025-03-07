const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');
const { AppError, catchAsync } = require('../middleware/errorHandler');

// Main search function that handles searching products by different criteria - refactored with catchAsync
const searchProducts = catchAsync(async (req, res) => {
  const { query, type } = req.body;
  
  // Validate input
  if (!query || !query.trim()) {
    throw new AppError('Search query cannot be empty', 400, 'searchProducts');
  }

  let sqlQuery;
  let replacements = {};
  const searchTerm = `%${query}%`; // For LIKE queries
  const isAdmin = req.user?.isAdmin;
  
  // Determine which type of search to perform
  switch (type) {
    case 'category':
      sqlQuery = `
        SELECT p.*, b.name as brand_name, c.name as category_name
        FROM products p
        LEFT JOIN brands b ON p.brandId = b.id
        LEFT JOIN categories c ON p.categoryId = c.id
        WHERE c.name LIKE :searchTerm
        ${!isAdmin ? 'AND p.isDeleted = false' : ''}
      `;
      replacements = { searchTerm };
      break;
      
    case 'brand':
      sqlQuery = `
        SELECT p.*, b.name as brand_name, c.name as category_name
        FROM products p
        LEFT JOIN brands b ON p.brandId = b.id
        LEFT JOIN categories c ON p.categoryId = c.id
        WHERE b.name LIKE :searchTerm
        ${!isAdmin ? 'AND p.isDeleted = false' : ''}
      `;
      replacements = { searchTerm };
      break;
      
    case 'name':
    default:
      sqlQuery = `
        SELECT p.*, b.name as brand_name, c.name as category_name
        FROM products p
        LEFT JOIN brands b ON p.brandId = b.id
        LEFT JOIN categories c ON p.categoryId = c.id
        WHERE p.name LIKE :searchTerm
        ${!isAdmin ? 'AND p.isDeleted = false' : ''}
      `;
      replacements = { searchTerm };
      break;
  }

  // Execute the raw SQL query
  const products = await sequelize.query(sqlQuery, {
    replacements,
    type: QueryTypes.SELECT
  });

  return res.json({
    status: 'success',
    statuscode: 200,
    data: {
      count: products.length,
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        dateAdded: product.date_added,
        imgUrl: product.imgurl,
        quantity: product.quantity,
        brand: { 
          name: product.brand_name || 'Unknown' 
        },
        category: { 
          name: product.category_name || 'Unknown' 
        },
        isDeleted: product.isDeleted
      }))
    }
  });
});

// Advanced search function with multiple filters
const advancedSearch = catchAsync(async (req, res) => {
  const { 
    query, 
    category, 
    brand, 
    minPrice, 
    maxPrice,
    sortBy = 'name', 
    sortOrder = 'ASC' 
  } = req.body;

  // Build the WHERE clause
  const whereConditions = [];
  const replacements = {};
  
  // Product name search
  if (query && query.trim()) {
    whereConditions.push(`p.name LIKE :query`);
    replacements.query = `%${query}%`;
  }
  
  // Category filter
  if (category) {
    whereConditions.push(`c.name = :category`);
    replacements.category = category;
  }
  
  // Brand filter
  if (brand) {
    whereConditions.push(`b.name = :brand`);
    replacements.brand = brand;
  }
  
  // Price range filter
  if (minPrice !== undefined && minPrice !== null) {
    whereConditions.push(`p.price >= :minPrice`);
    replacements.minPrice = minPrice;
  }
  
  if (maxPrice !== undefined && maxPrice !== null) {
    whereConditions.push(`p.price <= :maxPrice`);
    replacements.maxPrice = maxPrice;
  }
  
  // Validate sort parameters to prevent SQL injection
  const validSortFields = ['name', 'price', 'dateAdded'];
  const validSortOrders = ['ASC', 'DESC'];
  
  const finalSortBy = validSortFields.includes(sortBy) ? sortBy : 'name';
  const finalSortOrder = validSortOrders.includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'ASC';
  
  // Construct the WHERE clause
  const whereClause = whereConditions.length > 0 
    ? `WHERE ${whereConditions.join(' AND ')}` 
    : '';
  
  // Construct the SQL query
  const sqlQuery = `
    SELECT p.*, b.name as brand_name, c.name as category_name
    FROM products p
    LEFT JOIN brands b ON p.brandId = b.id
    LEFT JOIN categories c ON p.categoryId = c.id
    ${whereClause}
    ORDER BY p.${finalSortBy} ${finalSortOrder}
  `;
  
  // Execute the query
  const products = await sequelize.query(sqlQuery, {
    replacements,
    type: QueryTypes.SELECT
  });
  
  // Format the response
  const formattedProducts = products.map(product => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    imgUrl: product.imgUrl,
    quantity: product.quantity,
    brand: { 
      name: product.brand_name || 'Unknown' 
    },
    category: { 
      name: product.category_name || 'Unknown' 
    }
  }));
  
  return res.json({
    status: 'success',
    statuscode: 200,
    data: {
      count: formattedProducts.length,
      products: formattedProducts,
      filters: {
        query,
        category,
        brand,
        minPrice,
        maxPrice,
        sortBy: finalSortBy,
        sortOrder: finalSortOrder
      }
    }
  });
});

module.exports = {
  searchProducts,
  advancedSearch
};