var socket, myName;
$(document).ready(function() {
	socket = io.connect('http://10.0.0.12:1300');
	socket.on('recieveMsg', displayMsgList);
	socket.on("yourName",saveName);
	function saveName(data) {
		myName=data.name;
	}
	$("#send_msg").click(function() {
		if($("#msg").val()!="" && $("#msg").val().match(/<[^>]+>/g)==null){
			socket.emit("msgSent",$("#msg").val());
			$("#msg").val("");
		}
	})
	$("#msg").keypress(function(e) {
		if(e.charCode==13){
			$("#send_msg").click();
		}
	})
	function displayMsgList(data){
		$(".messages").html("");
		txt="";
		for(var i=0;i<data.messages.length;i++){
			try{
				var obj = JSON.parse(data.messages[i].msg);
				if(obj.hasOwnProperty("color")){
					txt="<p>["+data.messages[i].from+" ~ "+data.messages[i].timeSent+"] <span style='color:#"+obj.color+";'>"+obj.text+"</span></p>";
				}
			}catch(e){
				txt="<p>["+data.messages[i].from+" ~ "+data.messages[i].timeSent+"] "+data.messages[i].msg+"</p>";//{"text":"Con Color","color":"ff0000"}
			}
			txt=txt.replace(new RegExp(myName,"g"),"You");
			$(".messages").append(txt);
		}
	}
})
