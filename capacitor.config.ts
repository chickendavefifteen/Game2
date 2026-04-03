import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hormuzdefender.game',
  appName: 'Hormuz Defender',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
