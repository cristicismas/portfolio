#!/usr/bin/node

const fs = require("fs");
const path = require("path");

function getFilePaths(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      getFilePaths(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

function readFileToString(filePath) {
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    throw error;
  }
}

function getMarkdownTitle(markdown) {
  const lines = markdown.split("\n");

  for (const line of lines) {
    if (line.trim().startsWith("#")) {
      return line.trim().replace("# ", "");
    }
  }

  return null;
}

function getMarkdownDescription(markdown) {
  const lines = markdown.split("\n");

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith("## ") || lines[i].trim() === "##") {
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() !== "") {
          return lines[j].trim();
        }
      }
      return null;
    }
  }

  return null;
}

try {
  const files = getFilePaths("./blog");

  for (const file of files) {
    const md_path = file.replace("blog", "blog-md").replace(".html", ".md");

    const md_content = readFileToString(md_path);
    let html_content = readFileToString(file);

    const md_title = getMarkdownTitle(md_content) || "";
    const md_description = getMarkdownDescription(md_content) || "";

    html_content = html_content.replaceAll("{{ html_title }}", md_title);
    html_content = html_content.replaceAll(
      "{{ html_description }}",
      md_description,
    );

    fs.writeFileSync(file, html_content, "utf8");
  }
} catch (err) {
  console.error("Error:", err.message);
}
