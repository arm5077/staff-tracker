angular.module("stafferApp")
.controller("searchController", ["$scope", "$http", "$routeParams", function($scope, $http, $routeParams){
	
	if( $routeParams.stafferName ){
		$scope.name = $routeParams.stafferName;
		$scope.type = "staffer";
		$http.get("/api/staffers/").success(function(data){
			$scope.data = data;	
		});
	}
	else if( $routeParams.organizationName ) {
		$scope.name = $routeParams.organizationName;
		$scope.type = "organization";
		$http.get("/api/organizations/").success(function(data){
			$scope.data = data;	
		});
	}
	
	
	
	
	
}]);