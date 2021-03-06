var common = require('/var/www/common/common');
var cheerio = require('cheerio');
var request = require('request');
var mariadb = require('mysql');

var myDate = new Date();
var url = 'http://subbable.com/creators';
var mariaConnection;
var dbVars = common.dbVars;
dbVars.database = 'subbable';

function mariaConHandler() {
	mariaConnection = mariadb.createConnection(dbVars);

	mariaConnection.connect(function(err){
		if(err){
			console.log('error while connecting to db: ', err);
			setTimeout(mariaConHandler, 2500);
		};
	});
	
	mariaConnection.on('error', function(err){
		console.log('db error: ', err);
		if(err.code ==='PROTOCOL_CONNECTION_LOST'){
			mariaConHandler();
		} else {
			throw err;
		}
	});
}

mariaConHandler();

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
					subs: parseInt(project$('span.number_of_subscribers').text().replace(',','')),
					timestamp: Date.now(),
					datetime: myDate.toUTCString()
					};
				console.log(tempRecord);
				var tempMaria = {
					name: tempRecord.name,
					funding: tempRecord.funding.replace('%', ''),
					subs: tempRecord.subs,
					timestamp: tempRecord.timestamp
				};
				mariaConnection.query('INSERT INTO subbable_subs SET ?',tempMaria, function(err, result){});
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
setInterval(pageScrape, (30 * 60 * 1000));

//mariaConnection.end();
