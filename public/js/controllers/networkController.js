angular.module("stafferApp")
.controller("networkController", ["$scope", "$http", "$sce", "$routeParams", "$rootScope", function($scope, $http, $sce, $routeParams, $rootScope){
	
	// Change page title
	$scope.$parent.pageTitle = "Current staffers | " + $routeParams.candidateName;
	
	// Set "done" loading to false
	$rootScope.done = false;
	
	$scope.name = $routeParams.candidateName;
	$scope.showList = true;
	$scope.staff = [];
	$scope.fullList = [];
	$scope.previouslySelected = [];
	$scope.selectionOn = false;
	$scope.biggestEmployer = "";
	$scope.limit = 10;
	$scope.sort = 'name.substr(name.indexOf(\' \') + 1)';
	
	$http.get("/api/network/" + $routeParams.candidateName).success(function(data){
		$scope.staffers = data.staffers;
		$scope.employers = data.employers;

		// Set "done" loading to true
		$rootScope.done = true;
		
		
	});
	
	$scope.filterClusters = function(employer){
		return employer.staffers.length > 1;	
	}
	
	$scope.filterSingles = function(employer){
		return employer.staffers.length == 1;	
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

