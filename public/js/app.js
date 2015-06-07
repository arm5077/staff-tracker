angular.module("stafferApp", ['ngRoute'])
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

});