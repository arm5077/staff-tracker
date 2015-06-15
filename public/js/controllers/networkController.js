angular.module("stafferApp")
.controller("networkController", ["$scope", "$http", "$sce", "$routeParams", function($scope, $http, $sce, $routeParams){
	
	$scope.name = $routeParams.candidateName;
	$scope.showList = true;
	$scope.staff = [];
	$scope.fullList = [];
	$scope.previouslySelected = [];
	$scope.selectionOn = false;
	
	$http.get("/api/network/" + $routeParams.candidateName).success(function(data){
		$scope.years = data;

		
		// Make list of unique staffer names
		var temp = {};
		data.forEach(function(year){
			year.employers.forEach(function(employer){
				employer.staffers.forEach(function(staffer){
					temp[staffer] = employer.employer;
				//	$scope.previouslySelected.push(employer);
				});
			});
		});
		for( name in temp ){
			$scope.staff.push({name: name, employer: temp[name] });
		}
		
		// Sort list of unique staffers by last name
		$scope.sortStaff();
		
		$scope.fullList = $scope.staff;
		

		
	});
	
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
			$scope.previouslySelected.forEach(function(employer){
				employer.selected=true;
			});
		}
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
		$scope.previouslySelected.length = 0;
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
				console.log((element[0].offsetWidth) / 2);
				element.css({
					"margin-top": ( (element.parent()[0].offsetHeight - element[0].offsetWidth) / 2 - 28) + "px",
				});	
			}, 250);			
		}
	};	

});

