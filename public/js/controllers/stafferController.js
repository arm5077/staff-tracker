angular.module("stafferApp")
.controller("stafferController", ["$scope", "$http", "$routeParams", function($scope, $http, $routeParams){
	$scope.name = $routeParams.stafferName;
	
	$http.get("/staffer/" + $routeParams.stafferName).success(function(data){
		console.log(data);
		$scope.jobs = data;
	});
	
}]);