'use strict';

// Split index, archive, tag, and category lists by post.lang.
// hexo-generator-i18n only copies those pages and keeps every language in one list.

const LIST_GENERATORS = ['index', 'archive', 'tag', 'category'];

function languagesOf(config) {
  const languages = Array.isArray(config.language) ? config.language.slice() : [config.language];
  return languages.filter(lang => lang && lang !== 'default');
}

function scopedLocals(locals, lang, fallback) {
  const match = post => (post.lang || fallback) === lang;
  const posts = locals.posts.filter(match);

  const tags = [];
  locals.tags.forEach(tag => {
    const tagPosts = tag.posts.filter(match);
    if (!tagPosts.length) return;
    tags.push({
      name: tag.name,
      slug: tag.slug,
      path: tag.path,
      permalink: tag.permalink,
      length: tagPosts.length,
      posts: tagPosts
    });
  });

  const categories = [];
  locals.categories.forEach(category => {
    const categoryPosts = category.posts.filter(match);
    if (!categoryPosts.length) return;
    categories.push({
      name: category.name,
      slug: category.slug,
      path: category.path,
      permalink: category.permalink,
      length: categoryPosts.length,
      posts: categoryPosts
    });
  });

  return Object.assign({}, locals, { posts, tags, categories });
}

function withLang(lang, value) {
  return value ? `${lang}/${value}` : `${lang}/`;
}

function prefixPages(pages, lang, isDefault) {
  if (!pages) return [];
  return pages.map(page => {
    const data = Object.assign({}, page.data, { lang });
    if (isDefault) return Object.assign({}, page, { data });

    // Page 1 of the index has an empty path. Leaving that empty makes the
    // previous-page link resolve to the default-language home.
    data.base = withLang(lang, data.base);
    data.current_url = withLang(lang, data.current_url);
    if (data.prev) data.prev_link = withLang(lang, data.prev_link);
    if (data.next) data.next_link = withLang(lang, data.next_link);

    return Object.assign({}, page, {
      path: `${lang}/${page.path || ''}`,
      data
    });
  });
}

const originals = {};
LIST_GENERATORS.forEach(name => {
  originals[name] = hexo.extend.generator.get(name);
});

if (hexo.config.i18n && Array.isArray(hexo.config.i18n.generator)) {
  hexo.config.i18n.generator = hexo.config.i18n.generator.filter(name => LIST_GENERATORS.indexOf(name) === -1);
}

LIST_GENERATORS.forEach(name => {
  const original = originals[name];
  if (!original) return;

  hexo.extend.generator.register(name, function(locals) {
    const languages = languagesOf(this.config);
    const fallback = languages[0];

    return Promise.all(languages.map((lang, index) => {
      const scoped = scopedLocals(locals, lang, fallback);
      return Promise.resolve(original.call(this, scoped)).then(pages => {
        return prefixPages(pages, lang, index === 0);
      });
    })).then(groups => groups.reduce((all, pages) => all.concat(pages), []));
  });
});
