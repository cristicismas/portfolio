#!/usr/bin/bash

./convert_blogs_to_html.sh
./generate_sitemap.js

echo "Creating out directory and copying all relevant files there..."
mkdir -p out

rm -r out/*

cp -r blog out
cp -r font out
cp -r icons out
cp -r images out
cp -r ./*.html out
cp -r ./*.js out
cp -r ./*.css out
cp -r Dockerfile out
cp -r favicon.ico out

cp -r robots.txt out
cp -r sitemap.xml out


echo "Successfully built out/ directory"

echo "Syncing to remote server..."

rsync -avz -e "ssh -p 22 -i ~/.ssh/my_server" --exclude=.git/ ./out/* cristi-server@webcc.uk:/home/cristi/docker/swag/portfolio

echo "Successfully to remote server"

echo "Rebuilding image..."

ssh cristi-server@webcc.uk 'cd /home/cristi/docker/swag && docker-compose up portfolio -d --build --remove-orphans'

echo "Sucessfully rebuilt the portfolio image"
