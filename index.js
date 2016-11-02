"use strict";
const rp = require('request-promise');
const cheerio  = require('cheerio');

const options =  {
    uri: 'http://lists.memo.ru',
    transform: function (body) {
        return cheerio.load(body);
    }
}

rp(options)
    //
    .then(extractLinksFromMainPage($))

    .catch(function(err){
        console.log("parsing error")
    });

functions extractLinksFromMainPage($){
    let links = [];
    $('.alefbet a')
        .each(function () {
            links.push($(this).attr('href'));
        })
    return links;
}