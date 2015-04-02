var express = require('express');
var fs = require("fs");
var Database = require("./database_sqlite.js");
var config = require("./config.js");

var app = express();
var file = config.file;
var exists = fs.existsSync(file);

var database = new Database(file);
if (!exists) {
    database.create();
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

app.set('port', process.env.PORT || config.port || 3000);

// set up handlebars view engine
var handlebars = require('express3-handlebars').create({ defaultLayout:'main' });
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

var bodyParser  = require('body-parser');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
    database.queryall(function(all){
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
    database.queryall(function(all){
        for (var i=0; i < all.length; i++)
        {
            all[i].description = nl2br(all[i].description);
        }
        res.render('display',{all: all});
    });
});

app.get('/rtf',function(req,res){
    database.queryall(function(all){
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
    database.query(id,function(row){
        res.render('modifyf',{row: row});
    })
    
});

app.get('/modify',function(req,res){
    database.queryall(function(all){
        res.render('modify',{all: all});
    });
    
});

app.post('/modifydb',function(req,res){
    var title = req.body.title;
    var description = req.body.description;
    var level = req.body.level;
    var id = req.body.id;
    database.update(title,description,level,id);
    res.redirect(303,'/modify');
});


app.post('/adddb',function(req,res){
    var title = req.body.title;
    var description = req.body.description;
    if (title){
        database.add(title,description);
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
