var cheerio = require('cheerio');
var request = require('request');
var couchdb = require('felix-couchdb');

var myDate = new Date();
var url = 'http://subbable.com/creators';
var dbClient = couchdb.createClient(443, 'danheidel.cloudant.com', 'danheidel', 'dpPG0mr2yuhDUFRqCALb', 0, 'true');
var subbableDb = dbClient.db('subbable-scrape');

var designDoc = {
	views:{
		timestamp:{
			map: function(doc){
				emit(doc.timestamp, 1)
			},
		},
	},
	indexes: {
		name: {
			index: function(doc){
				index("name", doc.name);/*
				index("timestamp", (function(iTime){
					var tempDate = new Date;
					tempDate.setTime(iTime);
					return tempDate.toUTCString();
				})(doc.timestamp), {store: "yes"});
				index("funding", doc.funding, {store:"yes"});
				index("subs", doc.subs, {store:"yes"});*/
			}
		}
	}
};

subbableDb.getDoc('_design/views', function(err, data){
	if(err){
		//if there is no existing _design/views
		console.log(err);
		console.log('no design doc, creating new');
		subbableDb.saveDoc('_design/views', designDoc, function(err, data){
			if(err){console.log(err);}
		});
		return;
	}
	//if there is an existing _design/views
	designDoc._rev = data._rev;
	subbableDb.saveDoc('_design/views', designDoc, function(){
		if(err){console.log(err);}
	});
});
