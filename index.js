var _ = require('lodash'),
    fs = require('fs'),
    helpers = require('./helpers');

var casper = require("casper").create({
    pageSettings: {
        loadImages: true,
        loadPlugins: false
    },
    viewportSize: {
        width: 1600,
        height: 950
    },
    // verbose: true,
    // logLevel: 'debug'
});
var checked = [];
var currentLink = 0;
var upTo = ~~casper.cli.get('max-depth') || 1000;
var url = casper.cli.get(0);
var baseUrl = url;
var links = [url];
var sitemap = {};
 
// filter out the links that are already checked or does not belong in the same domain
function urlsToScrape(urls) {
	// console.log('total links: ', urls.length);
    var cleanUrls = []

    _.each(_.unique(urls), function(url) {
        var parsedUrl = helpers.absoluteUri(baseUrl, url);
        if (!_.contains(checked, parsedUrl) && parsedUrl.indexOf(baseUrl) === 0) {
            cleanUrls.push(parsedUrl);
        }
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
    });
    
    // this.wait(10000);

    // this.then(function(res) {
        // helpers.sendImageToOctopus(this);
    // });

    this.then(function() {
        var newUrls = getLinksOnPage.call(this);

        // get new urls on the page that needs to be crawled
        links = _.union(links, urlsToScrape(newUrls));
        // this.echo(filteredUrls.length + " new links found on " + url);
    });
}
 
// Fetch all <a> tags from the page and return the href attr from each
function getLinksOnPage() {
    var links = this.evaluate(function () {
        var hrefs = __utils__.findAll('a[href]').map(function(node) {
            return node.getAttribute('href');
        });

        return hrefs;
    });

    return links;
}
 
// As long as it has a next link, and is under the maximum limit, will keep running
function iteration() {
    // exit if we cross the max-depth level 
    if (currentLink >= upTo) {
        casper.echo('Maximum depth exceeded!', 'WARNING');
        return casper.exit();
    }

    // exit if there are no more links to be crawled
    if (!links[currentLink]) {
        casper.echo('All Linked Pages are crawled', 'INFO');
        return casper.exit();
    }

    sitemap[links[currentLink]] = []; // an empty container for all the assets on page
    crawl.call(this, links[currentLink]);
    currentLink++;
    this.run(iteration);
}

function storeSiteMap() {
    if (_.isEmpty(sitemap)) {
        casper.echo('No sitemap has been created', 'WARNING');
        return;
    }

    var currentFile = require('system').args[3],
        currentFilePath = fs.absolute(currentFile).split('/'),
        currentFilePath = currentFilePath.splice(0, currentFilePath.length - 1).join("/");

    var now = new Date(),
        filename = currentFilePath +'/sitemaps/'+ now.getTime() +'.json';
    // console.log(_.size(sitemap), filename, JSON.stringify(sitemap).length);

    fs.write(filename, JSON.stringify(sitemap, null, 2));
    casper.echo('total pages: '+ _.size(sitemap));
    casper.echo('Sitemap stored in file: '+ filename, 'TRACE');
}
 
if (!url) {
    casper.warn('No url passed, aborting.').exit();
}

casper.on('resource.received', function(resource) {
    var currentPage = sitemap[links[currentLink-1]],
        isDataUri = resource.url.indexOf('data:') === 0,
        staticContentMatcher = new RegExp("javascript|css|image|video", "i"),
        isStaticContent = staticContentMatcher.exec(resource.contentType),
        alreadyIndexed = _.contains(currentPage, resource.url);

    if (!alreadyIndexed && isStaticContent && !isDataUri) {
        currentPage.push(resource.url);
    }
});

casper.on('exit', function () {
    storeSiteMap();
});
 
casper.start().then(function() {
    this.echo("Starting");
}).run(iteration);