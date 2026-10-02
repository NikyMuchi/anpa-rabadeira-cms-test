const markdownIt = require("markdown-it");

module.exports = function (eleventyConfig) {
  // Markdown config
  const md = markdownIt({
    html: true,
    breaks: true,
    linkify: true,
  });
  eleventyConfig.setLibrary("md", md);

  // Passthrough copy
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/img");
  eleventyConfig.addPassthroughCopy("src/docs");
  eleventyConfig.addPassthroughCopy("emails");
  eleventyConfig.addPassthroughCopy("admin");

  // Collections
  eleventyConfig.addCollection("posts", function (collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/posts/*.md")
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("pages", function (collectionApi) {
    return collectionApi.getFilteredByGlob(["src/pages/*.md", "src/pages/*.njk"]);
  });

  // navPages: pages visible in nav & quick-access, sorted by navOrder
  eleventyConfig.addCollection("navPages", function (collectionApi) {
    const seen = new Set();
    return collectionApi
      .getFilteredByGlob(["src/pages/*.md", "src/pages/*.njk"])
      .filter((p) => {
        if (p.data.showInNav === false) return false;
        if (p.data.pagination && p.data.pagination.pageNumber > 0) return false;
        const key = p.data.navLabel || p.data.title;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => (a.data.navOrder || 99) - (b.data.navOrder || 99));
  });

  // Date filters (Galician)
  const mesesGalego = [
    "xaneiro", "febreiro", "marzo", "abril", "maio", "xuño",
    "xullo", "agosto", "setembro", "outubro", "novembro", "decembro",
  ];

  eleventyConfig.addFilter("dataGalega", (dateObj) => {
    const d = new Date(dateObj);
    return `${d.getDate()} de ${mesesGalego[d.getMonth()]} de ${d.getFullYear()}`;
  });

  eleventyConfig.addFilter("isoDate", (dateObj) => {
    return new Date(dateObj).toISOString().split("T")[0];
  });

  eleventyConfig.addFilter("excerpt", (content) => {
    if (!content) return "";
    const text = content.replace(/<[^>]+>/g, "").replace(/\n/g, " ").trim();
    return text.length > 180 ? text.substring(0, 180) + "…" : text;
  });

  eleventyConfig.addFilter("limit", (arr, limit) => {
    return arr.slice(0, limit);
  });

  eleventyConfig.addFilter("categoryFilter", (posts, category) => {
    return posts.filter(
      (p) => p.data.category && p.data.category === category
    );
  });

  eleventyConfig.addFilter("md", (content) => {
    if (!content) return "";
    return md.render(content);
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
