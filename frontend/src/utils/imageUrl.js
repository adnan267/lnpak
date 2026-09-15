const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export function serviceImageUrl(service) {
  if (service?.image) return `${API_ORIGIN}/${service.image}`;
  return `https://placehold.co/500x280?text=${encodeURIComponent(service?.country || service?.title || 'LN PAK')}`;
}
