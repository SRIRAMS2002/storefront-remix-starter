export const APP_META_TITLE = 'Vendure Remix Storefront';
export const APP_META_DESCRIPTION =
  'A headless commerce storefront starter kit built with Remix & Vendure';
export const DEMO_API_URL = 'https://readonlydemo.vendure.io/shop-api';
export let API_URL =
  typeof process !== 'undefined'
    ? process.env.VENDURE_API_URL ?? DEMO_API_URL
    : DEMO_API_URL;


export function setApiUrl(apiUrl: string) {
  API_URL = apiUrl;
}
