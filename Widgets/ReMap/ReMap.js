/*
      _____          ___  ___
     (     \  ____  (   ) (  )   __    ____ 
     \  |   )( ___) (   \/   )  /__\  (  _ \
      )   _/  )__)  (        ) /(__)\  )___/
     (__)\_) (____) (_/\ /\_ )(__)(__)(__)  
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
window.Widgets.ReMap = class ReMap{
    constructor(map){
        this.map = map;
        return(this.mapit.bind(this));
    }

    mapit(obj){
        var res = [];
        for(var key in obj){
            var record = {};
            for(var target in this.map){
                var recipe = this.map[target];
                if(typeof(recipe)=='string'){
                    var props = recipe.split('.');
                    var acc=obj[key]; 
                    for(var p of props) { acc=acc[p]; }
                    record[target] = acc;
                } else if(typeof(recipe)=='function'){
                    record[target] = recipe(obj[key], obj, key);
                } else console.warning('Wrong type of recipe for '+target+' :'+typeof(recipe));
            }
            res.push(record);
        }
        return(res);
    }
}
