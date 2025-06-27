export const allProducts = [
  {
    _id: '1',
    name: 'Golden Retriever Puppy',
    type: 'dog',
    breed: 'Golden Retriever',
    age: 2,
    description: 'Friendly and energetic puppy.',
    image: 'https://storage.googleapis.com/furbabies-petstore/pet/dog-001.jpg',
    featured: true,
    price: 500,
    category: 'pets'
  },
  {
    _id: '2',
    name: 'Persian Cat',
    type: 'cat',
    breed: 'Persian',
    age: 3,
    description: 'Beautiful long-haired cat.',
    image: 'https://storage.googleapis.com/furbabies-petstore/pet/cat-001.jpg',
    featured: false,
    price: 300,
    category: 'pets'
  },
  // ... 103 more products
];

export const featuredProducts = allProducts.filter(product => product.featured);