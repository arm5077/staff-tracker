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
	.when("/organization/:organizationName", {
		templateUrl: "/templates/pages/organization/",
		controller: "organizationController"
	})
	.when("/search/staff/:stafferName", {
		templateUrl: "/templates/pages/search/",
		controller: "searchController"
	})
	.when("/search/organization/:organizationName", {
		templateUrl: "/templates/pages/search/",
		controller: "searchController"
	})
	.when("/", {
		templateUrl: "/templates/pages/home/",
		controller: "homeController"
	})
	.otherwise({
		templateUrl: "/templates/pages/home/",
		controller: "homeController"
	})
});