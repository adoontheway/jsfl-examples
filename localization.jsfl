﻿confirm("请选择需要导入的配置文件");
//=======打开文件的一系列流程========//
var uri = fl.browseForFileURL("open","选择文件");
//取得库里面的所有条目：无筛选(可以进行筛选只需要导出为Sprite或者MC的组件)
var list = fl.getDocumentDOM().library.items;
//fl.trace(uri);
var langUri = uri;
langUri = uri.split("/");
langUri[langUri.length-1]="cn.xml";
langUri = langUri.join("/");
//fl.trace(langUri);
var langObj={};
//加载默认的语言配置文件
if(FLfile.exists(langUri))
{
	var lang = FLfile.read(langUri);
	lang = XML(lang);
	if(lang!=null)
	{
		parseLang();
	}
}
//载入模块语言配置文件.lang
if(uri == null)
{
	//fl.trace("没有选择配置文件");
}else if(uri.indexOf(".lang") == -1)
{
	alert("文件格式不对");
}else if(FLfile.exists(uri))
{
	var context = FLfile.read(uri);
	context = XML(context);
	if(context!=null)
	{
		parse();
	}
}
function parseLang()
{
	//fl.trace("parsing language configs...");
	var langChildren = lang.elements();
	var langLen = langChildren.length();
	for(p = 0; p < langLen; p++)
	{
		//fl.trace("key : " + langChildren[p].@key + ", value : " + langChildren[p].@value);
		langObj[langChildren[p].@key] = langChildren[p].@value;
	}
}
function parse()
{
	//取得配置文件里面的element
	var children = context.elements();
	var len = children.length();
	for(j = 0; j < len; j++)
	{
		//取得具体的面板
		var panel = getPanelByName(children[j].@panel);
		var target = getComponentByName(panel, children[j].@name);
		if(target == null)
		{
			//fl.trace("@@@@@@@@@@target "+children[j].@panel+"."+children[j].@name+" is not exsits@@@@@@@@@@@");
		}else if(target.parameters)
		{
			var flag = false;
			var textUpdate = false;
			var para_len = target.parameters.length;
			//遍历他的parameters看看有没有key这个字段，有的话更新，没有的话插入
			for(o = 0; o < para_len; o++)
			{
				if(target.parameters[o].name=="key")
				{
					target.parameters[o].value=String(children[j].@key);
					flag = true;
					//fl.trace("update key to "+children[j].@key);
				}
				
				if(target.parameters[o].name == "internationValue" || 
							target.parameters[o].name == "label" ||
									target.parameters[o].name == "text")
				{
					//fl.trace("update internationValue to "+langObj[children[j].@key]);
					target.parameters[o].value=langObj[children[j].@key];
				}
			}
			if(flag == false)
			{
				target.parameters[0].insertItem(0,"key",String(children[j].@key),"String");
				//fl.trace("insert key "+children[j].@key);
			}
			flag = false;
			//fl.trace("********target update finished:"+target+"@_@"+children[j].@panel+"."+children[j].@name+"*******");
		}
		
	}
	
}
function getComponentByName($tempPanel,$componentName)
{
	//fl.trace("getComponentByName======"+$tempPanel+" : "+$tempPanel.name+" ; "+$componentName);
	//拿到的面板有可能是elment也有可能是item
	if($tempPanel.itemType == "movie clip")
	{
		var $target = getSubComponent($tempPanel,[$componentName]);
		//fl.trace("return $target=========="+$target);
	}else
	{
		$target = getSubComponent($tempPanel.libraryItem,[$componentName]);
		//fl.trace("return (l)$target======"+$target);
	}
	return $target;
}
function getPanelByName(str)
{
	//fl.trace("getPanelByName========"+str);
	if(str.length() == 0)
	{ 
		return null;
	}
	
	var arr = str.split(".");
	
	var rootPanel = getRootPanel(arr[0]);
	//如果用.分开来的数组长度唯1，说明是库里面的根面板
	if(arr.length == 1)
	{
		//fl.trace("return rootPanel========"+rootPanel);
		return rootPanel;
	}else
	{
		//否则的话，递归取得子面板
		arr.shift();
		var subPanel = getSubComponent(rootPanel,arr);
		//fl.trace("return subPanel=======" + subPanel);
		return subPanel;
	}
}
function getRootPanel(rootname)
{
	//fl.trace("getRootPanel======="+rootname);
	//根面板都是库里面的根
	for(i=0; i < list.length; i++)
	{
		if(list[i].name == rootname)
		{
			return list[i];
		}
	}
	return null;
}
//这个方法是用来取得子面板或者子组件的，子组件是item类型而子面板是element类型，所以要进行区别
function getSubComponent(tempPanel, tempArr)
{
	//fl.trace("getSubComponent========"+tempPanel.name +"  :  "+tempPanel.itemType+" : "+tempArr);
	//取得子元件的所有层并进行遍历
	var layers = tempPanel.timeline.layers;
	var $len1 = layers.length;
	
	for(l = 0; l < $len1; l++){
		
		//只取第一帧进行遍历，因为基本上组件都只有第一帧，如果后续有多帧的话这里加上一层遍历即可
		var frame = layers[l].frames[0];
		
		//取得帧上的所有子元素并进行遍历
		var elements = frame.elements;
		var ele_len = elements.length;
		var _element;
		for(k=0; k<ele_len; k++){
			_element = elements[k];
			if(_element.elementType != "instance") continue;
			//fl.trace("loop======== k : "+k+" , _element :  name : "+_element.name);
			//this is for element only
			if(_element.name==tempArr[0])
			{
				if(tempArr.length==1)
				{
					if(_element.elementType)
					{
						finded = true;
						//fl.trace("return _element======"+_element+" : "+_element.name + " finded : "+finded);
						target_element = _element;
						break;
					}
				}else
				{
					tempArr.shift();
					//fl.trace("dig in _element======"+_element+" : "+_element.name);
					//如果遍历到这里组件还有包含层的话继续进行下层遍历
					getSubComponent(_element.libraryItem,tempArr);
				}
			}
			//fl.trace("Sublooping .....");
		}
		//fl.trace("Looping....");
	}
	//fl.trace("Break out... target_element : "+target_element);
	return target_element;
}


