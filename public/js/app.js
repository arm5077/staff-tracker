angular.module("stafferApp", ['ngRoute', 'pc035860.scrollWatch', "ngAnimate"])
.controller("overallController", ["$scope", "$sce", function($scope, $sce){
	$scope.renderHTML = function(text){ return $sce.trustAsHtml(text); };
	$scope.header = "<strong>TwentySixteen</strong> Staffer Tracker";
	$scope.hint = true;
	$scope.JSON = JSON;
	$scope.orgFilter = {filter:""};
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

}).directive('script', function() {
	    return {
	      restrict: 'E',
	      scope: false,
	      link: function(scope, elem, attr) {
	        if (attr.type === 'text/javascript-lazy') {
	          var code = elem.text();
	          var f = new Function(code);
	          f();
	        }
	      }
	    };
	  });
