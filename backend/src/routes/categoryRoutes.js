const express = require('express');
const router = express.Router();

// Basic category routes
router.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Category routes working',
    endpoints: [
      'GET /',
      'GET /:id',
      'POST /',
      'PUT /:id',
      'DELETE /:id'
    ]
  });
});

router.get('/:id', (req, res) => {
  res.json({ 
    success: true, 
    message: `Get category ${req.params.id}`,
    id: req.params.id
  });
});

router.post('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Create new category',
    data: req.body
  });
});

router.put('/:id', (req, res) => {
  res.json({ 
    success: true, 
    message: `Update category ${req.params.id}`,
    id: req.params.id,
    data: req.body
  });
});

router.delete('/:id', (req, res) => {
  res.json({ 
    success: true, 
    message: `Delete category ${req.params.id}`,
    id: req.params.id
  });
});

module.exports = router;
