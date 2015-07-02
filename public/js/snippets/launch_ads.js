console.log("generating ads");

$('.gptAd').each(function(){
	this.setAttribute("data-ord", new Date().getTime() * 19880502);
});

$('.gptAd').each(function(){ 
	njHelper.ad.renderAd($(this)); 
	console.log(this);
});
