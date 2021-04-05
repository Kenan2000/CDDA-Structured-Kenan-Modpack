const dotenv = require('dotenv');
const fetch = require('node-fetch');

// 别忘了把 paratranz API 的 .env 文件黏贴到文件夹里！
dotenv.config();

const authHeader = {
  headers: { Authorization: process.env.PARATRANZ_TOKEN },
};
function paratranzGenerateZip() {
  return fetch('https://paratranz.cn/api/projects/2240/artifacts', authHeader).then(() =>
    fetch('https://paratranz.cn/api/projects/2240/jobs?type=buildProject', authHeader)
  );
}

paratranzGenerateZip().then(console.log).catch(console.error);
