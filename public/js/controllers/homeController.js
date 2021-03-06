angular.module("stafferApp")
.controller("homeController", ["$scope", "$http", "$routeParams", "$location", "$rootScope", function($scope, $http, $routeParams, $location, $rootScope){
	
	// Change page title
	$scope.$parent.pageTitle = "Home"
	
	// Set "done" loading to false
	$rootScope.done = false;
	
	$scope.header = "<strong>TwentySixteen</strong> Staffer Tracker"
	$scope.$parent.header = "<strong>TwentySixteen</strong> Staffer Tracker"
	$scope.mobileFeedHeight = 1000;
	
	$http.get("/api/candidates/").success(function(data){
		var temp = {};
		data.forEach(function(candidate){
			if( !temp[candidate.party] )
				temp[candidate.party] = [];
			temp[candidate.party].push(candidate.name);
		});	
		
		$scope.parties = [];	
		
		for( party in temp ){
			partyFormatted = (party == "R" ) ? "Republicans" : "Democrats";
			$scope.parties.push({name: partyFormatted, candidates: temp[party] });
		}
		
		
	});
	
	$http.get("/api/staffers/").success(function(data){
		$scope.staffers = data;
	});
	
	$http.get("/api/organizations/").success(function(data){
		$scope.organizations = data;
	});
	
	$scope.search = function(){

		if( $scope.stafferSearch )
			$location.path('/search/staff/' + $scope.stafferSearch);
		if( $scope.organizationSearch )
			$location.path('/search/organization/' + $scope.organizationSearch);
	}
	
	
	
}])
.directive('enter', ['$location', function ($location) {
	return function (scope, element, attrs) {
		element.bind("keydown keypress", function (event) {
			if(event.which === 13 ) {
				scope.$apply(function (){
					if(typeof scope["filtered" + element[0].title][0] != "undefined"){
						if( element[0].title == "Organizations"){
							$location.path("/organization/" + scope["filtered" + element[0].title][0].name);							
						}
						else {
							$location.path("/staffer/" + scope["filtered" + element[0].title][0].name);							
						}

					};
				});

				event.preventDefault();
	            }
	        });
	    };
	}]);