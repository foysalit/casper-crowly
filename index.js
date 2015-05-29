var _ = require('lodash');

var casper = require("casper").create({
    pageSettings: {
        loadImages: false,
        loadPlugins: false
    },
    // verbose: true,
    // logLevel: 'debug'
});
var checked = [];
var currentLink = 0;
var fs = require('fs');
var upTo = ~~casper.cli.get('max-depth') || 100;
var url = casper.cli.get(0);
var baseUrl = url;
var links = [url];
var sitemap = {};
 
// filter out the links that are already checked or does not belong in the same domain
function urlsToScrape(urls) {
	// console.log('total links: ', urls.length);
    var cleanUrls = _.filter(_.unique(urls), function(url) {
        var hasHttp = url.indexOf('http') === 0,
            isClean = false;

        if (hasHttp) {
            isCLean = url.indexOf(baseUrl) === 0;
        } else {
            isCLean = url.indexOf('/') === 0;
        }
        // console.log('clean', isCLean);
        return isCLean;
    });

    cleanUrls = _.filter(cleanUrls, function(url) {
        return checked.indexOf(url) === -1;
    });

    // console.log('total clean urls', cleanUrls.length);
    return cleanUrls;
}
 
// Opens the page, perform tests and fetch next links
function crawl(url) {
    this.start().then(function() {
        this.echo('visiting: '+ url, 'COMMENT');
        this.open(url);
    	checked.push(url);
    	this.wait(2000);
    });

    // this.then(function(res) {
    //     sendImageToOctopus(this);
    // });

    this.then(function() {
        var newUrls = getLinksOnPage.call(this),
            filteredUrls = urlsToScrape(newUrls);

        links = _.filter(links.concat(filteredUrls), function(url) {
            return checked.indexOf(url) === -1;
        });

        // this.echo(filteredUrls.length + " new links found on " + url);
    });
}
 
// Fetch all <a> elements from the page and return the href attr from each
function getLinksOnPage() {
    function _fetchInternalLinks() {
        var links = __utils__.findAll('a[href]').map(function(node) {
            return node.getAttribute('href');
        });

        // console.log(links);
        return links;
    }
    return this.evaluate(_fetchInternalLinks);
}
 
// As long as it has a next link, and is under the maximum limit, will keep running
function iteration() {
    if (links[currentLink] && currentLink < upTo) {
        sitemap[links[currentLink]] = [];
        crawl.call(this, links[currentLink]);
        currentLink++;
        this.run(iteration);
    } else {
        this.echo("All done, " + checked.length + " links checked.");
        
        _.each(sitemap, function (resources, url) {
            casper.echo('Page:'+ url, 'INFO'    );
            
            casper.echo("Total Static Resources: "+ resources.length, 'PARAMETER');            
            // _.each(resources, function (resource) {
            //     console.log("\t\t", resource.url);
            // }); 
        });

        this.exit();
    }
}

function sendImageToOctopus(casper){
	console.log('sending image');
	casper.evaluate( function(img){
        __utils__.sendAJAX("http://localhost:8002/", 'POST', {
        	'img' : img 
        }, false);
    }, {
      	'img' : casper.captureBase64('png')
    }); // evaluate

} // show
 
if (!url) {
    casper.warn('No url passed, aborting.').exit();
}

casper.on('resource.received', function(resource) {
    // console.log(links[currentLink-1]);
    if (resource.url.indexOf('data:') === 0)
        return;

    sitemap[links[currentLink-1]].push(resource);
});
 
casper.start().then(function() {
    this.echo("Starting");
}).run(iteration);