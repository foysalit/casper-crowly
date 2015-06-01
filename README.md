### How To Run

once you have cloned the repo, run `npm install`

if you have casperjs installed globally, you can simply run -
`casperjs --ssl-protocol=any index.js <url>`

OR run it with locally installed casperjs using the following - 
`./node_modules/.bin/casperjs --ssl-protocol=any index.js <url>`

an additional option `--max-depth` can be passed to the command to set how many pages you want to crawl.

### Tools
There are lots of tools out there to write a simple crawler/sitemap generator but most of the tools don't work very well when the sites are javascript heavy and the contents are filled in with javascript after page load. Which is the main reason I chose a [Casper.js](http://casperjs.org) for the task. It's a node.js based headless browser and I have used it for many projects before and quite comfortable in it. It uses phantom.js at it's core and provides a nice layer of utility toolset and api to work with.

The crawler uses lodash as a utility tool and fs module (provided by phantom.js *NOT* the default node.js fs module) to write the generated sitemap with all the static assets per page as json in a file.

For debugging visually I used [this tool](https://github.com/maciejjankowski/flaming-octo-puss) which I have contributed to as well.

### How does it work?
The crawler starts by loading the entry page defined by the command and builds scrapes the links found on the page and iterates the process for each link.

For each page crawled, it builds an array of all the static resources loaded on that page and stores it in an object where the key is the page url. The storage structure enables the tool to easily pretty print the object as a JSON string into a file.

The files are stored inside the `sitename/` folder and the filenames are nothing but a unix timestamp.

### Thoughts
1. Sometimes the resources are simply data uris which aren't really loaded from an external url so I decided to exclude them from the list.

2. One of the things that makes it hard to work with casper is keeping track of the context. Casper (or any js based headless browser that I know of) can change the context of the code from the node environment to the loaded page's environment and since it's all javascript, it's easy to get confused.

3. Casper.js provides some great options for debugging but even those can fall short in some cases. Which is why I found it extremely helpful to visually see what goes on during the crawling. Which is where the `flaming-octo-puss` repo comes in very handy.

4. I tried to implement the parsing of relative urls but it seemed to become more and more complex as I moved forward so I decided to use a piece of code that is already written and tested.

5. A lot of console.log()s and some other code are commented out and I left them that way since it might help you understand how I made progress through the codebase.

### Credits
The url parsing function was copied from here - [planzero.org blog](http://planzero.org/blog/2013/03/07/spidering_the_web_with_casperjs)

The basic structure of the crawler was written following [this gist](https://gist.github.com/n1k0/4509789) 