// db.js - Database API for Toby
// Copyright (C) 2016 Frank Hale <frankhale@gmail.com>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

var DB = (function() {

  let _export = {};

  const _ = require("lodash"),
        sqlite3 = require("sqlite3").verbose(),
        path = require("path"),
        dataPath = `${__dirname}${path.sep}..${path.sep}data`,
        db = new sqlite3.Database(`${dataPath}${path.sep}videoDB`);

  _export.importIntoDB = function(videoData) {
    db.serialize(function() {
      db.run("CREATE TABLE IF NOT EXISTS videos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, ytid  TEXT, [group] TEXT)");

      db.each("SELECT COUNT(*) as count FROM videos", function(err, row) {
        _.forEach(videoData, function(g) {
          _.forEach(g.entries, function(e) {
            _export.getVideoFromDB(e.ytid, function(row) {
              if(row === undefined && g.group !== "Recently Played") {
                //console.log(row);
                console.log(`importing ${e.title} | ${g.group}`);
                db.run("INSERT into videos(title,ytid,[group]) VALUES (?,?,?)", [ e.title, e.ytid, g.group ]);
              }
            });
          });
        });
      });
    });
  };

  _export.getAllVideosFromDB = function(finished) {
    db.all("SELECT title, ytid, [group] FROM videos WHERE [group] IS NOT 'Recently Played'", function(err, rows) {
      if(finished !== undefined) {
        var _rows = _.forEach(rows, function(d) {
          d.isArchived = true;
        });

        finished(_rows);
      }
    });
  };

  _export.getAllVideosOrderedByGroupDB = function(finished) {
    db.all("SELECT title, ytid, [group] FROM videos ORDER BY [group]", function(err, rows) {
      if(finished !== undefined) {
        finished(rows);
      }
    });
  };

  _export.getVideoFromDB = function(ytid, finished) {
    db.get("SELECT title, ytid, [group] FROM videos WHERE ytid = ? AND [group] IS NOT 'Recently Played'", [ytid], function(err, row) {
      if(finished !== undefined) {
        finished(row);
      }
    });
  };

  _export.getAllGroupsFromDB = function(finished) {
    db.all("SELECT DISTINCT [group] FROM videos", function(err, rows) {
      if(finished !== undefined) {
        finished(rows);
      }
    });
  };

  _export.getAllVideosForGroupFromDB = function(group, finished) {
    db.all("SELECT title, ytid, [group] FROM videos WHERE [group] = ?", [group], function(err, rows) {
      if(finished !== undefined) {
        let ytids = _.map(rows, function(r) { return r.ytid; });
        let ytids_in_string = _.map(ytids, function(r) { return `'${r}'`; }).join(",")

        db.all(`SELECT ytid FROM videos WHERE [group] != 'Recently Played' AND ytid IN (${ytids_in_string})`, function(err, ytids_found) {
          let _ytids = _.map(ytids_found, function(r) { return r.ytid; });
          let _rows = _.forEach(rows, function(d) {
            d.isArchived = (_.indexOf(_ytids, d.ytid) !== -1) ? true : false
          });

          finished(_rows);
        });
      }
    });
  };

  _export.getVideosWhereTitleLikeFromDB = function(searchTerm, finished) {
    searchTerm = `%${searchTerm.trim()}%`;

    db.all("SELECT title, ytid, [group] FROM videos WHERE title LIKE (?) AND [group] IS NOT 'Recently Played'", [searchTerm], function(err, rows) {
      if(finished !== undefined) {
        var _rows = _.forEach(rows, function(d) {
          d.isArchived = true;
        });

        finished(_rows);
      }
    });
  };

  _export.getVideosFromGroupWhereTitleLikeFromDB = function(searchTerm, group, finished) {
    searchTerm = `%${searchTerm.trim()}%`;

    db.all("SELECT title, ytid, [group] FROM videos WHERE title LIKE ? AND [group] = ?", [searchTerm, group], function(err, rows) {
      if(finished !== undefined) {
        var _rows = _.forEach(rows, function(d) {
          d.isArchived = true;
        });

        finished(_rows);
      }
    });
  };

  _export.addVideoToDB = function(title, ytid, group) {
    if(title !== undefined || title !== "" &&
       group !== undefined || group !== "") {
      db.get("SELECT ytid FROM videos WHERE ytid = ? AND [group] = ?", [ytid, group], function(err, rows) {
        if(rows === undefined) {
          console.log(`inserting ${title} into ${group}`);
          db.run("INSERT into videos(title,ytid,[group]) VALUES (?,?,?)", [ title, ytid, group ]);
        }
      });
    }
  };

  _export.deleteVideoFromDB = function(ytid) {
    db.get("SELECT ytid FROM videos WHERE ytid = (?)", [ytid], function(err, rows) {
      if(rows !== undefined) {
        db.run("DELETE FROM videos WHERE ytid = (?)", [ytid]);
      }
    });
  };

  _export.updateVideoFromDB = function(title, ytid, group) {
    if(title !== undefined || title !== "" &&
       group !== undefined || group !== "") {
        db.get("SELECT ytid FROM videos WHERE ytid = ?", [ytid], function(err, rows) {
          if(rows !== undefined) {
            db.run("UPDATE videos SET title = ?, group = ? WHERE ytid = ?", [title, group, ytid]);
          }
      });
    }
  };

  _export.deleteRecentlyPlayedVideosFromDB = function() {
    db.run("DELETE FROM videos WHERE [group] = 'Recently Played'");
  };

  _export.close = function() {
    db.close();
  };

  //db.run("INSERT into videos(title,ytid,[group]) VALUES (?,?,?)", [ "TEST", "ag3ZI4nA4IB", "TEST"]);
  // db.run("UPDATE videos SET title = (?), [group] = (?) WHERE ytid = (?)", ["FUCK", "FUCK", "ag3ZI4nA4IB"]);
  // db.get("SELECT * FROM videos WHERE ytid = (?)", ["ag3ZI4nA4IB"], function(err, row) {
  //   console.log(row);
  // });

  // getAllVideosFromDB(function(data) {
  //   console.log(data);
  // });

  // db.all("SELECT * FROM videos WHERE [group] = ?", ["EDM"], function(err, rows) {
  //   console.log(rows);
  // });

  // getVideosWhereTitleLikeFromDB("chris tomlin", function(data) {
  //   console.log(data);
  // });

  return _export;
})();

module.exports = DB;
