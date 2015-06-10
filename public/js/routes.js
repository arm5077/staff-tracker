angular.module("stafferApp").config(function($routeProvider){
	$routeProvider.when("/feed", {
		templateUrl: "/templates/pages/feed/",
		controller: "feedController"
	})
	.when("/staffer/:stafferName", {
		templateUrl: "/templates/pages/staffer/",
		controller: "stafferController"
	})
	.when("/network/:candidateName", {
		templateUrl: "/templates/pages/network/",
		controller: "networkController"
	})
	.otherwise({
		templateUrl: "/templates/pages/home/",
		controller: "homeController"
	})
});