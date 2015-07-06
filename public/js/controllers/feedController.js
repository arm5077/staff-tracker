angular.module("stafferApp")
.controller("feedController", ["$scope", "$http", "$sce", "$rootScope", function($scope, $http, $sce, $rootScope){
	
	$scope.moment = moment;
	
	$http.get("/api/feed").success(function(data){
		$scope.feed = data;
		$rootScope.done = true; //turn off loading screen

	});
	
}]);