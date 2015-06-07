angular.module("stafferApp")
.controller("feedController", ["$scope", "$http", "$sce", function($scope, $http, $sce){
	
	$scope.moment = moment;
	
	$http.get("/api/feed").success(function(data){
		$scope.feed = data;
	});
	
}]);