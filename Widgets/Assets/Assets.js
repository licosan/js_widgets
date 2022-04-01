/*
    __                                 _____
   /  \    ___  ___  ____  ____  ___  /  ___)____  _____  ____  ____ 
  / __ \  / __)/ __)( ___)(_  _)/ __)(  /__ (_  _)(  _  )(  _ \( ___)
 / (__) \ \__ \\__ \ )__)   )(  \__ \ \__  \  )(   )(_)(  )   / )__) 
(___)(___)(___/(___/(____) (__) (___/(______)(__) (_____)(_)\_)(____)
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
window.Widgets.AssetsStore = { 'images':{}, 'css':{}, 'html':{} };
window.Widgets.Assets = class Assets{
    static Path = Widgets.Path+'../Assets/';

    static GetImage(name){
        if(window.Widgets.AssetsStore.images.hasOwnProperty(name)) { // Image known
            if(window.Widgets.AssetsStore.images[name].getRootNode()==window.Widgets.AssetsStore.images[name]) { // zombie => use it !
                return(window.Widgets.AssetsStore.images[name]); 
            } else { // Already used in dom => clone for second use
                return(window.Widgets.AssetsStore.images[name].cloneNode()); 
            }
        }
        // Not created => create & load...
        var id = crypto.randomUUID();
        var node = document.createElement('img');
        node.src = Assets.Path+'images/'+name+'?'+id;
        window.Widgets.AssetsStore.images[name] = node;
        return(node);
    }

    static appendImage(name, selector){
        document.querySelector(selector).append(Assets.GetImage(name));
    }

    static prependImage(name, selector){
        document.querySelector(selector).prepend(Assets.GetImage(name));
    }

    static LoadCss(name){
        if(window.Widgets.AssetsStore.css.hasOwnProperty(name)) return; 
        var node = document.createElement('link');
        node.setAttribute('rel','stylesheet');
        node.setAttribute('type','text/css');
        if(!name.endsWith('.css')) name+='.css';
        node.setAttribute('href',Assets.Path+'css/'+name+'?'+crypto.randomUUID());
        document.head.append(node);
        window.Widgets.AssetsStore.css[name] = node;
        return(node);
    }

    static LoadHtml(name, callback){
        if(!name.endsWith('.html')) name+='.html';
        fetch(Assets.Path+'html/'+name+'?'+crypto.randomUUID())
        .then(callback)
    }

    static replaceHtml(name, selector){
        Assets.LoadHtml(name, function(response){      
            if(response.ok) document.querySelector(selector).innerHTML = response.text();
            else console.error(response.status+' while loading asset:'+name);
        });
    }

    static appendHtml(name, selector, element='div'){
        var node = document.createElement(element);
        Assets.LoadHtml(name, function(html){
            node.innerHTML = html;
        });
        document.querySelector(selector).append(node);
    }

    static prependHtml(name, selector, element='div'){
        var node = document.createElement(element);
        Assets.LoadHtml(name, function(html){
            node.innerHTML = html;
        });     
        document.querySelector(selector).prepend(node);
    }    
}

// TODO :
// Internal indexing on names is not good
// Allow subfolders under css, images & html
