angular.module("stafferApp")
.controller("stafferController", ["$scope", "$http", "$routeParams", "$rootScope", function($scope, $http, $routeParams, $rootScope){
	
	// Change page title
	$scope.$parent.pageTitle = $routeParams.stafferName;
	
	// Set "done" loading to false
	$rootScope.done = false;
	
	$scope.name = $routeParams.stafferName;
	
	$http.get("/api/staffer/" + $routeParams.stafferName).success(function(data){
		console.log(data);
		$scope.jobs = data;
		
		// Set "done" loading to true
		$rootScope.done = true;
		
	});
	
}]);