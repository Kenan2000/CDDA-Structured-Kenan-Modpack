
/*
Return an array of tiddler titles that link to the specified tiddler
*/
exports.getTiddlerBacklinks = function(targetTitle) {
	var self = this,
		backlinksIndexer = this.getIndexer("BacklinksIndexer"),
		backlinks = backlinksIndexer && backlinksIndexer.lookup(targetTitle);

	if(!backlinks) {
		backlinks = [];
		this.forEachTiddler(function(title,tiddler) {
			var links = self.getTiddlerLinks(title);
			if(links.indexOf(targetTitle) !== -1) {
				backlinks.push(title);
			}
		});
	}
	return backlinks;
};