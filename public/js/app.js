angular.module("stafferApp", ['ngRoute', 'pc035860.scrollWatch'])
.controller("overallController", ["$scope", "$sce", "$rootScope", function($scope, $sce, $rootScope){
	$scope.renderHTML = function(text){ return $sce.trustAsHtml(text); };
	$scope.header = "<strong>TwentySixteen</strong> Staffer Tracker";
	$scope.hint = true;
	$scope.JSON = JSON;
	$scope.orgFilter = {filter:""};
	$scope.pageTitle = "Home";
	
	if( window.innerWidth <= 700 )
		$scope.mobile = true;
}])
.directive("sizeToSibling", function() {
	return {
		link: function(scope, element, attr) {
			
			resize();
			window.addEventListener("resize", resize);
			
			function resize(){
				console.log(element.parent().children()[0]);
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
.directive("ad", function() {
	return {
		link: function(scope, element, attr) {
			element.attr("data-ord", new Date().getTime() * 19880502);
			njHelper.ad.renderAd(element);
			console.log("rendering ad!");
			var interval = setInterval(function(){			
				scope.adHeight = element[0].offsetHeight;
				if( element[0].offsetHeight > 0 )
					clearInterval(interval);
			}, 250);
		}
	};	

})
.directive("center", function(){
	return {
		link: function(scope, element, attr) {
			console.log(window.innerHeight);
			element[0].style.marginTop = ((window.innerHeight - element[0].offsetHeight) / 2) + "px"
		}
	};	
});
