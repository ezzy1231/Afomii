/**
 * Route transition wrapper — subtle fade-in on every page navigation.
 * Replaces a framer-motion fade that shipped ~40 KB gzipped on every route.
 * Respects prefers-reduced-motion via the global rule in globals.css.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="route-fade">{children}</div>;
}