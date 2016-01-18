var Spreadsheet = require('edit-google-spreadsheet');
var mysql = require("mysql");
	
var spreadsheet_email = process.env.SPREADSHEET_EMAIL;
var spreadsheet_key = process.env.SPREADSHEET_KEY;

var completed = 0;
var outstanding = 0;
var timeout = 0;

var connection = connectMySQL();

// Truncate existing tables
connection.query('TRUNCATE TABLE feed', function(err, rows, header){ console.log("Truncated feed"); if( err ) throw err; });
connection.query('TRUNCATE TABLE history', function(err, rows, header){ console.log("Truncated history"); if( err ) throw err; });
connection.query('TRUNCATE TABLE candidates', function(err, rows, header){ console.log("Truncated history"); if( err ) throw err; });

connection.end();

// Pop open the candidate master list spreadsheet
// Pop open the source spreadsheet
Spreadsheet.load({
	debug: true,
	spreadsheetId: "15mJ0Ked8Dbrn9iRW-yYTCi7C4JFlIHpQ7IL1hvWEtQE",
	worksheetName: "Candidates",
	oauth: {
		email: spreadsheet_email,
		key: spreadsheet_key
	}
}, function(err, spreadsheet){
	if( err ) throw err;
	
	var connection = connectMySQL();
	
	spreadsheet.receive({getValues: true}, function(err, rows, info) {
		if( err ) throw err;
		// Cycle through spreadsheet and create new object
		data = makeObjectFromSpreadsheet(rows);
		
		// Start checker to see if we're done computing
		var success = 0;
		var checker = setInterval(function(){
			console.log(outstanding);
			if( outstanding === 0 )
				success++;
			else
				success = 0;

			if( success == 5 ){
				clearInterval(checker);
			}

		},1000);
		
		
		data.forEach(function(candidate){
			if( candidate.party ){
				
				outstanding++;
				connection.query('INSERT INTO candidates (name, party) VALUES (?,?)', [candidate.name, candidate.party], function(err){
					if(err) throw err;
					outstanding--;
				});
			}
		});
		
		connection.end();

	});

	
});

	
// Pop open the source spreadsheet
Spreadsheet.load({
	debug: true,
	spreadsheetId: "15mJ0Ked8Dbrn9iRW-yYTCi7C4JFlIHpQ7IL1hvWEtQE",
	worksheetId: "od6",
	oauth: {
		email: spreadsheet_email,
		key: spreadsheet_key
	}
}, function(err, spreadsheet){
	if( err ) throw err;
	spreadsheet.receive(function(err, rows, info) {
		if( err ) throw err;
		
		var connection = connectMySQL();
		
		// Cycle through spreadsheet and create new object
		data = makeObjectFromSpreadsheet(rows);
		// Split 2016 employers and hire dates into arrays
		data.forEach(function(data){
		//	console.log(data["Date Hire/Resignation Known"]);
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
					var year = (date == '') ? null : date;
					date = null;
				}
				
				if( date != "NaN-NaN-NaN" && date != null ){
					console.log(data);
					// Check if this is a "joining" entry
					if( !data.employers[i] ){	
						outstanding++;				
						connection.query('INSERT INTO feed (name, employer, action, date, year) VALUES (?,?,?,?,?)', 
							[data.Staffer.trim(),
							data.employers[i-1].trim(),
							"leaves",
							date,
							year],
						function(err, rows, header){ 
							if( err ) throw err;
							outstanding--;
						//	console.log(date + ": " + data.Staffer + " joins " + data.employers[i]);
						});
					}
					
					if( data.employers[i]){	
						outstanding++;				
						connection.query('INSERT INTO feed (name, employer, action, date, year) VALUES (?,?,?,?,?)', 
							[data.Staffer.trim(),
							data.employers[i].trim(),
							"joins",
							date,
							year],
						function(err, rows, header){ 
							if( err ) throw err;
							outstanding--;
						//	console.log(date + ": " + data.Staffer + " joins " + data.employers[i]);
						});
					}

					/*
					// Check if is a "leaving" entry
					if( data.employers[i + 1]){
						outstanding++;
						connection.query('INSERT INTO feed (name, employer, action, date, year) VALUES (?,?,?,?,?)', 
							[data.Staffer.trim(),
							data.employers[i+1].trim(),
							"leaves",
							date,
							year],
						function(err, rows, header){ 
							if( err ) throw err;
							outstanding--;
						//	console.log(date + ": " + data.Staffer + " leaves " + data.employers[i+1]);
						});
					}
					*/	
				}
			});
		});
		
		// Now, it is time to compile a storied history
		data.forEach(function(data){
			for(year = 2016; year >= 1968; year--){
				
				if( year == 2016 ) position = data["Title/Responsibility"];
					else position = null;
				
				if( data[year.toString()] ){
					data[year.toString()].split(",").forEach(function(job){							
						outstanding++;
						connection.query('INSERT INTO history (name, year, employer, position, twitter, linkedin, outside_group) VALUES (?,?,?,?,?,?,?)',
							[data.Staffer.trim(),
							year,
							job.trim(),
							position,
							data["Twitter (URL)"],
							data["LinkedIn (URL)"],
							data["PAC/non-profit?"]
							],
					 	function(err, rows, header){
							if( err ) throw err;
							outstanding--;
						});
					});
				}
			}
			
		});
		
		connection.end();
		
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
