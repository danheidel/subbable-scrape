var cheerio = require('cheerio');
var request = require('request');
var couchdb = require('felix-couchdb');
var mariadb = require('mysql');

var myDate = new Date();
var url = 'http://subbable.com/creators';
var dbClient = couchdb.createClient(443, 'danheidel.cloudant.com', 'danheidel', 'dpPG0mr2yuhDUFRqCALb', 0, 'true');
var subbableDb = dbClient.db('subbable-scrape');


console.log(myDate.getTime());

dbClient.request({
	path:'/crud/welcome',
	method:'get',
	},
	function(err, data){
		console.log('err: ' + err);
		console.log(data);
	});

function projectScrape(urlList){
	urlList.forEach(function(frag){
		request(frag.url, (function(frag){
			return function(err, resp, body){
				if(err) console.log('error: ' + err);
				project$ = cheerio.load(body);
				myDate.setTime(Date.now());
				var tempRecord = {
					name: frag.name,
					funding: project$('span.monthly_funding_goal_percentage').text(),
					subs: project$('span.number_of_subscribers').text(),
					timestamp: Date.now(),
					datetime: myDate.toUTCString()
					};
				console.log(tempRecord);
				subbableDb.saveDoc(tempRecord);
			}
		})(frag));
	});
};
function pageScrape(){
	request(url, function(err, resp, body){
		if(err) console.log("error: " + err);
		var urlList = [];
		$ = cheerio.load(body);
		$('.projects > li > a').each(function(){
			urlList.push(
				{'url': 'http://subbable.com' + this.attr('href'),
				'name': this.attr('href').trim().replace('\/', '')}
			);
		});
		projectScrape(urlList);
	});
};

pageScrape();
setInterval(pageScrape, (5 /*minutes*/ * 60 * 1000));
