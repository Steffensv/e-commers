const express = require('express');
const axios = require('axios');
const router = express.Router();
const isAdmin = require('../../back-end/middleware/auth').isAdmin;

// GET route to display products
router.get('/', async (req, res) => {
  try {
    // Fetch products from API
    const response = await axios.get('http://localhost:3001/api/products');
    
    // Extract products from the correct path in the response structure
    const products = response.data.data.products || [];
    console.log('Products extracted:', products.length);
    
    // Render the products view with the products data
    res.render('products', { products, user: req.session.user });
  } catch (error) {
    console.error('Error fetching products:', error.message);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    }
    res.render('error', { message: 'Error loading products' });
  }
});

// Add this route to handle individual product pages
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`http://localhost:3001/api/products/${id}`);
    
    // Debug
    console.log('Product detail response:', response.data);
    
    // Extract product based on your API response structure
    const product = response.data.data.product || response.data.data;
    
    if (!product) {
      return res.render('error', { message: 'Product not found' });
    }
    
    res.render('products/detail', { 
      product, 
      user: req.session.user 
    });
  } catch (error) {
    console.error('Error fetching product details:', error.message);
    res.render('error', { message: 'Error loading product details' });
  }
});

// GET route for admin dashboard - shows products for admin
router.get('/admin/dashboard', isAdmin, async (req, res) => {
  try {
    const accessToken = req.session.accessToken;
    
    const response = await axios.get('http://localhost:3001/api/products', {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
    });
    
    const products = response.data.data.products || [];
    res.render('admin/dashboard', { products });
  } catch (error) {
    console.error('Error fetching products for admin dashboard:', error);
    res.render('admin/dashboard', { products: [], error: 'Failed to fetch products' });
  }
});

// GET route to display add product form
router.get('/add', isAdmin, (req, res) => {
  res.render('products/add');
});

// POST route to add a new product
router.post('/add', isAdmin, async (req, res) => {
  try {
    const accessToken = req.session.accessToken;
    const { name, description, price, imgUrl, quantity, brandId, categoryId } = req.body;
    
    await axios.post('http://localhost:3001/api/products', 
      { name, description, price, imgUrl, quantity, brandId, categoryId },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error adding product:', error);
    res.render('products/add', { error: 'Failed to add product' });
  }
});

// GET route to display edit product form
router.get('/edit/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`http://localhost:3001/api/products/${id}`);
    const product = response.data.data.product;
    
    if (!product) {
      return res.redirect('/admin/dashboard');
    }
    
    res.render('products/edit', { product });
  } catch (error) {
    console.error('Error fetching product for editing:', error);
    res.redirect('/admin/dashboard');
  }
});

// POST route to update a product
router.post('/edit/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const accessToken = req.session.accessToken;
    const { name, description, price, imgUrl, quantity, brandId, categoryId } = req.body;
    
    await axios.put(`http://localhost:3001/api/products/${id}`, 
      { name, description, price, imgUrl, quantity, brandId, categoryId },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error updating product:', error);
    res.redirect(`/products/edit/${req.params.id}`);
  }
});

// POST route to delete a product
router.post('/delete/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const accessToken = req.session.accessToken;
    
    await axios.delete(`http://localhost:3001/api/products/${id}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error deleting product:', error);
    res.redirect('/admin/dashboard');
  }
});

module.exports = router;