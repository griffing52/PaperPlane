// Ensure URLs include the protocol so Fetch/clients don't treat them as invalid scheme
// Prefer NEXT_PUBLIC_* env vars for client-side code, fall back to server env var, then default.
export const API_BASE_URL =
	process.env.NEXT_PUBLIC_PAPERPLANE_BACKEND ||
	process.env.PAPERPLANE_BACKEND ||
	"http://localhost:3002";

export const OCR_API_BASE_URL =
	process.env.NEXT_PUBLIC_PAPERPLANE_OCR_BACKEND ||
	process.env.PAPERPLANE_OCR_BACKEND ||
	"http://localhost:8000";