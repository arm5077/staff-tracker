angular.module("stafferApp").config(function($routeProvider){
	$routeProvider.when("/feed", {
		templateUrl: "/templates/pages/feed/",
		controller: "feedController"
	})
	.when("/staffer/:stafferName", {
		templateUrl: "/templates/pages/staffer/",
		controller: "stafferController"
	})
});