const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

function build(record, label) {
  if (record?.image) return `${API_ORIGIN}/${record.image}`;
  return `https://placehold.co/500x280?text=${encodeURIComponent(label || 'LN PAK')}`;
}

export const serviceImageUrl = (service) => build(service, service?.country || service?.title);
export const universityImageUrl = (university) => build(university, university?.name);
export const scholarshipImageUrl = (scholarship) => build(scholarship, scholarship?.country || scholarship?.title);
export const tourImageUrl = (tour) => build(tour, tour?.destination || tour?.title);
