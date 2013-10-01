var cheerio = require('cheerio');
var request = require('request');
var couchdb = require('felix-couchdb');
var mariadb = require('mysql');

var myDate = new Date();
var url = 'http://subbable.com/creators';
var dbClient = couchdb.createClient(443, 'danheidel.cloudant.com', 'danheidel', 'dpPG0mr2yuhDUFRqCALb', 0, 'true');
var subbableDb = dbClient.db('subbable-scrape');
var mariaConnection;

function mariaConHandler() {
	mariaConnection = mariadb.createConnection({
		host:	"localhost",
		user:	"root",
		password:"Ih35MV9XqLcS",
		database:"subbable",
	});

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
					subs: project$('span.number_of_subscribers').text(),
					timestamp: Date.now(),
					datetime: myDate.toUTCString()
					};
				console.log(tempRecord);
				subbableDb.saveDoc(tempRecord);
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
