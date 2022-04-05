/*
      _____                       __ 
     (   _ \  _  _  _  _    __   (  )   ____  ___  ____ 
      \ ( ) )( \/ )( \( )  /__\   )(   (_  _)/ __)(_  _)
      / (_) ) \  /  )  (  /(__)\  )(__  _)(_ \__ \  )(  
     (_____/  (__) (_)\_)(__)(__)(____)(____)(___/ (__) 
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
window.Widgets.DynaList = class{
    constructor (options){ 
        this.options = options;
        this.element = document.createElement('ul');
        this.element.classList.add(this.options.class);
        this.element.id = this.options.listid;
        this.element.innerHTML = '<li pr_repeat_with="dynalist_'+this.options.listid+'" style="display: none;" item_id="{pr_prop.'+options.entry_id+'}">{pr_prop.'+options.entry_label+'}</li>';
        this.container = null;
        if(options.hasOwnProperty('container')) {
            this.container=options.container;
            this.containerClass = this.options.listid+'_container';
            this.container.className = this.containerClass
            options.selector = '.'+this.containerClass;
        } else if(options.hasOwnProperty('selector')) this.container = document.querySelector(options.selector);
        if(this.container == null) {
            console.warn('Could not instantiate DynaList on selector'+options.selector+' not found!');
            return(null);
        }
        this.container.innerHTML = '';
        this.container.append(this.element);
        this.reactable = new Widget('Picoreac',{'reactable': options.selector});
        // TODO: window[options.source] only works for global vars...find a more flexible mechanism (good luck to myself)
        if(typeof(options.source)=='object') this.reactable.data['dynalist_'+this.options.listid] = options.source;
        else if(typeof(options.source)=='string') this.reactable.data['dynalist_'+this.options.listid] = window[options.source];
        this.data = this.reactable.data['dynalist_'+this.options.listid];
    }

    refresh(){
        this.data = this.data;
    }
}


