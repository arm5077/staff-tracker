angular.module("stafferApp", ['ngRoute', 'pc035860.scrollWatch', "ngAnimate"])
.controller("overallController", ["$scope", "$sce", function($scope, $sce){
	$scope.renderHTML = function(text){ return $sce.trustAsHtml(text); };
}])
.directive("sizeToSibling", function() {
	return {
		link: function(scope, element, attr) {
			
			resize();
			window.addEventListener("resize", resize);
			
			function resize(){
				element.css({
					width: (window.innerWidth - element.parent().children()[0].offsetWidth) + "px",
					"margin-left": (element.parent().children()[0].offsetWidth) + "px",
				});
			}
			
		}
	};	

})
.directive("backButton", function() {
	return {
		link: function(scope, element, attr) {
			element.on("click", function(){
				window.history.back();
			});
			
		}
	};	

})