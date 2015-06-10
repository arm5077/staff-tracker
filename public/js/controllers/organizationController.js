angular.module("stafferApp")
.controller("organizationController", ["$scope", "$http", "$routeParams", function($scope, $http, $routeParams){
	$scope.name = $routeParams.organizationName;
	
	$http.get("/api/organization/" + $routeParams.organizationName).success(function(data){
		$scope.organizations = data;
		
		if( data.length > 0 )
			$scope.max = data[0].count;
		
	});
	
}])
.directive("bar", function() {
	return {
		link: function(scope, element, attr) {	
			console.log(element.parent()[0].offsetWidth * scope.organization.count / scope.max);
			element[0].style.width = (element.parent()[0].offsetWidth * scope.organization.count / scope.max) + "px";
			
		}
	};	

})