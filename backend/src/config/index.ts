/**
 * Config Re-export
 * 
 * Re-exportiert die Konfiguration aus env.ts für Kompatibilität
 */

export { config, type Config } from './env.js';
export default { config: () => import('./env.js').then(m => m.config) };
