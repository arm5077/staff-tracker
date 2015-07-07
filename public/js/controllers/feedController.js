angular.module("stafferApp")
.controller("feedController", ["$scope", "$http", "$sce", "$rootScope", function($scope, $http, $sce, $rootScope){
	
	$scope.moment = moment;
	$scope.candidates = [];
	$scope.filteredCandidates = {};
	$scope.showFilter = false;
	
	$scope.filterCandidates = function(value){
		return $scope.filteredCandidates[value.joining] || $scope.filteredCandidates[value.leaving];
	}
	
	$scope.checkAll = function(checked){
		for( candidate in $scope.filteredCandidates){
			if(checked)
				$scope.filteredCandidates[candidate] = true;
			else
				$scope.filteredCandidates[candidate] = false;
		}
	}
	
	$http.get("/api/candidates").success(function(data){
		data.sort(function(a,b){
			if( a.name.substr(a.name.indexOf(' ') + 1) > b.name.substr(b.name.indexOf(' ') + 1))
				return 1
			else return -1
		});
		
		$scope.candidates = data;
	
		data.forEach(function(candidate){
			$scope.filteredCandidates[candidate.name] = true;
		});
		console.log($scope.filteredCandidates);
		
	});
	
	
	$http.get("/api/feed").success(function(data){
		$scope.feed = data;
		$rootScope.done = true; //turn off loading screen

	});
	

	
}]);