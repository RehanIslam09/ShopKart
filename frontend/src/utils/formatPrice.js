/**
 * Currency formatter helper using Indian Numbering System (en-IN).
 * Formats values like 2999 into "₹2,999".
 */
export const formatPrice = (price) => {
  if (price === undefined || price === null || isNaN(price)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

export default formatPrice;
