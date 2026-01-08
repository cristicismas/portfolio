#!/bin/bash

set -eu

out_path="./blog/"

mkdir -p blog
rm -r ./blog

html_template=$(cat "./blog-template.html")

# Function to escape basic HTML/XML special characters
escape_for_replacement() {
    local str="$1"
    # Only escape & (others are usually fine in HTML context)
    echo "${str//&/\\&}"
}

# Recursively find all files in the blog-md directory
find blog-md/ -maxdepth 3 -type f -name "*" | while read -r filename; do
    filename="./${filename}"

    # Remove the begining 10 characters ("./blog-md/") and replace them with the out path ("./blog/")
    file_out_path="${out_path}${filename:10}"
    # Replace .md with .html
    file_out_path="${file_out_path/.md/.html}"

    # Make sure the parent directory exists by making it exist
    file_out_dir=$(dirname "$file_out_path")
    mkdir -p $file_out_dir

    # Convert the markdown file to html and output it into this variable
    converted_html=$(./md_to_html $filename --inline)


    # Escape only the & character in the converted_html
    escaped_html=$(escape_for_replacement "$converted_html")

    # Replace the {{ dynamic_html }} string in the html template with our converted html
    final_output="${html_template//\{\{ dynamic_html \}\}/$escaped_html}"

    # Write to the output path
    echo "${final_output}" > $file_out_path
    echo "Converted $filename to $file_out_path"
done

