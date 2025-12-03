/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure Node bundles load the Supabase SDK at runtime instead of
  // trying to tree-shake it away (which causes undefined exports).
  serverExternalPackages: ["@supabase/supabase-js"],
};

export default nextConfig;
