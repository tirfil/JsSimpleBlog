var express = require('express');
var app = express();

var fs = require("fs");
var file = 'database.db';
var exists = fs.existsSync(file);
var sqlite3 = require("sqlite3").verbose();
var db = new sqlite3.Database(file);
var database = require("./database_sqlite.js");
if (!exists) {
    database.create(db);
}

function nl2br (str, is_xhtml) {
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}

function convert4rtf(str) {
    var n = str.length;
    var result = "";
    for (var i= 0; i<n; i++)
    {
        var code = str.charCodeAt(i);
        if (code > 127)
        {
            switch(code) {
                case 8217:
                    result = result + '\'';
                    break;
                case 8220:
                case 8221:
                    result = result + '\"';
                    break;
                default:
                    result = result + '\\\'' + code.toString(16);
            }
        } else {
            if ( code == 10 )
            {
                result = result + '\\par ';
            } else {
                result = result + str[i];
            }
        }
    }
    return result;
}

app.set('port', process.env.PORT || 3000);

// set up handlebars view engine
var handlebars = require('express3-handlebars').create({ defaultLayout:'main' });
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

//app.use(require('body-parser')());
var bodyParser  = require('body-parser');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
    database.queryall(db,function(all){
        for (var i=0; i < all.length; i++)
        {
            all[i].description = nl2br(all[i].description);
        }
        res.render('display',{all: all});
    });
});

app.get('/add',function(req,res){
    res.render('addf');
});

app.get('/display',function(req,res){
    database.queryall(db,function(all){
        for (var i=0; i < all.length; i++)
        {
            all[i].description = nl2br(all[i].description);
        }
        res.render('display',{all: all});
    });
});

app.get('/rtf',function(req,res){
    database.queryall(db,function(all){
        var buffer = '{\\rtf1\\ansi\\ansicpg1252\n\
{\\fonttbl\n\
{\\f1\\fswiss\\fcharset0\\fprq0\\fttruetype "Arial";}\n\
{\\f2\\froman\\fcharset0\\fprq0\\fttruetype "Times New Roman";}\n\
{\\f3\\fnull\\fcharset1\\fprq0\\fttruetype "Trebuchet MS";}}\n';
        for (var i=0; i < all.length; i++)
        {
            buffer = buffer.concat('{\\f2\\fs30\\b ');
            buffer = buffer.concat(convert4rtf(all[i].title));
            buffer = buffer.concat('}');
            
            buffer = buffer.concat('\\par');
            buffer = buffer.concat('\\par');
            buffer = buffer.concat('{\\f1\\fs24 ');
            buffer = buffer.concat(convert4rtf(all[i].description));
            buffer = buffer.concat('}');
            buffer = buffer.concat('\\par');
            buffer = buffer.concat('\\par');
        }
        buffer = buffer.concat('}');
        var now = new Date();
        var str = 'form-data; name=\"' + now.getTime().toString(16) + '\.rtf\"';
        res.set('Content-Disposition',str);
        res.type('text/rtf');
        res.status('200');
        res.send(buffer);
    });
});

app.get('/modify/:id',function(req,res){
    var id = req.params.id;
    database.query(db,id,function(row){
        //console.log(row.title);
        res.render('modifyf',{row: row});
    })
    
});

app.get('/modify',function(req,res){
    database.queryall(db,function(all){
        res.render('modify',{all: all});
    });
    
});

app.post('/modifydb',function(req,res){
    var title = req.body.title;
    var description = req.body.description;
    var level = req.body.level;
    var id = req.body.id;
    database.update(db,title,description,level,id);
    res.redirect(303,'/modify');
});


app.post('/adddb',function(req,res){
    var title = req.body.title;
    var description = req.body.description;
    if (title){
        database.add(db,title,description);
    }
    res.redirect(303,'/display');
});


// 404 catch-all handler (middleware)
app.use(function(req, res, next){
res.status(404);
res.render('404');
});
// 500 error handler (middleware)
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.status(500);
    res.render('500');
});

app.listen(app.get('port'), function(){
    console.log( 'Express started on http://localhost:' +
    app.get('port') + '; press Ctrl-C to terminate.' );
});
