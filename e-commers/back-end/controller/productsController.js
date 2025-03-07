const { Product, Brand, Category } = require('../models');
const { AppError, catchAsync } = require('../middleware/errorHandler');

// Get all products - refactored with catchAsync
const getAllProducts = catchAsync(async (req, res) => {
  // Different queries for admin and regular users
  const whereClause = req.user?.isAdmin ? {} : { isDeleted: false };
  
  const products = await Product.findAll({
    where: whereClause,
    include: [
      { model: Brand, as: 'brand' },
      { model: Category, as: 'category' },
    ],
  });

  console.log('Products found:', products.length);
  
  if (!products || products.length === 0) {
    // Use empty array instead of throwing error, as empty results is not an error
    return res.json({ 
      status: 'success', 
      statuscode: 200, 
      data: { products: [] } 
    });
  }

  return res.json({ 
    status: 'success', 
    statuscode: 200, 
    data: { 
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        dateAdded: product.dateAdded,
        imgUrl: product.imgUrl,
        quantity: product.quantity,
        brand: product.brand ? { name: product.brand.name } : { name: 'Unknown' },
        category: product.category ? { name: product.category.name } : { name: 'Unknown' }
      }))
    } 
  });
});

// Get single product by ID - refactored with catchAsync
const getProductById = catchAsync(async (req, res) => {
  const whereClause = req.user?.isAdmin ? {} : { isDeleted: false };
  whereClause.id = req.params.id;
  
  const product = await Product.findOne({
    where: whereClause,
    include: [
      { model: Brand, as: 'brand' },
      { model: Category, as: 'category' },
    ],
  });

  if (!product) {
    throw new AppError('Product not found', 404, 'getProductById');
  }

  return res.json({ 
    status: 'success', 
    statuscode: 200, 
    data: { 
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        dateAdded: product.dateAdded,
        imgUrl: product.imgUrl,
        quantity: product.quantity,
        brand: product.brand ? { name: product.brand.name } : { name: 'Unknown' },
        category: product.category ? { name: product.category.name } : { name: 'Unknown' }
      }
    } 
  });
});

// Create new product - refactored with catchAsync
const createProduct = catchAsync(async (req, res) => {
  const { name, description, price, imgUrl, quantity, brandId, categoryId } = req.body;
  
  // Basic validation
  if (!name || !description || !price) {
    throw new AppError('Name, description and price are required', 400, 'createProduct');
  }

  // Create the product
  const newProduct = await Product.create({
    name,
    description,
    price,
    dateAdded: new Date(),
    imgUrl: imgUrl || 'default-product-image.jpg',
    quantity: quantity || 0,
    brandId,
    categoryId,
  });

  return res.status(201).json({
    status: 'success',
    statuscode: 201,
    data: { 
      Result: 'Product created successfully', 
      product: newProduct 
    }
  });
});

// Update product - refactored with catchAsync
const updateProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, description, price, imgUrl, quantity, brandId, categoryId } = req.body;

  const product = await Product.findByPk(id);

  if (!product) {
    throw new AppError('Product not found', 404, 'updateProduct');
  }

  // Update product fields if provided
  if (name) product.name = name;
  if (description) product.description = description;
  if (price) product.price = price;
  if (imgUrl) product.imgUrl = imgUrl;
  if (quantity !== undefined) product.quantity = quantity;
  if (brandId) product.brandId = brandId;
  if (categoryId) product.categoryId = categoryId;

  await product.save();

  return res.json({
    status: 'success',
    statuscode: 200,
    data: { 
      Result: 'Product updated successfully', 
      product
    }
  });
});

// Delete product - refactored with catchAsync
const deleteProduct = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const product = await Product.findByPk(id);
  
  if (!product) {
    throw new AppError('Product not found', 404, 'deleteProduct');
  }
  
  // Soft delete instead of destroy
  product.isDeleted = true;
  await product.save();
  
  return res.json({
    status: 'success',
    statuscode: 200,
    data: { Result: 'Product deleted successfully' }
  });
});

// Get products by category - refactored with catchAsync
const getProductsByCategory = catchAsync(async (req, res) => {
  const { categoryId } = req.params;
  
  // Check if category exists
  const categoryExists = await Category.findByPk(categoryId);
  if (!categoryExists) {
    throw new AppError('Category not found', 404, 'getProductsByCategory');
  }

  const whereClause = { categoryId };
  if (!req.user?.isAdmin) {
    whereClause.isDeleted = false;
  }

  const products = await Product.findAll({
    where: whereClause,
    include: [
      { model: Brand, as: 'brand' },
      { model: Category, as: 'category' },
    ],
  });
  
  return res.json({ 
    status: 'success', 
    statuscode: 200, 
    data: { 
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        dateAdded: product.dateAdded,
        imgUrl: product.imgUrl,
        quantity: product.quantity,
        brand: product.brand ? { name: product.brand.name } : { name: 'Unknown' },
        category: product.category ? { name: product.category.name } : { name: 'Unknown' }
      }))
    } 
  });
});

// Get products by brand - refactored with catchAsync
const getProductsByBrand = catchAsync(async (req, res) => {
  const { brandId } = req.params;
  
  // Check if brand exists
  const brandExists = await Brand.findByPk(brandId);
  if (!brandExists) {
    throw new AppError('Brand not found', 404, 'getProductsByBrand');
  }

  const whereClause = { brandId };
  if (!req.user?.isAdmin) {
    whereClause.isDeleted = false;
  }

  const products = await Product.findAll({
    where: whereClause,
    include: [
      { model: Brand, as: 'brand' },
      { model: Category, as: 'category' },
    ],
  });
  
  return res.json({ 
    status: 'success', 
    statuscode: 200, 
    data: { 
      products: products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        dateAdded: product.dateAdded,
        imgUrl: product.imgUrl,
        quantity: product.quantity,
        brand: product.brand ? { name: product.brand.name } : { name: 'Unknown' },
        category: product.category ? { name: product.category.name } : { name: 'Unknown' }
      }))
    } 
  });
});

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  getProductsByBrand
};