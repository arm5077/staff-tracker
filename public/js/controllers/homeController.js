angular.module("stafferApp")
.controller("homeController", ["$scope", "$http", "$routeParams", function($scope, $http, $routeParams){

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
	
}]);