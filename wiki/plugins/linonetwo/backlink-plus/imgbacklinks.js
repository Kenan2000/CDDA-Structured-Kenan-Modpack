/*\
title: $:/core/modules/filters/imgbacklinks.js
type: application/javascript
module-type: filteroperator

Filter operator for returning all the usage of an img tiddler

\*/
(function () {
  /*jslint node: true, browser: true */
  /*global $tw: false */
  'use strict';

  /*
Export our filter function
*/
  exports.imgbacklinks = function (source, operator, options) {
    var results = [];
    source(function (tiddler, title) {
      $tw.utils.pushTop(results, options.wiki.getTiddlerBacklinks(title));
    });
    return results;
  };
})();
