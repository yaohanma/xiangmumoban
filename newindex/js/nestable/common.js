// 上下文
var contextPath = null;
// 提交flag
var submitFlag = false;
// 迁移前保存提示flag
var saveBeforeMovePage = "";
// 所有页面初始化事件
$(document).ready(function() {
	$(document).on("click", "input[input-type='datetimepicker']", function() {
		$(this).datetimepicker('show');
	});
	// 设置弹出画面的主题
	if(self.frameElement) {
		$("body").prop("class", "theme-"+top.window.currentTheme);
	}
	// 验证组件初始化
	$.validator.setDefaults({
        focusCleanup : true,
        focusInvalid : true,
        highlight: function(element) {
            return $(element).parent().addClass('has-error');
        },
        unhighlight: function(element) {
            return $(element).parent().removeClass('has-error');
        }
	});
	//弹出层样式
	layer.config({
		skin : "layer-ext-moon",
		extend : "skin/moon/style.css",
		shade : [0.7, "#393D49"]
	});
	//禁止后退键 作用于Firefox、Opera    
    document.onkeypress=refuseBackHome;    
    //禁止后退键  作用于IE、Chrome    
    document.onkeydown=refuseBackHome; 
});
function getAjaxGlobalSettings() {
	//设置ajax全局请求参数
	var ajaxSettings = {
		url:         "",
		type:        "POST",
		contentType: "application/x-www-form-urlencoded",
		dataType:    "json",
		async:       true,
		cache:       false,
		crossDomain: false,
		global:      false,
		beforeSend:  globalAjaxBeforeSend,
		success:     globalAjaxSuccess,
		error:       globalAjaxError,
		complete:    globalAjaxComplete
	}
	return ajaxSettings;
}
/**
 * ajax提交前回调函数
 * @param xhr XMLHttpRqeust对象
 */
function globalAjaxBeforeSend(xhr) {
	// 加遮罩
	addLoading();
}
/**
 * ajax提交成功回调函数
 * @param response 服务器返回数据
 * @param textStatus 状态码
 * @param jqXHR jquery的XMLHttpRqeust对象
 * @returns
 */
function globalAjaxSuccess(response, textStatus, jqXHR) {
	if (response.success == false) {
		if (response.httpStatus == '401' || response.httpStatus == '402' || response.httpStatus == '403') {
			alert(response.errorMsg);
			top.window.location.reload();
			return;
		} else {
			popAlert(response.errorMsg);
			return;
		}
	} else if (textStatus != "success") {
		popAlert("系统出现未知错误，请联系公司董秘办。<br>技术支持：前海价值在线400-880-3388");
		return;
	}
	if (this.dataType == "html") {
		if(this.htmlArea != null && this.htmlArea != undefined) {
			this.htmlArea.html(response);
			return;
		} else if (this.callBackFunc != null && this.callBackFunc != undefined) {
			this.callBackFunc(response);
		}
	} else if (this.dataType == "json") {
		if (this.callBackFunc != null && this.callBackFunc != undefined) {
			this.callBackFunc(response.result);
		}
	}
}
/**
 * ajax提交出错回调函数
 * @param xhr XMLHttpRqeust对象
 * @param textStatus 状态码
 * @param errorThrown 异常对象
 */
function globalAjaxError(xhr, textStatus, errorThrown) {
	console.log(xhr.url+"|"+textStatus+"|"+errorThrown);
	//popAlert("系统出现未知错误，请联系公司董秘办。<br>技术支持：前海价值在线400-880-3388");
}
/**
 * ajax提交完成回调函数
 * @param xhr XMLHttpRqeust对象
 * @param textStatus 状态码
 */
function globalAjaxComplete(xhr, textStatus) {
	// 删除遮罩
	removeLoading();
	// 重置提交flag
	submitFlag= false;
}
/**
 * 画面刷新提交
 * @param sUrl 提交URL
 * @param sConfMsg 确认消息
 * @param iFormIndex 提交画面form的索引
 * @returns {Boolean}
 */
function submitForm(sUrl, sConfMsg, iFormIndex) {
	if (submitFlag) {
		return false;
	}
	if(iFormIndex == undefined) {
		iFormIndex = 0;
	}
	if (sConfMsg) {
		layer.confirm(sConfMsg, {icon: 3}, function(index){
		    layer.close(index);
		    submitFlag = true;
		    if(self.frameElement) {
		    	submitFormCallback(sUrl, iFormIndex);
		    } else {
		    	ajaxSubmitFormCallback(sUrl, iFormIndex, "html");
		    }
		});
	} else {
		submitFlag = true;
		if(self.frameElement) {
			submitFormCallback(sUrl, iFormIndex);
		} else {
			ajaxSubmitFormCallback(sUrl, iFormIndex, "html");
		}
	}
	return true;
}
/**
 * 画面普通提交回调
 * @param sUrl 提交URL
 * @param iFormIndex 提交画面form的索引
 */
function submitFormCallback(sUrl, iFormIndex, sDataType, fSuccess) {
	document.forms[iFormIndex].action = contextPath + sUrl;
	document.forms[iFormIndex].submit();
	addLoading();
}
/**
 * 画面ajax提交回调
 * @param sUrl 提交URL
 * @param iFormIndex 提交画面form的索引
 * @param sDataType 返回数据类型
 * @param fSuccess 提交成功回调函数
 */
function ajaxSubmitFormCallback(sUrl, iFormIndex, sDataType, fSuccess, fCustomAjaxSetting) {
	var ajaxSettings = getAjaxGlobalSettings();
	if (fCustomAjaxSetting != null && fCustomAjaxSetting != undefined) {
		window[fCustomAjaxSetting(ajaxSettings)];
	}
	ajaxSettings.url = contextPath + sUrl;
	ajaxSettings.dataType = sDataType;
	var context = new Object();
	context.dataType = ajaxSettings.dataType;
	if ("html" == sDataType) {
		context.htmlArea = $("#main");
		ajaxSettings.context = context;
	} else {
		context.callBackFunc = fSuccess;
		ajaxSettings.context = context;
	}
	$(document.forms[iFormIndex]).ajaxSubmit(ajaxSettings);
}
/**
 * 画面不刷新提交
 * @param sUrl 提交URL
 * @param sConfMsg 确认消息
 * @param fSuccess 提交成功回调函数
 * @param iFormIndex 提交画面form的索引
 * @returns {Boolean}
 */
function ajaxSubmitForm(sUrl, sConfMsg, fSuccess, iFormIndex, fCustomAjaxSetting) {
	if (submitFlag) {
		return false;
	}
	if(iFormIndex == undefined) {
		iFormIndex = 0;
	}
	if (sConfMsg) {
		layer.confirm(sConfMsg, {icon: 3}, function(index){
			submitFlag = true;
		    layer.close(index);
		    ajaxSubmitFormCallback(sUrl, iFormIndex, "json", fSuccess, fCustomAjaxSetting);
		});
	} else {
		submitFlag = true;
		ajaxSubmitFormCallback(sUrl, iFormIndex, "json", fSuccess, fCustomAjaxSetting);
	}
	return true;
}

/**
 * 页面跳转
 * @param sUrl 跳转URL
 * @param parameters 跳转参数
 */
function movePage(sUrl, parameters) {
	if (self.frameElement) {
		window.location.href = contextPath + sUrl;
	} else {
		if (saveBeforeMovePage != "") {
			var btnFlag = false;
			layer.open({
				cancel : function(index, layero) {
					if (btnFlag == true) {
						btnFlag = false;
						layer.closeAll();
						return false;
					}
					activeMenu(lastActiveMenuIndex);
				},
			    content: saveBeforeMovePage,
			    btn: ['保存并离开', '强制离开', '点错了'],
			    btn1: function(index, layero){ 
			    	window.moveCallBackUrl = sUrl;
					window.moveCallBackParameters = parameters;
			    	window[moveCallBack()];
			    },
			    btn2: function(index) {
			    	movePageCallBack(sUrl, parameters);
			    	btnFlag = true;
			    },
			    btn3: function(index, layero) {
			        layer.closeAll();
					activeMenu(lastActiveMenuIndex);
			    }
			});
		} else {
			$("#main-menu li").each(function(index) {
				if($(this).hasClass("active")) {
					lastActiveMenuIndex = index;
				}
			});
			movePageCallBack(sUrl, parameters);
		}
	}
}

/**
 * 页面跳转回调
 * @param sUrl 跳转URL
 */
function movePageCallBack(sUrl, parameters) {
	saveBeforeMovePage = "";
	var ajaxSettings = getAjaxGlobalSettings();
	ajaxSettings.url = contextPath + sUrl;
	ajaxSettings.dataType = "html";
	ajaxSettings.data = parameters;
	var context = new Object();
	context.dataType = ajaxSettings.dataType;
	context.htmlArea = $("#main");
	ajaxSettings.context = context;
	//$.ajax(ajaxSettings);
}

/**
 * ajax请求数据
 * @param sUrl 请求URL
 * @param oParameters 请求参数
 * @param fSuccess 请求成功回调函数
 * @param sContentType 请求类型(默认from类型)
 * @param sDataType 响应类型(默认json类型)
 */
function ajaxData(sUrl, oParameters, fSuccess, sContentType, sDataType, fCustomAjaxSetting) {
	var ajaxSettings = getAjaxGlobalSettings();
	if (fCustomAjaxSetting != null && fCustomAjaxSetting != undefined) {
		window[fCustomAjaxSetting(ajaxSettings)];
	}
	ajaxSettings.url = contextPath + sUrl;
	ajaxSettings.data = oParameters;
	if (sContentType != null && sContentType != undefined) {
		ajaxSettings.contentType = sContentType;
	}
	if (sDataType != null && sDataType != undefined) {
		ajaxSettings.dataType = sDataType;
	}
	var context = new Object();
	context.dataType = ajaxSettings.dataType
	context.callBackFunc = fSuccess;
	ajaxSettings.context = context;
   //$.ajax(ajaxSettings);
}
/**
 * 下载文件
 * @param sFileId 文件ID
 */
function downloadFile(sFileId,fromCloud) {
	if(getValue(sFileId)!=''){
		window.open(contextPath+"/filedownload?fileId="+sFileId+"&fromCloud="+fromCloud, "_blank");
	}
}
/**
 * 查看文件
 * @param sFileId 文件ID
 * @param sFromCloud 从云端取文件
 */
function viewFile(sFileId, sFromCloud) {
	var url = contextPath + "/fileview?fileId="+sFileId;
	if (sFromCloud) {
		url = url + "&fromCloud="+sFromCloud;
	}
	$("#popwinform").remove();
	var popWinForm = "<form id='popwinform' method='post' action='"+ url +"' target='' style='display:none;'></form>";
	$("body").append(popWinForm);
	var index = layer.open({
	    type: 2,
	    title: "文件浏览&nbsp;<font style='color:#f00;font-size:12px;'>文件处理于预览模式不能进行编辑</font>",
	    content: url,
	    maxmin: false,
	    success: function(layero, index) {
	    	$("#popwinform").remove();
	    }
	});
	layer.full(index);
}
/**
 * 编辑文件
 * @param sFileId 文件ID
 * @param callBack 回调函数
 * @param paraCallBack 回调参数
 * @param sFromCloud 从云端取文件
 */
function editFile(sFileId, callBack, paraCallBack, sFromCloud) {
	var url = contextPath + "/fileedit?fileId="+sFileId;
	if (sFromCloud) {
		url = url + "&fromCloud="+sFromCloud;
	}
	$("#popwinform").remove();
	var popWinForm = "<form id='popwinform' method='post' action='"+ url +"' target='' style='display:none;'></form>";
	$("body").append(popWinForm);
	var o;
	var index = layer.open({
	    type: 2,
	    title: "文件编辑&nbsp;<font style='color:#f00;font-size:12px;'>文件可正常编辑</font>",
	    content: url,
	    maxmin: false,
	    success: function(layero, index) {
	    	o=layero;
	    	var iframeWin = window[layero.find('iframe')[0]['name']];
	    	iframeWin.popCallBack= callBack;
	    	iframeWin.paraCallBack = paraCallBack;
	    	$("#popwinform").remove();
	    },
	    cancel:function(index){
	    	var iframeWin = window[o.find('iframe')[0]['name']];
	    	if(sFileId.indexOf("-")==-1&&getValue(iframeWin.lastId)!=''&&getValue(iframeWin.lastName)!=''){
	    		iframeWin.setLastId();
	    		var data={
	    				'lastId':iframeWin.lastId,
	    				'lastName':iframeWin.lastName,
	    		}
	    		window[callBack(data, paraCallBack)];
	    	}
	    	$("#popwinform").remove();
	    }
	});
	layer.full(index);
}
/**
 * 删除文件
 * @param sFileIds 文件ID(可是多个文件ID:fileIds=1&fileIds=2）
 */
function delFile(sFileIds) {
	ajaxData("/filedel", sFileIds, function() {
		popMsg("删除成功");
	});
}
/**
 * 增加loading遮罩
 */
function addLoading() {
	layer.load(2);
}
/**
 * 删除loading遮罩
 */
function removeLoading() {
	layer.closeAll('loading');
}
/**
 * 弹出消息
 * @param msg 提示信息
 * @param position  显示位置
 */
function popMsg(msg, position){
	if (position == undefined) {
		layer.msg(msg);
	} else {
		layer.msg(msg, {offset:position});
	}
}
/**
 * 弹出警告
 * @param info 提示信息
 */
function popAlert(info){
	layer.alert(info);
}
/**
 * confirm确认画面 
 * sConfMsg：内容  
 * confirmCallBack 回调函数
 * paraCallBack 回调参数
 */
function popConfirm(sConfMsg, confirmCallBack, paraCallBack, cancelCallBack, cancelParaCallBack) {
	layer.confirm(sConfMsg, {icon: 3, title:"系统确认"}, function(index){
		layer.close(index);
		confirmCallBack(paraCallBack);
	}, function(index){
		layer.close(index);
		if (cancelCallBack != undefined) {
			cancelCallBack(cancelParaCallBack);
		}
	});
}
/**
 * 弹出页面
 * @param title 标题
 * @param url 画面地址
 * @param data 画面参数
 * @param width 宽
 * @param height 高
 * @param callBack 回调函数
 * @param paraCallBack 回调参数
 */
function popWin(title, url, data, width, height, callBack, paraCallBack, cancelCallBack) {
	height=setPopWinHeight(height);//设置弹出窗口高度 by hanwei
	var pUrl = contextPath + url;
	$("#popwinform").remove();
	var popWinForm = "<form id='popwinform' method='post' action='"+ pUrl +"' target='' style='display:none;'>";
	if (data != null && data != undefined && data != "") {
		$.each(data, function(name, value){
			popWinForm = popWinForm + "<input type='text' name='"+ name +"' value='"+ value +"'>";
		});
	}
	popWinForm = popWinForm + "</form>";
	$("body").append(popWinForm);
    var index = layer.open({
		type: 2,
	    title: title,
	    area: [width, height],
	    content: pUrl,
	    success: function(layero, index) {
	    	var iframeWin = window[layero.find('iframe')[0]['name']];
	    	iframeWin.popCallBack= callBack;
	    	iframeWin.paraCallBack = paraCallBack;
	    	$("#popwinform").remove();
	    },
		cancel: cancelCallBack
    });
    return index;
}
/**
 * 弹出全屏窗口
 * @param title 标题
 * @param url 画面地址
 * @param data 画面参数
 * @param callBack 回调函数
 * @param paraCallBack 回调参数
 */
function popFullScreen(title, url, data, callBack, paraCallBack) {
	var index = popWin(title, url, data, "100%", "100%", callBack, paraCallBack);
	layer.full(index);
}
/**
 * 指定当前画面的HTML到弹出页面
 * @param areaId 需要弹出的html内容区域的ID
 * @param title 标题
 * @param width 宽
 * @param height 高
 */
function popWinWithHtml(areaId, title, width, height) {
	layer.open({
		type: 1,
		title: title,
		area: [width, height],
		content: $("#"+areaId).html()
	});
}
/**
 * 弹出窗口回调父窗口的函数
 * @param paraWin 弹出窗口返回的参数
 */
function closeWinCallBack(paraWin) {
	var callBack = window.popCallBack;
	var paraCallBack = window.paraCallBack;
	parent.window[callBack(paraWin, paraCallBack)];
	closeWin();
}
/**
 * 关闭当前iframe层
 */
function closeWin() {
	// 先得到当前iframe层的索引
	var index = parent.layer.getFrameIndex(window.name);
	// 执行关闭
	parent.layer.close(index);
}
/**
 * 重置区域
 * @param areaId 重置区域ID
 */
function clearArea(areaId){
	$("input[type='text'],input[type='hidden'],select:not([multiple='multiple']),textarea", $("#" + areaId)).each(function(){
		$(this).val("");
	});
	$("select[multiple='multiple']", $("#" + areaId)).each(function() {
		$("option",$(this)).remove();
	});
	$("input[type='checkbox']:checked", $("#" + areaId)).each(function() {
		$(this).attr("checked", false);
	});
}

/**
 * 刷新table的行index避免提交后台有空行
 * @param tableId
 * @returns {Number}
 */
function refreshTableIndex(tableId) {
	var rowIndex = 0;
	$(("tr"), $("#" + tableId)).each(
		function(index) {
			if (index == 0) {
				return true;
			}
			// 取得原有index
			var orgIndex = $(this).data("index");
			$("input,checkbox,radio,select,textarea", $(this)).each(
				function() {
					var name = $(this).prop("name")
					var newName = name.replace(new RegExp("\\["	+ orgIndex + "\\]", "g"), "[" + rowIndex + "]");
					$(this).prop("name", newName);
				});
			// 设置新的index
			$(this).data("index", rowIndex);
			rowIndex++;
		});
	// 返回最大的index
	return rowIndex;
}

//写入cookie
function SetCookie(name, value) {
	var Days = 10; // 此 cookie 将被保存 30 天
	var exp = new Date();
	exp.setTime(exp.getTime() + Days * 24 * 60 * 60 * 1000);
	document.cookie = name + "=" + encodeURI(value) + ";expires="
			+ exp.toGMTString()+";path=/";
}
// /删除cookie
///删除cookie
function delCookie(name) {
 setCookie2(name, "", -1);  
}
//设置cookie
function setCookie2(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires+";path=/";
}
// 读取cookie
function getCookie(name) {
	var arr = document.cookie
			.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
	if (arr != null)
		return arr[2];
	return null;
}

function base64_encode(str){
    var c1, c2, c3;
    var base64EncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";                
    var i = 0, len= str.length, string = '';

    while (i < len){
            c1 = str.charCodeAt(i++) & 0xff;
            if (i == len){
                    string += base64EncodeChars.charAt(c1 >> 2);
                    string += base64EncodeChars.charAt((c1 & 0x3) << 4);
                    string += "==";
                    break;
            }
            c2 = str.charCodeAt(i++);
            if (i == len){
                    string += base64EncodeChars.charAt(c1 >> 2);
                    string += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
                    string += base64EncodeChars.charAt((c2 & 0xF) << 2);
                    string += "=";
                    break;
            }
            c3 = str.charCodeAt(i++);
            string += base64EncodeChars.charAt(c1 >> 2);
            string += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4));
            string += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
            string += base64EncodeChars.charAt(c3 & 0x3F)
    }
            return string
}
/*
* Javascript base64_decode() base64解密函数
用于解密base64加密的字符串
* 吴先成  www.51-n.com ohcc@163.com QQ:229256237
* @param string str base64加密字符串
* @return string 解密后的字符串
*/
function base64_decode(str){
	if(str==null){
		return;
	}
    var c1, c2, c3, c4;
    var base64DecodeChars = new Array(
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
            -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57,
            58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0,  1,  2,  3,  4,  5,  6,
            7,  8,  9,  10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
            25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
            37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1,
            -1, -1
    );
    var i=0, len = str.length, string = '';

    while (i < len){
            do{
                    c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff]
            } while (
                    i < len && c1 == -1
            );

            if (c1 == -1) break;

            do{
                    c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff]
            } while (
                    i < len && c2 == -1
            );

            if (c2 == -1) break;

            string += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4));

            do{
                    c3 = str.charCodeAt(i++) & 0xff;
                    if (c3 == 61)
                            return string;

                    c3 = base64DecodeChars[c3]
            } while (
                    i < len && c3 == -1
            );

            if (c3 == -1) break;

            string += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2));

            do{
                    c4 = str.charCodeAt(i++) & 0xff;
                    if (c4 == 61) return string;
                    c4 = base64DecodeChars[c4]
            } while (
                    i < len && c4 == -1
            );

            if (c4 == -1) break;

            string += String.fromCharCode(((c3 & 0x03) << 6) | c4)
    }
    return string;
}
//格式化值
function getValue(val) {
	if (val == null || val == "null" || val == undefined || val == "undefined") {
		val = "";
	}
	return val
}

var winWidthwin=0;
var winHeightwin=0;
//var winHeithtMax=620;
function setPopWinHeight(heightpx){//计算弹出窗口高度
	heightpx=heightpx.toLowerCase();
	var highttemp=heightpx.substr(0,heightpx.indexOf("px"));
	if(heightpx.indexOf("px")==-1)	return heightpx;
	var winWidth = 0;
	var winHeight =parseInt(highttemp);
	findDimensions();
	if(winHeight>winHeightwin){
		winHeight=winHeightwin;
	}
	if(winHeightwin==0){
	return heightpx;
	}
	return winHeight+"px";
}
function findDimensions(heightpx) //函数：获取当前IE窗口尺寸 
{ 
	var winWidth=0;
	var winHeight=0;
	
//获取窗口宽度 
if (window.innerWidth) 
winWidth = window.innerWidth; 
else if ((document.body) && (document.body.clientWidth)) 
winWidth = document.body.clientWidth; 
//获取窗口高度 
if (window.innerHeight) 
winHeight = window.innerHeight; 
else if ((document.body) && (document.body.clientHeight)) 
winHeight = document.body.clientHeight; 
//通过深入Document内部对body进行检测，获取窗口大小 
if (document.documentElement && document.documentElement.clientHeight && document.documentElement.clientWidth) 
{ 
winHeight = document.documentElement.clientHeight; 
winWidth = document.documentElement.clientWidth; 
} 
//结果输出至两个文本框 
winWidthwin=winWidth
winHeightwin=winHeight
}

function preLoadJs(script) {
	var s = document.createElement('script');
	s.setAttribute('type','text/javascript');
	s.setAttribute('src',script);
	s.setAttribute('defer', 'defer');
	var head = document.getElementsByTagName('head');
	head[0].appendChild(s);

}
function preLoadImg(url) {
	var img = new Image();
	img.src = url;
}
//需求396
//2016/06/17 需求398 by zhao.hf START
//此处代码merge时需要注意，只需留一个即可
function checkFileSuffix(fileName){
	var checkFile = fileName.substring(fileName.lastIndexOf(".") + 1, fileName.length);
	var approveFiles = $("#approveFilesSuffix").val();
	if(approveFiles == "")
	{
		return false;
	}
	var arrayFiles= new Array();
	var arrayFiles = approveFiles.split(";");
	for(var i = 0;i < arrayFiles.length; i++)
	{
		if(checkFile.toLowerCase() == arrayFiles[i].toLowerCase())
		{
			return true;
		}
	}
	return false;
}
//2016/06/17 需求398 by zhao.hf START
/**
 *校验以startStr开始
 *fan.gy
 */
String.prototype.startWith=function(startStr){
    var reg=new RegExp("^"+startStr);
    return reg.test(this);
}
/**
 * 校验以endStr结尾
 * fan.gy
 */
String.prototype.endWith=function(endStr){
    var reg=new RegExp(endStr+"$");
    return reg.test(this);
}
function refuseBackHome(e){    
    var ev = e || window.event;//获取event对象    
    var obj = ev.target || ev.srcElement;//获取事件源    
    var t = obj.type || obj.getAttribute('type');//获取事件源类型    
    if(ev.keyCode == 8 && ((t != "password" && t != "text" && t != "textarea")||ev.srcElement.readOnly==true)){    
        return false;    
    }    
}

/**
 * 获取table行数
 * @param tableId 只传tableid 不要带#
 * @param findObj 查找区域 比如 tbody等等
 * @param findAttr 查找的数据 tr、td等等
 */
function getTableRowCount(tableId,findObj,findAttr){
	var jqTableId ='#'+tableId;
	var tBody = $(jqTableId).find(findObj);
	if(tBody == undefined || tBody ==null){
		return 0
	}else{
		var rows = tBody.find(findAttr);
		if(rows == undefined || rows ==null){
			return 0;
		}else{
			return rows.length;
		}
	}
}
/**
 * 是否为空
 * @param obj
 * @returns {Boolean}
 */
function isNotEmpty(obj) {
	if(obj == undefined || obj == null || obj.length == 0) {
		return false;
	}
	return true;
}
/**
 * 获取url参数
 */
function GetRequestParam(resUrl) {
	var paramObj = new Object();
	if(isNotEmpty(resUrl)){
		var TransUrl =  decodeURI(resUrl);
		var idex = TransUrl.indexOf("?");
		if(idex != -1) {
			var str = TransUrl.substr(idex);
			if(str !=null && str.length>1){
				str =str.substr(1);
				var params = str.split("&");
				var paramChild=null;
				for(var i = 0; i < params.length; i++) {
					paramChild = params[i].split("=");
					if(isNotEmpty(paramChild)){
						paramObj[paramChild[0]] = unescape(paramChild[1]);
					}
				}
			}
		}
	}
	return paramObj;
}