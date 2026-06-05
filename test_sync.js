import { fetchBooksFromDrive } from './src/services/googleDrive.js';
import dotenv from 'dotenv';
dotenv.config();

// We need to polyfill fetch for node
import fetch from 'node-fetch';
global.fetch = fetch;

fetchBooksFromDrive().then(books => {
  console.log(JSON.stringify(books, null, 2));
}).catch(err => {
  console.error(err);
});
