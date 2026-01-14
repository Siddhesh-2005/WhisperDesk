export const DB_NAME = "BlogApp";

// Cookie options tuned for local dev and production (Render)
// - In production: secure + sameSite=none for cross-site frontends
// - In dev: secure=false so cookies work over http://localhost
export const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
};
