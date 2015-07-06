angular.module("stafferApp")
.controller("organizationController", ["$scope", "$http", "$routeParams", "$rootScope", function($scope, $http, $routeParams, $rootScope){

	// Change page title
	$scope.$parent.pageTitle = "Former staffers | " + $routeParams.organizationName;
	
	// Set "done" loading to false
	$rootScope.done = false;
	
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
		
		// Set "done" loading to true
		$rootScope.done = true;
		
	});
	
}]);