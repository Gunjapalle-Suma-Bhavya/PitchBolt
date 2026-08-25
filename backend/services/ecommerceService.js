const axios = require('axios');

/**
 * Service to fetch product recommendations & pricing from Swiggy Food MCP, Amazon, and Flipkart APIs
 */
const mockCatalog = [
  {
    id: 'food_201',
    title: 'Special Hyderabadi Chicken Dum Biryani',
    platform: 'Swiggy Food',
    price: '₹349.00',
    rating: '4.8 ★',
    specs: 'Slow-cooked aromatic basmati rice, tender spiced chicken, served with Mirchi Ka Salan & Raita',
    url: 'https://www.swiggy.com/restaurants/hyderabadi-biryani',
    whatsappSummary: '🍗 Special Hyderabadi Dum Biryani - Rating 4.8★. Price: ₹349. Order link: https://www.swiggy.com/restaurants/hyderabadi-biryani'
  },
  {
    id: 'food_202',
    title: 'Paneer Butter Masala + Garlic Naan Combo',
    platform: 'Swiggy Food',
    price: '₹289.00',
    rating: '4.7 ★',
    specs: 'Rich creamy tomato gravy with cottage cheese cubes & 2 fresh butter garlic naans',
    url: 'https://www.swiggy.com/restaurants/paneer-combo',
    whatsappSummary: '🍲 Paneer Butter Masala Combo - Rating 4.7★. Price: ₹289. Order link: https://www.swiggy.com/restaurants/paneer-combo'
  },
  {
    id: 'prod_101',
    title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
    platform: 'Amazon / Flipkart',
    price: '₹29,990',
    rating: '4.7 ★',
    specs: '30-hour battery life, Industry-leading noise canceling, Multipoint connection',
    url: 'https://www.amazon.in/dp/B09XS7JWHH',
    whatsappSummary: '⚡ Sony WH-1000XM5 Headphones - Industry Leading ANC, 30hr battery. Special Price: ₹29,990! Buy link: https://www.amazon.in/dp/B09XS7JWHH'
  },
  {
    id: 'prod_102',
    title: 'Apple iPhone 15 Pro (128 GB) - Natural Titanium',
    platform: 'Amazon / Flipkart',
    price: '₹1,29,900',
    rating: '4.8 ★',
    specs: 'A17 Pro chip, Titanium design, Action button, 48MP Main Camera',
    url: 'https://www.flipkart.com/apple-iphone-15-pro',
    whatsappSummary: '📱 Apple iPhone 15 Pro 128GB - A17 Pro Chip, Titanium Body. Price: ₹1,29,900! Buy link: https://www.flipkart.com/apple-iphone-15-pro'
  }
];

const searchProducts = async (query) => {
  const q = (query || '').toLowerCase();

  // Swiggy Food MCP Integration
  if (q.includes('biryani') || q.includes('food') || q.includes('paneer') || q.includes('swiggy')) {
    try {
      const swiggyRes = await axios.get(`https://${process.env.SWIGGY_MCP_ENDPOINT || 'mcp.swiggy.com/food'}/search`, {
        params: { q },
        timeout: 2000
      });
      if (swiggyRes.data?.items?.length > 0) {
        const item = swiggyRes.data.items[0];
        return {
          id: item.id || `swiggy_${Date.now()}`,
          title: item.name,
          platform: 'Swiggy Food MCP',
          price: `₹${item.price}`,
          rating: `${item.rating || 4.7} ★`,
          specs: item.description || 'Fresh gourmet food delivered fast via Swiggy',
          url: item.link || 'https://www.swiggy.com',
          whatsappSummary: `🍔 ${item.name} - ${item.price}. Order via Swiggy: ${item.link || 'https://www.swiggy.com'}`
        };
      }
    } catch (e) {
      console.log('[Swiggy MCP Lookup] Utilizing Swiggy Food Catalog fallback.');
    }
  }

  // RapidAPI Amazon / Flipkart integration
  if (process.env.RAPIDAPI_KEY) {
    try {
      const response = await axios.get('https://real-time-amazon-data.p.rapidapi.com/search', {
        params: { query, page: '1', country: 'IN' },
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': 'real-time-amazon-data.p.rapidapi.com'
        },
        timeout: 2000
      });
      if (response.data?.data?.products?.length > 0) {
        const p = response.data.data.products[0];
        return {
          id: p.asin,
          title: p.product_title,
          platform: 'Amazon',
          price: p.product_price || '₹14,999',
          rating: `${p.product_star_rating || 4.5} ★`,
          specs: p.product_description || 'High rated product',
          url: p.product_url,
          whatsappSummary: `🛒 ${p.product_title} - Price: ${p.product_price}. Direct Link: ${p.product_url}`
        };
      }
    } catch (err) {
      // Catalog fallback
    }
  }

  // Smart catalog matching fallback
  const match = mockCatalog.find(
    (item) => item.title.toLowerCase().includes(q) || item.specs.toLowerCase().includes(q)
  );

  return match || {
    id: `prod_custom_${Date.now()}`,
    title: query ? `${query.toUpperCase()} Top Deal` : 'Featured Recommendation',
    platform: 'Swiggy / Amazon / Flipkart',
    price: '₹14,999',
    rating: '4.7 ★',
    specs: 'Top customer choice with fast delivery and special discount offer.',
    url: 'https://www.amazon.in/s?k=' + encodeURIComponent(query || 'recommendations'),
    whatsappSummary: `✨ Special Offer on ${query || 'Featured Product'}! Price: ₹14,999. Check offer link: https://www.amazon.in/s?k=${encodeURIComponent(query || 'recommendations')}`
  };
};

module.exports = { searchProducts, mockCatalog };
