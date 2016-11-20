"use strict";

const rp = require('./throttle');
const resolveUrl = require('url').resolve;
const cheerio  = require('cheerio');

const encoding ='win1251';

const PromisePool = require('es6-promise-pool');

let promiseProducer = function* () {
   for(let i = 22; i <= 38; i++){
        yield getPart(i);
    }
}

const promiseIterator = promiseProducer();
const pool = new PromisePool(promiseIterator, 5);
pool.start()
    .then(() => console.log(`Complete`));


//
// (async function para(f, n){
//     let result = [];
//     let start = 17;
//     for (let i = 0; i < n; i++){
//         result.push(f(start + i));
//     }
//     return await Promise.all(result);
// }(getPart, 5))

function* generateUrls(d){
    const root = 'http://lists.memo.ru/d';
    let max = 500;
    if ( d < 1 || d < 1){
        return;
    }
    if ( d == 38){
        max = 475;
    }
    for ( let i = 1; i <= max ; i++){
        yield root + `${d}/f${i}.htm`
    }
}

async function getNamesFromPage (url){
        try{
            var body = await rp(url);
        }catch(e){
            try {
                var body = await rp(url);
            }catch(e){
                throw new Error(e);
            }
        }

    let people = extractNamesDataFromPage(body);
    return people;
}

const fs = require('fs');

async function getPart(d){
    let peopleFile = [];
    for (let url of generateUrls(d)){
        let people = await getNamesFromPage(url);
        peopleFile.push(people);
    }
    await writeOut(peopleFile, d);
}

function writeOut (data, fileName){
    fs.writeFile(`./data/${fileName}.json`, JSON.stringify(data), (error) => {
        if (error) {
            console.log(`Failed to create file ${fileName}`);
            throw new Error(err);
        }
    })
}

function extractNamesDataFromPage(body) {
    let people = [];
    const $ = cheerio.load(fixEncoding(body));

    $('.list-right li').each(function(){
        let person = {};
        person.name = $('.name', this).text();
        person.content = $('.cont', this).text();;
        person.source = $('.author', this).text();

        people.push(person);
    });
    return people;
}

function fixEncoding(binary) {
    const iconv = require('iconv-lite');
    return iconv.decode(binary, encoding);
}
