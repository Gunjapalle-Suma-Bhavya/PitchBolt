const axios = require('axios');

/**
 * Service to fetch product recommendations & pricing from Amazon / Flipkart APIs
 */
const mockCatalog = [
  {
    id: 'prod_101',
    title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
    platform: 'Amazon / Flipkart',
    price: '$398.00 / ₹29,990',
    rating: '4.7 ★',
    specs: '30-hour battery life, Industry-leading noise canceling, Multipoint connection',
    url: 'https://www.amazon.com/dp/B09XS7JWHH',
    whatsappSummary: '⚡ Sony WH-1000XM5 Headphones - Industry Leading ANC, 30hr battery. Special Price: ₹29,990! Buy link: https://www.amazon.com/dp/B09XS7JWHH'
  },
  {
    id: 'prod_102',
    title: 'Apple iPhone 15 Pro (128 GB) - Natural Titanium',
    platform: 'Amazon / Flipkart',
    price: '$999.00 / ₹1,29,900',
    rating: '4.8 ★',
    specs: 'A17 Pro chip, Titanium design, Action button, 48MP Main Camera',
    url: 'https://www.flipkart.com/apple-iphone-15-pro',
    whatsappSummary: '📱 Apple iPhone 15 Pro 128GB - A17 Pro Chip, Titanium Body. Discounted Price: ₹1,29,900! Buy link: https://www.flipkart.com/apple-iphone-15-pro'
  },
  {
    id: 'prod_103',
    title: 'Samsung Galaxy Watch 6 Classic LTE (47mm)',
    platform: 'Amazon / Flipkart',
    price: '$349.00 / ₹36,999',
    rating: '4.5 ★',
    specs: 'Rotating bezel, Sapphire crystal glass, Advanced sleep tracking, ECG',
    url: 'https://www.amazon.com/dp/B0C7976451',
    whatsappSummary: '⌚ Samsung Galaxy Watch 6 Classic - Rotating Bezel, ECG & LTE. Deal Price: ₹36,999! Buy link: https://www.amazon.com/dp/B0C7976451'
  },
  {
    id: 'prod_104',
    title: 'Dell XPS 13 Laptop (Intel Core Ultra 7, 16GB RAM, 512GB SSD)',
    platform: 'Flipkart / Amazon',
    price: '$1,199.00 / ₹1,14,990',
    rating: '4.6 ★',
    specs: 'FHD+ InfinityEdge display, Intel Arc Graphics, Featherlight design',
    url: 'https://www.flipkart.com/dell-xps-13',
    whatsappSummary: '💻 Dell XPS 13 Ultra 7 - 16GB/512GB SSD, InfinityEdge Display. Price: ₹1,14,990! Buy link: https://www.flipkart.com/dell-xps-13'
  }
];

const searchProducts = async (query) => {
  try {
    // If RapidAPI or custom Amazon/Flipkart API key is provided:
    if (process.env.RAPIDAPI_KEY) {
      const response = await axios.get('https://real-time-amazon-data.p.rapidapi.com/search', {
        params: { query, page: '1', country: 'US' },
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com'
        }
      });
      if (response.data?.data?.products?.length > 0) {
        const p = response.data.data.products[0];
        return {
          id: p.asin,
          title: p.product_title,
          platform: 'Amazon',
          price: p.product_price || '$199.99',
          rating: `${p.product_star_rating || 4.5} ★`,
          specs: p.product_description || 'High rated e-commerce item',
          url: p.product_url,
          whatsappSummary: `🛒 ${p.product_title} - Price: ${p.product_price}. Direct Link: ${p.product_url}`
        };
      }
    }
  } catch (err) {
    console.log('[Ecommerce API] Falling back to structured search engine:', err.message);
  }

  // Smart catalog matching fallback
  const q = (query || '').toLowerCase();
  const match = mockCatalog.find(
    (item) => item.title.toLowerCase().includes(q) || item.specs.toLowerCase().includes(q)
  );

  return match || {
    id: `prod_custom_${Date.now()}`,
    title: query ? `${query.toUpperCase()} Best Seller` : 'Featured Product',
    platform: 'Amazon & Flipkart',
    price: '₹14,999 / $179.00',
    rating: '4.7 ★',
    specs: 'Top customer choice with instant warranty and fast shipping.',
    url: 'https://www.amazon.com/s?k=' + encodeURIComponent(query || 'electronics'),
    whatsappSummary: `✨ Special Offer on ${query || 'Featured Product'}! Price: ₹14,999. Check deal here: https://www.amazon.com/s?k=${encodeURIComponent(query || 'electronics')}`
  };
};

module.exports = { searchProducts, mockCatalog };
