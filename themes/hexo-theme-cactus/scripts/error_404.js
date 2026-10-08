/**
* error 404 page Generator
* @description generate the 404.html in root directory
*/

hexo.extend.generator.register('error_404', function () {
    var languages = Array.isArray(hexo.config.language) ? hexo.config.language : [hexo.config.language];
    languages = languages.filter(function (lang) { return lang && lang !== 'default'; });
    return languages.map(function (lang, index) {
        return {
            path: index === 0 ? '404.html' : lang + '/404.html',
            data: { lang: lang },
            layout: '404'
        };
    });
})