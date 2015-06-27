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

// Return 2016 candidates
app.get("/api/candidates", function(request, response){
	var connection = connectMySQL();
	
	connection.query("SELECT employer as name, party, count(employer) as count FROM history JOIN candidates ON candidates.name=history.employer WHERE year = 2016 GROUP BY name ORDER BY count DESC", function(err, rows, header){
		if(err) throw err;		
		response.status(200).json(rows);
		connection.end();
	});
	
});

// Return 2016 staffers
app.get("/api/staffers", function(request, response){
	var connection = connectMySQL();
	
	connection.query("SELECT name, MID(name,LOCATE(' ', name) + 1, 100) as lastName from history GROUP BY name ORDER BY lastName ASC", function(err, rows, header){
		if(err) throw err;		
		response.status(200).json(rows);
		connection.end();
	});
	
});

// Return prior organizations
app.get("/api/organizations", function(request, response){
	var connection = connectMySQL();
	
	connection.query("SELECT employer as name from history WHERE year < 2016 GROUP BY employer ORDER BY employer ASC", function(err, rows, header){
		if(err) throw err;		
		response.status(200).json(rows);
		connection.end();
	});
	
});


// Return a profile page for an organization
app.get("/api/organization/:organization", function(request, response){
	var connection = connectMySQL();
	
	connection.query("SELECT * FROM history WHERE employer = ? AND year != 2016 GROUP BY history.name", [request.params.organization], function(err, rows, header){
		if(err) throw err;
		
		if( rows.length == 0 ){
			response.status(200).json([]);
		}
		else {
			
		
			
			var names = "";
			var years = {}
			var staff = [];
			rows.forEach(function(row){
				years[row.name] = row.year;
				names += " OR history.name = '" + row.name.replace("'", "\\'") + "'";
			});
			
			// Query now for 2016 campaigns with these people, joining to the 2016 candidate table
			// so we avoid extraneous results.
			connection.query("SELECT * FROM history LEFT JOIN (select name as candidate from candidates) as candidates on history.employer = candidates.candidate WHERE year = 2016 AND (" + names.slice(4) + ")", function(err, rows, header){
			 	if(err) throw err;
				var temp = {}
				rows.forEach(function(row){
					if( row.candidate ){
						if( !temp[row.employer] ) 
							temp[row.employer] = [];
						temp[row.employer].push({name: row.name, year: years[row.name]});
						staff.push({name: row.name, year: years[row.name], employer: row.employer});
					}
				});

				var exportArray = [];
				for( employer in temp ){
					exportArray.push({name: employer, count: temp[employer].length, staffers: temp[employer]});
				}

				exportArray.sort(function(a,b){
					return b.count - a.count;
				});
			
				// Let's sort these records by last name.
				staff.sort(function(a,b){
					if( b.name.slice(b.name.indexOf(" ") + 1) > a.name.slice(a.name.indexOf(" ") + 1) )
						return -1;
					else
						return 1;
				});
			
				response.status(200).json({staffers: staff, candidates: exportArray});
				

			});
		}
	});
	
});

// Return listing of previous organizations staffers have worked at
app.get("/api/network/:candidateName", function(request, response){
	var connection = connectMySQL();
		connection.query("SELECT * FROM history WHERE employer = ? and year = 2016", [request.params.candidateName], function(err, rows, header){
		console.log("SELECT * FROM history WHERE employer = '" + request.params.candidateName + "' and year = 2016")
		if(err) throw err;
		var names = "";
		rows.forEach(function(row){
			names += " OR name = '" + row.name.replace("'", "\\'") + "'";
		});
		
		connection.query("SELECT * FROM history WHERE ((" + names.slice(4) + ")) ORDER BY year DESC", function(err, rows, header){
			var staffers = [];
			var employers = [];
			var exportArray = {staffers: [], employers: []};

		
			
			if(rows){
				// Aggregate first by employee, then by employer
				rows.forEach(function(row){
					if( !staffers[row.name] ){
						staffers[row.name] = {name: row.name, position: row.position, twitter: row.twitter, linkedin: row.linkedin, employers: [] };
					}			
					if(row.year != 2016)
						staffers[row.name].employers.push({year: row.year, name:row.employer});
					
					// Employer section
					if( !employers[row.employer] )
						employers[row.employer] = {name: row.employer, staffers: []};
						
					if( employers[row.employer].staffers.indexOf(row.name) == -1 && row.year != 2016 )
						employers[row.employer].staffers.push(row.name)
				});

			}
			
			for( staffer in staffers){
				exportArray.staffers.push(staffers[staffer]);
			}
			
			for( employer in employers ){
				exportArray.employers.push(employers[employer]);
			}
			
			exportArray.employers.sort(function(a,b){
				return b.staffers.length - a.staffers.length;
			});
			
			connection.end();
			response.status(200).json(exportArray);
		});
	});
});

// Return biographical information about a person
app.get("/api/staffer/:stafferName", function(request, response){
	var connection = connectMySQL();
	
	connection.query("SELECT * FROM history WHERE name = ?", [request.params.stafferName], function(err, rows, header){
		if( err ) throw err;
		
		var history = [];
		
		rows.forEach(function(row){
			history.push({ year: row.year, employer: row.employer })
		});
		
		connection.end();
		
		response.status(200).json({
			name: request.params.stafferName,
			history: history
		});	
	});	
});

// Return feed of hirings, by data and by person
app.get("/api/feed", function(request, response){
	
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
		});
		
		connection.end();
		
		response.status(200).json(exportArray);
		
	});
	
	
});

// Launch scraper
app.get("/api/scrape", function(request, response){	
	

	
	var spreadsheet_email = process.env.SPREADSHEET_EMAIL;
	var spreadsheet_key = process.env.SPREADSHEET_KEY;
	
	var completed = 0;
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
		spreadsheetName: "Staffer Tracker",
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
			data.forEach(function(candidate){
				if( candidate.party ){
					connection.query('INSERT INTO candidates (name, party) VALUES (?,?)', [candidate.name, candidate.party], function(err){
						if(err) throw err;
					});
				}
			});
			
			connection.end();

		});

		
	});
	
		
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
						var year = date;
						date = null;
					}
					
					// Check if this is a "joining" entry
					if( data.employers[i] ){
					// console.log(date + ": " + data.Staffer + " joins " + data.employers[i]);
						connection.query('INSERT INTO feed (name, employer, action, date, year) VALUES (?,?,?,?,?)', 
							[data.Staffer,
							data.employers[i],
							"joins",
							date,
							year],
						function(err, rows, header){ 
							if( err ) throw err;
						//	console.log(date + ": " + data.Staffer + " joins " + data.employers[i]);
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
						//	console.log(date + ": " + data.Staffer + " leaves " + data.employers[i+1]);
						});
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
							connection.query('INSERT INTO history (name, year, employer, position, twitter, linkedin) VALUES (?,?,?,?,?,?)',
								[data.Staffer,
								year,
								job,
								position,
								data["Twitter (URL)"],
								data["LinkedIn (URL)"]
								],
						 	function(err, rows, header){
								if( err ) throw err;
							});
						});
					}
				}
				
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
