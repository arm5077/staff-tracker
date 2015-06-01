app = angular.module("feedApp", []);

app.controller("feedController", ["$scope", "$http", "$sce", function($scope, $http, $sce){
	
	$scope.moment = moment;
	
	$http.get("/feed").success(function(data){
		$scope.feed = data;
	});
	
}]);