/*\
title: $:/core/modules/indexers/imgbacklinks-indexer.js
type: application/javascript
module-type: indexer

Indexes the tiddlers' imgbacklinks

\*/
(function(){

/*jslint node: true, browser: true */
/*global modules: false */
"use strict";

function extractLinks(parseTreeRoot) {
	// Count up the links
	var links = [],
		checkParseTree = function(parseTree) {
			for(var t=0; t<parseTree.length; t++) {
				var parseTreeNode = parseTree[t];
				if(parseTreeNode.type === "link" && parseTreeNode.attributes.to && parseTreeNode.attributes.to.type === "string") {
					var value = parseTreeNode.attributes.to.value;
					if(links.indexOf(value) === -1) {
						links.push(value);
					}
				}
				if(parseTreeNode.children) {
					checkParseTree(parseTreeNode.children);
				}
			}
		};
	checkParseTree(parseTreeRoot);
	return links;
};



function ImgBacklinksIndexer(wiki) {
	this.wiki = wiki;
}

ImgBacklinksIndexer.prototype.init = function() {
	this.index = null;
}

ImgBacklinksIndexer.prototype.rebuild = function() {
	this.index = null;
}

ImgBacklinksIndexer.prototype._getLinks = function(tiddler) {
	var parser =  this.wiki.parseText(tiddler.fields.type, tiddler.fields.text, {});
	if(parser) {
		return extractLinks(parser.tree);
	}
	return [];
}

ImgBacklinksIndexer.prototype.update = function(updateDescriptor) {
	if(!this.index) {
		return;
	}
	var newLinks = [],
	    oldLinks = [],
	    self = this;
	if(updateDescriptor.old.exists) {
		oldLinks = this._getLinks(updateDescriptor.old.tiddler);
	}
	if(updateDescriptor.new.exists) {
		newLinks = this._getLinks(updateDescriptor.new.tiddler);
	}

	$tw.utils.each(oldLinks,function(link) {
		if(self.index[link]) {
			delete self.index[link][updateDescriptor.old.tiddler.fields.title];
		}
	});
	$tw.utils.each(newLinks,function(link) {
		if(!self.index[link]) {
			self.index[link] = Object.create(null);
		}
		self.index[link][updateDescriptor.new.tiddler.fields.title] = true;
	});
}

ImgBacklinksIndexer.prototype.lookup = function(title) {
	if(!this.index) {
		this.index = Object.create(null);
		var self = this;
		this.wiki.forEachTiddler(function(title,tiddler) {
			var links = self._getLinks(tiddler);
			$tw.utils.each(links, function(link) {
				if(!self.index[link]) {
					self.index[link] = Object.create(null);
				}
				self.index[link][title] = true;
			});
		});
	}
	if(this.index[title]) {
		return Object.keys(this.index[title]);
	} else {
		return [];
	}
}

exports.ImgBacklinksIndexer = ImgBacklinksIndexer;

})();
