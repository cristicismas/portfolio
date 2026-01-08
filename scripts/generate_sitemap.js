#!/usr/bin/node

const fs = require("fs");
const path = require("path");

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getFileModifiedDateFormatted(filePath) {
  const stats = fs.statSync(filePath);
  return formatDate(stats.mtime);
}

const generateUrl = (path) => {
  return `
  <url>
    <loc>https://cristi.webcc.uk/${path}</loc>
    <lastmod>${getFileModifiedDateFormatted(`../${path}`)}</lastmod>
  </url>`;
};

const getAllFilesSync = (dirPath, arrayOfFiles = []) => {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const full_path = path.join(dirPath, file);

    if (fs.statSync(full_path).isDirectory()) {
      arrayOfFiles = getAllFilesSync(full_path, arrayOfFiles);
    } else {
      arrayOfFiles.push(full_path);
    }
  });

  return arrayOfFiles;
};

const blog_paths = getAllFilesSync("../blog");

const all_paths = [
  "index.html",
  "blog.html",
  "projects.html",
  ...blog_paths.map((path) => path.slice(3)),
];

const xml = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all_paths.map((path) => generateUrl(path)).join("\n")}
</urlset>`;

fs.writeFileSync("../sitemap.xml", xml, "utf8");

console.log("Generated sitemap for paths: ", all_paths);
