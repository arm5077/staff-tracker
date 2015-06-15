angular.module("stafferApp")
.controller("homeController", ["$scope", "$http", "$routeParams", "$location", function($scope, $http, $routeParams, $location){

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
	
	
	
}])
.directive('enter', ['$location', function ($location) {
	return function (scope, element, attrs) {
		element.bind("keydown keypress", function (event) {
			if(event.which === 13 ) {
				scope.$apply(function (){
					if(typeof scope["filtered" + element[0].title][0] != "undefined"){
						console.log(scope["filtered" + element[0].title][0]);
						$location.path("/organization/" + scope["filtered" + element[0].title][0].name);
					};
				});

				event.preventDefault();
	            }
	        });
	    };
	}]);