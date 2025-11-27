import type { AppProps } from 'next/app';
import '../styles/globals.css';
import CustomThemeProvider from '../components/ThemeProvider';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CustomThemeProvider>
      <Component {...pageProps} />
    </CustomThemeProvider>
  );
}