/**
 * E-Commerce Website Development Service Catalog & Search Provider
 */

const webPackagesCatalog = [
  {
    id: 'starter',
    title: 'Starter E-Commerce Store',
    price: '₹19,999 ($249)',
    specs: 'Up to 50 Products, Mobile Responsive, Razorpay/Stripe UPI Gateway, Basic SEO & Admin Panel.',
    platform: 'Shopify / WooCommerce',
    whatsappSummary: '🚀 Starter Store Package (₹19,999): Up to 50 products, payment gateway, mobile responsive design. Proposal Link: https://webagency.example.com/starter-proposal'
  },
  {
    id: 'pro',
    title: 'Growth Pro E-Commerce Portal',
    price: '₹49,999 ($599)',
    specs: 'Unlimited Products, Custom UX/UI, Speed Optimization, WhatsApp Order Links, Inventory CRM, Analytics.',
    platform: 'Custom MERN / Next.js',
    whatsappSummary: '⚡ Growth Pro Package (₹49,999): Unlimited products, custom design, WhatsApp checkout, CRM integration. Proposal Link: https://webagency.example.com/pro-proposal'
  },
  {
    id: 'enterprise',
    title: 'Enterprise Custom Store & Apps',
    price: '₹99,999 ($1,199)',
    specs: 'Multi-vendor Marketplace, Custom React/Node, iOS/Android Mobile Apps, AI Product Recommendations, 24/7 Support.',
    platform: 'Custom Full-Stack Microservices',
    whatsappSummary: '👑 Enterprise Store Package (₹99,999): Multi-vendor, iOS/Android Apps, AI Recommendations. Proposal Link: https://webagency.example.com/enterprise-proposal'
  }
];

const searchProducts = async (query = '') => {
  const q = (query || '').toLowerCase();
  const found = webPackagesCatalog.find(
    (p) => p.title.toLowerCase().includes(q) || p.specs.toLowerCase().includes(q) || p.id.includes(q)
  );
  return found || webPackagesCatalog[1]; // Default to Growth Pro
};

module.exports = { searchProducts, webPackagesCatalog };
