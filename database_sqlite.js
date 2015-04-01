module.exports = {
    create: function(db)
    {
        console.log("create database")
        db.serialize(function(){
            db.run('CREATE TABLE items (' +
            'title TEXT,' +
            'description TEXT,' +
            'level INTEGER,' +
            'id INTEGER PRIMARY KEY AUTOINCREMENT' +
            ')'
            );
        });
    },
    add: function(db,title,description)
    {
        console.log("insert into database")
        db.serialize(function(){
            var stmt = db.prepare("INSERT INTO items VALUES (?,?,?,?)");
            stmt.run([title,description,0]);
            stmt.finalize();
        });
    },
    queryall: function(db,fn)
    {
        console.log("query database")       
        db.serialize(function(){
            db.all("SELECT title, description, level, id FROM items ORDER BY level ASC",function(err,rows)
            {
                if (err){
                    console.log(err)
                } 
                else
                {
                    fn(rows);
                }
            });
        });
    },
    query: function(db,id,fn)
    {
        console.log("query id database");
        db.serialize(function(){
            db.each("SELECT title, description, level, id FROM items WHERE id=? LIMIT 1",id,function(err,row)
            {
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
    },
    update: function(db,title,description,level,id)
    {
        
        db.serialize(function(){
            if (title.length){
                console.log("update database");
                db.run("UPDATE items SET title=?, description=?, level=? WHERE id=?",[title,description,level,id]);
            } else {
                console.log("delete database row");
                db.run("DELETE FROM items WHERE id=?",id)
            };
        });
    }
}
