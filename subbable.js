var common = require('/var/www/common/common');
var cheerio = require('cheerio');
var request = require('request');
var mongoose = require('mongoose');

var myDate = new Date();
var url = 'http://subbable.com/creators';

//MongoDb stuff
var subbableCon = mongoose.createConnection('mongodb://localhost/subbable');
var scrapeSchema = new mongoose.Schema({
  name: String,
  timestamp: Number,
  funding: Number,
  subs: Number,
});
var scrapeModel = subbableCon.model('scrape', scrapeSchema);

function projectScrape(urlList){
	urlList.forEach(function(frag){
		request(frag.url, (function(frag){
			return function(err, resp, body){
				if(err) console.log('error: ' + err);
				project$ = cheerio.load(body);
				myDate.setTime(Date.now());
				
				var tempFunding = project$('span.monthly_funding_goal_percentage').text().replace('%', '');
				var tempSubs = parseInt(project$('span.number_of_subscribers').text().replace(',',''));
				tempSubs = isNaN(tempSubs)?-1:tempSubs;

        var scrape = new scrapeModel({
          name: frag.name,
          timestamp:  Date.now(),
          funding: tempFunding,
          subs: tempSubs
        });
        
        console.dir(scrape);
        
        scrape.save(function(err){
          if(err){
            console.log(err);
          }else{
            console.log('save successful for: ' + scrape.name);
          }
        });
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


function pushMongo(rep){
  if(rep > (dbData.length - 1)){console.log('finished! ' + (rep - 1) + ' rows added to mongoDB'); return;}
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
