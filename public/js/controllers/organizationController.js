angular.module("stafferApp")
.controller("organizationController", ["$scope", "$http", "$routeParams", function($scope, $http, $routeParams){
	$scope.name = $routeParams.organizationName;
	
	$scope.selectedName = "";

	$scope.toggleCandidate = function(name){
		if( $scope.selectedName == name )
			$scope.selectedName = "";
		else
			$scope.selectedName = name;
	}
	
	$http.get("/api/organization/" + $routeParams.organizationName).success(function(data){
		console.log(data);
		$scope.candidates = data.candidates;
		$scope.staffers = data.staffers;
	});
	
}]);