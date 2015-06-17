angular.module("stafferApp")
.controller("networkController", ["$scope", "$http", "$sce", "$routeParams", function($scope, $http, $sce, $routeParams){
	
	$scope.name = $routeParams.candidateName;
	$scope.showList = true;
	$scope.staff = [];
	$scope.fullList = [];
	$scope.previouslySelected = [];
	$scope.selectionOn = false;
	$scope.biggestEmployer = "";
	
	$http.get("/api/network/" + $routeParams.candidateName).success(function(data){
		$scope.years = data;
		
		// Make list of unique staffer names
		var temp = {};
		var overall = {}
		data.forEach(function(year){
			year.employers.forEach(function(employer){
				
				// Also add to a count of overall employers (skipping 2016, cuz we don't want to add the current candidate)
				if(year.year != 2016){
					if( !overall[employer.employer])
						overall[employer.employer] = 0;
					overall[employer.employer] += employer.staffers.length;

					employer.staffers.forEach(function(staffer){
						temp[staffer] = employer.employer;
					//	$scope.previouslySelected.push(employer);
					});
				}
				
			});
		});
		for( name in temp ){
			$scope.staff.push({name: name, employer: temp[name] });
		}
		
		
		// Sort list of unique staffers by last name
		$scope.sortStaff();
		
		// Convert object of overall organizations that have hired staffers into array and sort
		var employers = [];
		for( employer in overall ){
			employers.push({employer: employer, count: overall[employer]});
		}
		
		employers.sort(function(a,b){ return b.count - a.count });
		
		// Get employers that has employed largest number of current staffers.
		$scope.biggestEmployer = employers[0].employer; 
		
		$scope.fullList = $scope.staff;
		

		
	});
	
	$scope.filterClusters = function(employer){
		return employer.staffers.length > 1;	
	}
	
	$scope.filterSingles = function(employer){
		return employer.staffers.length == 1;	
	}
	
	$scope.toggleSelected = function(staffer){
		if(staffer.selected == false || staffer.selected == null) { 
			$scope.clearStafferSelection(); 
			staffer.selected=true; 
			$scope.filterCountsByName(staffer.name, true); 
			
		} 
		else { 
			$scope.clearStafferSelection(); 
			$scope.clearEmployerSelection(); 
			$scope.previouslySelected.length = 0;
		}
	};
	
	$scope.toggleListSelected = function(employer, year){
		if( employer.selected == false || employer.selected == null) {
			$scope.dimAllEmployers();
			$scope.previouslySelected.length = 0; 
			$scope.previouslySelected.push(employer); 
			$scope.filterList(employer.staffers, employer.employer, year.year); 
			employer.selected = true;
		} 
		else {
			$scope.staff = $scope.fullList;
			employer.selected = null;
			$scope.previouslySelected.length = 0; 
		}
		
	}
	
	$scope.filterCountsByLastSelected = function(){
		$scope.clearEmployerSelection();
		if( $scope.previouslySelected.length > 0 ) {
			$scope.dimAllEmployers();
		}
		
		$scope.previouslySelected.forEach(function(employer){
			employer.selected=true;
		});
		
	}
	
	$scope.filterCountsByName = function(name, sticky){
		$scope.clearEmployerSelection();
		if(sticky) $scope.previouslySelected.length = 0;
		$scope.years.forEach(function(year){
			year.employers.forEach(function(employer){
				if( employer.staffers.indexOf(name) != -1){
					employer.selected = true;
					if(sticky) $scope.previouslySelected.push(employer);	
				} else {
					employer.selected = false;
				}
			});
		});
		
		
	}
	
	$scope.filterList = function(staffers, employer, year){
		$scope.staff = [];
		staffers.forEach(function(staffer){
			$scope.staff.push({ name: staffer, employer: employer });
		});
		$scope.sortStaff();
	}
	
	$scope.sortStaff = function(){
		$scope.staff.sort(function(a,b){
			if( b.name.slice(b.name.indexOf(" ") + 1) > a.name.slice(a.name.indexOf(" ") + 1) )
				return -1;
			else
				return 1;
		});
	}
	
	$scope.clearEmployerSelection = function(){
		$scope.years.forEach(function(year){
			year.employers.forEach(function(employer){
				employer.selected = null;
			})
		});
	}
	
	$scope.dimAllEmployers = function(){
		$scope.years.forEach(function(year){
			year.employers.forEach(function(employer){
				employer.selected = false;
			})
		});
	}
	
	$scope.clearStafferSelection = function(){
		$scope.staff.forEach(function(staffer){
			staffer.selected = false;
		});
	}
	
}])
.directive("label", function() {
	return {
		link: function(scope, element, attr) {

			setTimeout(function(){
				element.css({
					"margin-top": ( (element.parent()[0].offsetHeight - element[0].offsetWidth) / 2 - 28) + "px",
				});	
			}, 250);			
		}
	};	

})	.directive("header", function() {
		return {
			link: function(scope, element, attr) {
				scope.$watch("name", function(){
					scope.headerHeight = element[0].offsetHeight;
				})

			}
		};	

	});

