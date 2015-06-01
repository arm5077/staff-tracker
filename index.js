var express = require("express");
var app = express();
var Spreadsheet = require('edit-google-spreadsheet');
var mysql = require("mysql");

// Turn on server
var port = process.env.PORT || 3000;
app.listen(port, function(){
	console.log("We're live at port " + port + ".");
});


// Set up static page (main page)
app.use("/", express.static(__dirname + "/public/"));

// Return feed of hirings, by data and by person
app.get("/feed", function(request, response){
	
	var connection = connectMySQL();
	
	connection.query("SELECT * FROM feed", function(err, rows, header){
		if( err ) throw err;
		var temp = {};
		
		rows.forEach(function(row){
			if( !temp[row.name] )
				temp[row.name] = {};
			temp[row.name].date = row.date;
			temp[row.name].year = row.year;
			temp[row.name][row.action] = { employer: row.employer };
		});
		
		var exportArray = []; 
		
		for( key in temp){
			if( temp.hasOwnProperty(key) ){
				var leaves = null;
				if( temp[key].leaves ) 
					leaves = temp[key].leaves.employer
				exportArray.push({
					name: key,
					date: temp[key].date,
					year: temp[key].year,
					joining: temp[key].joins.employer,
					leaving: leaves
				});
			}
		}
			
		// Sort from newest to oldest
		exportArray.sort(function(a,b){
			return b.date - a.date;
		})
		response.status(200).json(exportArray);
		
	});
	
	
});

// Launch scraper
app.get("/scrape", function(request, response){	
	
	var connection = connectMySQL();
	
	var spreadsheet_email = process.env.SPREADSHEET_EMAIL;
	var spreadsheet_key = process.env.SPREADSHEET_KEY;
	
	var completed = 0;
	var timeout = 0;
	
	// Truncate existing tables
	connection.query('TRUNCATE TABLE feed', function(err, rows, header){ console.log("Truncated feed"); if( err ) throw err; });
	
	// Pop open the source spreadsheet
	Spreadsheet.load({
		debug: true,
		spreadsheetName: "Staffer Tracker",
		worksheetName: "All Data",
		oauth: {
			email: spreadsheet_email,
			key: spreadsheet_key
		}
	}, function(err, spreadsheet){
		if( err ) throw err;
		spreadsheet.receive(function(err, rows, info) {
			if( err ) throw err;
			// Cycle through spreadsheet and create new object
			data = makeObjectFromSpreadsheet(rows);
			
			// Split 2016 employers and hire dates into arrays
			data.forEach(function(data){
				console.log(data["Date Hire/Resignation Known"]);
				data.dates = String(data["Date Hire/Resignation Known"]).split(",");
				data.employers = data["2016"].split(",");
			});
			
			// Let us first compile 2016 comings and goings
			data.forEach(function(data){
				data.dates.forEach(function(date, i){
					
					// So sometimes a date is an actual date, and sometimes it's just a year.
					// If it's a year, we want to store it differently on the server.
					if( date.length > 4){
						date = new Date(date);
						date = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + (date.getDate());
					} else {
						var year = date;
						date = null;
					}
					
					// Check if this is a "joining" entry
					if( data.employers[i] ){
						console.log(date + ": " + data.Staffer + " joins " + data.employers[i]);
						connection.query('INSERT INTO feed (name, employer, action, date, year) VALUES (?,?,?,?,?)', 
							[data.Staffer,
							data.employers[i],
							"joins",
							date,
							year],
						function(err, rows, header){ 
							if( err ) throw err;
							console.log(date + ": " + data.Staffer + " joins " + data.employers[i]);
						});
					}
					
					// Check if is a "leaving" entry
					if( data.employers[i + 1] ){
						connection.query('INSERT INTO feed (name, employer, action, date, year) VALUES (?,?,?,?,?)', 
							[data.Staffer,
							data.employers[i+1],
							"leaves",
							date,
							year],
						function(err, rows, header){ 
							if( err ) throw err;
							console.log(date + ": " + data.Staffer + " leaves " + data.employers[i+1]);
						});
					}
				});
			});
			
			connection.end();
			
		});
	});	
});

function makeObjectFromSpreadsheet(rows){
	export_array = [];
	fields = [];
	for( var row in rows ){
		if( rows.hasOwnProperty(row) ){
			var object = {};
			for( var column in rows[row] ){
				if( rows[row].hasOwnProperty(column) ){
					if( row == "1" ){
						fields.push(rows[row][column]);
					}
					else {
						object[fields[column - 1]] = rows[row][column];
					}
				}
			}
			if(row != 1) export_array.push(object);
		}
	}
	return export_array;
}

function connectMySQL(){
	// Open connection to mySQL database
	var connection = mysql.createConnection(process.env.CLEARDB_DATABASE_URL || "mysql://root@localhost/stafftracker");
	connection.on("error", function(err){  
		connection.end();
		 return setTimeout(function(){ return connectMySQL() },3000);
	});

	connection.connect( function(err){ if(err) throw err; });
	
	return connection;
}
