'use strict';

// One feed per language. The stock generator puts Chinese and English posts
// into the same atom.xml.

const feedFn = require('hexo-generator-feed/lib/generator');

function languagesOf(config) {
  const languages = Array.isArray(config.language) ? config.language.slice() : [config.language];
  return languages.filter(lang => lang && lang !== 'default');
}

function languageDescription(hexo, lang) {
  const data = hexo.locals.get('data');
  const pack = data && data.languages && data.languages[lang];
  return pack && pack.description;
}

const feedConfig = hexo.config.feed;
const feedType = feedConfig && (typeof feedConfig.type === 'string' ? feedConfig.type : 'atom');
const feedPath = feedConfig && (typeof feedConfig.path === 'string' ? feedConfig.path : '');

if (feedFn && feedPath && hexo.extend.generator.get(feedType)) {
  hexo.extend.generator.register(feedType, function (locals) {
    const languages = languagesOf(this.config);
    const fallback = languages[0];

    return languages.map((lang, index) => {
      const posts = locals.posts.filter(post => (post.lang || fallback) === lang);
      if (!posts.length) return null;

      const description = languageDescription(this, lang);
      const context = Object.create(this);
      context.config = Object.assign({}, this.config, {
        language: lang,
        description: description || this.config.description
      });

      const path = index === 0 ? feedPath : `${lang}/${feedPath}`;
      return feedFn.call(context, Object.assign({}, locals, { posts }), feedType, path);
    }).filter(Boolean);
  });

  // Stock autodiscovery always advertises the default-language feed.
  hexo.extend.filter.register('after_render:html', function (html) {
    if (!html || html.indexOf('application/atom+xml') === -1) return html;
    const english = /property="og:url" content="[^"]*\/en\//.test(html)
      || /content="[^"]*\/en\/[^"]*" property="og:url"/.test(html);
    if (!english) return html;
    return html.replace(/href="([^"]*\/)atom\.xml"/g, 'href="$1en/atom.xml"');
  }, 20);
}
