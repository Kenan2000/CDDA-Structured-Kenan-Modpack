const fs = require('fs');
const url = require('url');
const path = require('path');
const fetch = require('node-fetch');
const { pipeline } = require('stream');
const { promisify } = require('util');
const dotenv = require('dotenv');
const unzipper = require('unzipper')

const zipUrl = 'https://paratranz.cn/api/projects/2240/artifacts/download';
const zipPath = path.join(__dirname, 'paratranz.zip');
const unzipOutputPath = path.join(__dirname, 'paratranz');

const streamPipeline = promisify(pipeline);

dotenv.config();
async function 下载() {
  const response = await fetch(zipUrl, { method: 'GET', headers: { Authorization: process.env.PARATRANZ_TOKEN }});
  await streamPipeline(response.body, unzipper.Extract({ path: unzipOutputPath }));
  if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);
}
下载().catch(console.error);
