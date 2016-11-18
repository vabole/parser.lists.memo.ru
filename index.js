"use strict";

const rp = require('request-promise-native');
const resolveUrl = require('url').resolve;
const cheerio  = require('cheerio');

const startingPage = 'http://lists.memo.ru/index1.htm';
const encoding ='win1251';

let people = [];

let options =  {
    uri: startingPage,
    encoding: null
};

rp(options)
    .then(function(body){
    return extractLinksFromMainPage(fixEncoding(body));
})

    // process all links to sublists
    .then( links => {
        // loging the link being processed
         console.log(links);
        return httpGetLinks(links)
    }).catch(errorHandler)
    .then(bodys => Promise.all(bodys))
    .then(bodys => bodys.map(extractLinksTolists))

    // flattening the array
    .then(linksArrayWithSubArrays => {
        //console.log(linksArrayWithSubArrays);
        let allLinks = [];
        linksArrayWithSubArrays.forEach(linksArray => {
            allLinks = allLinks.concat((linksArray));
        });
        return allLinks;
    })
    .then(links => httpGetLinks(links))
    .then(pages => {
        pages.forEach(extractNamesDataFromPage);
    })

    .then(writeOutData)

    .catch(error => {
        console.log(`${error.name}: ${error.message} \n${error.stack}`);
        console.log(`${error} \n${fixEncoding(error.error)}`);
    });


/***
 * extracting links to the pages with lists of names
 * @param $
 * @returns {Array}
 */
function extractLinksFromMainPage(body){
    let $ = cheerio.load(body);
    let links = [];
    $('.alefbet a')
        .each(function () {
            links.push( resolveUrl( startingPage, $(this).attr('href')))
        });

    return links;
}

function httpGetLinks(uris) {
    function accumulate(uris, i, bodies){
        if (i >= uris.length){
            return bodies;
        }

        options.uri = uris[i];
        console.log(options.uri);
        return rp(options).then(body => {
            return accumulate(uris, ++i, bodies.concat(body));
        }).catch(errorHandler)
    }

    return accumulate(uris, 0, []);
}

function extractLinksTolists(body) {
    let $ = cheerio.load(fixEncoding(body));
    let links = [];
    $('.doppoisk a').each( function(){
        const onclickJmpParameters = $(this).attr('onclick').slice(5, -1).split(',');
        let uri = `d${+onclickJmpParameters[0]}/f${+onclickJmpParameters[1]}.htm`;
        links.push(resolveUrl(startingPage, uri));
    });
    return links;
}

function extractNamesDataFromPage(body) {
    let $ = cheerio.load(fixEncoding(body));

    $('.list-right li').each(function(){
        let person = {};
        person.name = $('.name', this).text();
        person.content = $('.cont', this).text();;
        person.source = $('.author', this).text();

        people.push(person);
    });
}

function writeOutData() {
    require('fs').writeFileSync('./data/people.json', JSON.stringify(people, null, 4));
}

const iconv = require('iconv-lite');
function fixEncoding(binary) {
    return iconv.decode(binary, encoding);
}

function errorHandler(error) {
    console.log(error.stack);
}