/************************************************************************** 
File: weather.json
Author: Jerry Hayes
Date: 11/07/2015
Description:  Allows a user to select either a city name or zip code and 
returns weather information relevant to user's input.  Information is then
updated in the weather.html file for viewing.
***************************************************************************/

var myWeatherService = 'http://52.33.2.210:3000/weather?';
var send    = new Event('send', {type:'send', bubbles:false, cancelable:true});

document.addEventListener('DOMContentLoaded', initPage);

					
/*********************************************************************************
Description:  Use to define callback functionality when calling myWeatherService
*********************************************************************************/					
var weather_callback =  {
    success: function(req,id) {
                var response = JSON.parse(req.responseText);
                if (response.cod == 200)
	           processWeather(response, true, id);
	        else 
                   processWeather(null, false, id);
             },
    failure: function(req,id) {
                processWeather(null, false, id);
             }
 };
/*********************************************************************************
Function: initPage
Description:  Used to set event listeners on html objects
*********************************************************************************/			
function initPage() {
        try {
	   document.getElementById("zipcode").addEventListener('keypress', checkKey, false);
 	   document.getElementById("city").addEventListener('keypress', checkKey, false);
	   document.getElementById("zipcode").addEventListener('send', defineRequest, false);
	   document.getElementById("city").addEventListener('send', defineRequest, false);
	   document.getElementById("submit").addEventListener('click', checkSubmitType, false);
	   document.getElementById("reset").addEventListener('click', resetInput, false);
        } catch (failed) {
           // event listeners only valid on home page load
        }
}

/*********************************************************************************
Function: checkSubmitType
Description:  Used to determine whether to send a request for a city or zip code
              when an "Enter" is detected on the keyboard. Which one is sent 
              is determined from the contents on zipcode form field.			  
*********************************************************************************/
function checkSubmitType(event) {
    event.preventDefault();
    if (document.getElementById("zipcode").value != "") {
       document.getElementById("zipcode").dispatchEvent(send);
    } else {   
       if (document.getElementById("city").value != "") { 
           document.getElementById("city").dispatchEvent(send);
       }
    }
}

/*********************************************************************************
Function: checkKey
Description:  Checks to determine whether the Enter key has been clicked.		  
*********************************************************************************/
function checkKey(event) {
   if (event.keyCode === 13)  {
      defineRequest(event);  
   }		
}

/*********************************************************************************
Function: resetInput
Description:  Used to clear status images in form fields 'zipcode' and 'city'		  
*********************************************************************************/
function resetInput() {
    document.getElementById("zipcode").className = "";
    document.getElementById("city").className = "";
}

/*********************************************************************************
Function: defineRequest
Description:  Used to define url that will be called via a 'GET' method.
*********************************************************************************/
function defineRequest(event) {
    event.preventDefault();
    document.getElementById(event.srcElement.id).className = "thinking";
    var url = myWeatherService;
	
    switch(event.srcElement.id) {
        case "zipcode":
            url += "zip=" + document.getElementById(event.srcElement.id).value;
	    break;
        case "city":
            url += "q=" + document.getElementById(event.srcElement.id).value;
	    break;
        default:	   
    }
    if (!window.XMLHttpRequest ) {
     return null;
    }
    req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.onreadystatechange = function() {
        if (req.readyState === 4) {
            if (req.status === 200) {
               weather_callback.success(req,event.srcElement.id);
            } else {
               weather_callback.failure(req,event.srcElement.id);  
            }
        }  	  
    }
    req.send();
}

/*********************************************************************************
Function: processWeather
Description:  Used to update html objects based upon response return from 
              OpenWeatherMap
*********************************************************************************/
function processWeather(response, success, id) {
    if (success) {
      document.getElementById(id).className = "valid";
      if (id == "zipcode") {
          document.getElementById("city").value = "";
          document.getElementById("city").className = "";
      } else {
          document.getElementById("zipcode").value = "";
          document.getElementById("zipcode").className = "";
      }	 				
      var parms = { 'name':response.name,
                    'temp':fahrenheit(response.main.temp), 
		    'speed':windspeed(response.wind.speed),
	            'direction':degToCompass(response.wind.deg),
                    'clouds':clouds(response.clouds.all),
                    'lat':response.coord.lat,
                    'lon':response.coord.lon,
                    'sunrise':genTimeStamp(response.sys.sunrise, response.dstOffset, response.rawOffset),
                    'sunset':genTimeStamp(response.sys.sunset, response.dstOffset, response.rawOffset) };
    } else {
       document.getElementById(id).className = "invalid";
       document.getElementById(id).value = "invalid entry";
       document.getElementById(id).focus();
       document.getElementById(id).select();
       var parms = { 'name':null, 'temp':null,  'clouds':null, 'sunrise':null, 
                     'direction':null, 'sunset':null, 'lat':null, 'lon':null, 'speed':null };
    }
    for (var parm in parms) {
       try { 
          document.getElementById(parm).textContent = parms[parm];
       } catch(failed) {
             // parameter not included in returned response object  
       }	
    }	
} 	

/*********************************************************************************
Function: genTimeStamp
Description: 		  
*********************************************************************************/
function genTimeStamp(utc, dst, raw) {
 
  if(typeof(dst) == "undefined"){ return utc; }
  
  var now = new Date();
  var local_offset = now.getTimezoneOffset() * 60000;
  var timezone_offset = -1000*(dst + raw);
  var t = 1000*utc + (local_offset - timezone_offset);
  var c = new Date(t);

  return c.toLocaleString();
}


/*********************************************************************************
Function: windspeed
Description:  Used to add speed unit to wind speed response.		  
*********************************************************************************/
function windspeed(ws) {
   return (ws.toFixed(1) + " mph");	
}

/*********************************************************************************
Function: Fahrenheit
Description:  Used to add temperature unit to temperature response.		  
*********************************************************************************/
function fahrenheit(ftemp) {
  return (ftemp.toFixed(0) + "  " + "\u00B0" + "F");
}	


/*********************************************************************************
Function: degToCompass
Description:  Used to covert 360 degree to textual wind direction description.		  
*********************************************************************************/
function degToCompass(deg) {
    var val= (deg/22.5 +.5).toFixed(0);
    var arr=["N","NNE","NE","ENE","E","ESE", "SE", "SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
    return(arr[(val % 16)]);
}

/*********************************************************************************
Function: clouds
Description:  Used to add cloudiness unit to cloud response.		  
*********************************************************************************/
function clouds(pcloud) {
    return (pcloud.toFixed(0) + " %");	
}
