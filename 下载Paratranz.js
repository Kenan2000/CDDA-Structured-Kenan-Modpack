const fs = require('fs-jetpack');
const url = require('url');
const path = require('path');
const fetch = require('node-fetch');
const { pipeline } = require('stream');
const { promisify } = require('util');
const dotenv = require('dotenv');
const unzipper = require('unzipper');

const zipUrl = 'https://paratranz.cn/api/projects/2240/artifacts/download';
const zipPath = path.join(__dirname, 'paratranz.zip');
const unzipOutputPath = path.join(__dirname, 'paratranz');
const downloadedTranslationsPath = path.join(unzipOutputPath, 'utf8');

const streamPipeline = promisify(pipeline);

dotenv.config();
async function 下载() {
  // const response = await fetch(zipUrl, { method: 'GET', headers: { Authorization: process.env.PARATRANZ_TOKEN } });
  // await streamPipeline(response.body, unzipper.Extract({ path: unzipOutputPath }));
  // if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);
}
下载()
  .then(async () => {
    for (const downloadedFileName of fs.list(downloadedTranslationsPath).filter((name) => name.endsWith('.json'))) {
      // DEBUG: console
      console.log(`downloadedFileName`, path.join(downloadedTranslationsPath, downloadedFileName), path.resolve(downloadedTranslationsPath, '..', '..', '中文翻译', downloadedFileName));
      fs.copy(
        path.join(downloadedTranslationsPath, downloadedFileName),
        path.resolve(downloadedTranslationsPath, '..', '中文翻译', downloadedFileName),
        { overwrite: true }
      );
    }
  })
  .catch(console.error);
