//convert subbable sql database to mongodb
var common = require('/var/www/common/common');
var cheerio = require('cheerio');
var request = require('request');
var mariadb = require('mysql');
var mongoose = require('mongoose');

var myDate = new Date();
var url = 'http://subbable.com/creators';
var dbData = [];  //holds full sql dump

var mariaConnection;
var dbVars = common.dbVars;
dbVars.database = 'subbable';

var subbableCon = mongoose.createConnection('mongodb://localhost/subbable');
var scrapeSchema = new mongoose.Schema({
  name: String,
  timestamp: Number,
  funding: Number,
  subs: Number,
});
var scrapeModel = subbableCon.model('scrape', scrapeSchema);

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

mariaConnection.query('SELECT * FROM subbable_subs ORDER BY id', function(err, rows){
  console.log(rows.length + ' rows pulled from SQL tables');
  for(var rep=0;rep<rows.length;rep++){
    dbData.push(rows[rep]);
  }
  mariaConnection.end();
  pushMongo(0);
});

function pushMongo(rep){
  if(rep > (dbData.length - 1)){console.log('finished! ' + (rep - 1) + ' rows added to mongoDB'); return;}
  var scrape = new scrapeModel({
    name: dbData[rep].name,
    timestamp:  dbData[rep].timestamp,
    funding: dbData[rep].funding,
    subs: dbData[rep].subs,
  });
  if(rep%1000 == 0) console.log('saving: ' + scrape);
  scrape.save(function(err){
    if(err) {
      console.log(err);
    }else{
      if(rep%1000 == 0){console.log('mongo entry made: ' + rep);}
      pushMongo(rep + 1);
    }
  });
}

