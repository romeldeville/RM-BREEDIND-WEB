FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
COPY dist/rm-breeding-web ./dist/rm-breeding-web
EXPOSE 4000
CMD ["node", "dist/rm-breeding-web/server/server.mjs"]
