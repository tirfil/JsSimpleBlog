var sqlite3 = require("sqlite3").verbose();

function Database(file) {
    this.db = new sqlite3.Database(file);
}

Database.prototype.create = function(){
    console.log("create database");
    var db = this.db;
    db.serialize(function(){
        db.run('CREATE TABLE items (' +
        'title TEXT,' +
        'description TEXT,' +
        'level INTEGER,' +
        'id INTEGER PRIMARY KEY AUTOINCREMENT' +
        ')'
        );
    });
};

Database.prototype.add = function(title,description){
    console.log("insert into database");
    var db = this.db;
    db.serialize(function(){
        var stmt = db.prepare("INSERT INTO items VALUES (?,?,?,?)");
        stmt.run([title,description,0]);
        stmt.finalize();
    });
};

Database.prototype.queryall = function(fn){
    console.log("query database");   
    var db = this.db;
    db.serialize(function(){
        db.all("SELECT title, description, level, id FROM items ORDER BY level ASC",function(err,rows){
            if (err){
                console.log(err)
            } 
            else
            {
                fn(rows);
            }
        });
    });
};

Database.prototype.query = function(id,fn){
    console.log("query id database");
    var db = this.db;
    db.serialize(function(){
        db.each("SELECT title, description, level, id FROM items WHERE id=? LIMIT 1",id,function(err,row){
            if (err){
                console.log(err)
            } 
            else
            {
                //console.log(row.title);
                fn(row);
            }
        });
    });
};

Database.prototype.update = function(title,description,level,id){
    var db = this.db;
    db.serialize(function(){
        if (title.length){
            console.log("update database");
            db.run("UPDATE items SET title=?, description=?, level=? WHERE id=?",[title,description,level,id]);
        } else {
            console.log("delete database row");
            db.run("DELETE FROM items WHERE id=?",id)
        };
    });
};

module.exports = Database;
