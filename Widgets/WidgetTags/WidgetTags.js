/* 
 _       __                               ______
(  \    /  )____  ____    ___  ____  ____(__  __)__    ___  ___ 
 \  \/\/  /(_  _)(  _ \  / __)( ___)(_  _)  )(  /__\  / __)/ __)
  )      (  _)(_  )(_) )( (_-. )__)   )(    )( /(__)\( (_-.\__ \
 (___/\___)(____)(____/  \___/(____) (__)  (__)__)(__)\___/(___/
                                                         By Nike
                                                  
This file is part of Widgets by Nike from Nicsys (info@@nicsys.eu).
Widgets is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, 
either version 3 of the License, or (at your option) any later version.
Widgets is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.
Get your copy of the GNU General Public License at <https://www.gnu.org/licenses/>. 
*/
'use strict'
window.Widgets.WidgetTags = class{
    constructor (options){
        this.widget_instances = {}; 
        this.scan('body');
    }
    scan(parent_selector){
        var nodes = document.querySelectorAll(parent_selector+' widget');
        for(var node of nodes){
            var type = node.getAttribute('type');
            var self = this;
            Widgets.loadWidget(type, function() {
                var params= { 'container': node };
                for(var att of node.attributes) if(att.nodeName!='type') params[att.nodeName] = att.nodeValue;             
                var widget_instance =  new Widget(type, params)
                self.widget_instances[widget_instance.containerID] = widget_instance;
            });
        }
    }
}
