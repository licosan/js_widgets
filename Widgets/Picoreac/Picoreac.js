/*
 _____
(     \ ____  ___  _____  ____  ____    __    ___ 
|  |   )_  _)/ __)(  _  )(  _ \( ___)  /__\  / __)
|    _/ _)(_( (__  )(_)(  )   / )__)  /(__)\( (__ 
(___)  (____)\___)(_____)(_)\_)(____)(__)(__)\___)
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
window.Widgets.Picoreac = class{
    constructor (options){
        console.log('Picoreac started...');
        this.containers_selector = (typeof(options.reactable)=='undefined') ? '' : '.'+options.reactable ;
        this.init_data();
        this.init_react_elements();
    }

    init_react_elements(){
        this.react_down_elements = {};
        var selector = this.containers_selector+' [pr_get_from]';
        selector    += ','+this.containers_selector+' [pr_sync_with]';
        selector    += ','+this.containers_selector+' [pr_repeat_with]';
        document.querySelectorAll(selector).forEach((el) => {
            if(el.attributes.hasOwnProperty('pr_get_from'))  var varname = el.attributes['pr_get_from'].value;
            else if(el.attributes.hasOwnProperty('pr_sync_with'))  var varname = el.attributes['pr_sync_with'].value;
            else if(el.attributes.hasOwnProperty('pr_repeat_with')) {
                var varname = el.attributes['pr_repeat_with'].value;
                el.style.display='none';
            }
            if(typeof( this.react_down_elements[varname])=='undefined') this.react_down_elements[varname] = [];
            this.react_down_elements[varname].push(el);
        });

        this.react_up_elements = {};

        var selector = this.containers_selector+' [pr_store_to]';
        selector    += ','+this.containers_selector+' [pr_sync_with]';
        document.querySelectorAll(selector).forEach((el) => {
            var varname = el.attributes.hasOwnProperty('pr_store_to') ? el.attributes['pr_store_to'].value :  el.attributes['pr_sync_with'].value;
            if(typeof( this.react_up_elements[varname])=='undefined') this.react_up_elements[varname] = [];
            this.react_up_elements[varname].push(el);
            this.data[varname] =this.get_from_dom(this.data, varname); // First update on start;
            // Need to assign the events below because the proxy get is a lazy fetch , and therefore we'd miss dom to dom updates.
            el.onkeyup = ((e) => { this.data[varname] = this.data[varname]; }); // !! Not as stupid as it looks ;-)
            el.onchange = ((e) => { this.data[varname] = this.data[varname]; }); // !! Not as stupid as it looks ;-)
        });             
    }

    _proxify_down(o, ownVarname){ 
        for(var prop in o) {
            if(typeof(o[prop])=='object')  {
                this._proxify_down(o[prop], ownVarname); // For nested objects, this shall be the root (so don't par prop here)
                o[prop].ownVarname = prop
                o[prop] = this._proxify(o[prop], ownVarname)
            }
        }
    }

    _proxify(o, ownVarname){
        var self = this;
        return(
            new Proxy(o, {
                'ownVarname': ownVarname, // For nested objects, this shall be the root !
                set(o, varname, newval, rcv){ // !! ORDER in here is CRUCIAL !!
                    o.ownVarname = ownVarname; // When triggered from inside sub_object, we need to know our own variable name, so forsee that. 
                    if(typeof(newval)==='object') {
                        var root = ownVarname!='' ? ownVarname : varname;
                        self._proxify_down(newval, root);
                        newval=self._proxify(newval, root);
                    }
                    var result = Reflect.set(o, varname, newval, rcv); // let JS effectively do the assignation first, easier for our logic below.
                    if((rcv.ownVarname!='') && (typeof(o)==='object')){
                        self.update_dom(rcv.ownVarname, self.data[rcv.ownVarname]); // Told you, we'd need our own variable name ;-)
                    } else {
                        self.update_dom(varname, newval);
                    }
                    return(result);
                },
                get(o, varname, rcv){
                    if(typeof(o[varname]) === 'function') {
                        return(Reflect.get(o, varname, rcv)); // Dont break native methods
                    }
                    if((typeof(self.react_up_elements[varname])!='undefined') &&  (typeof(o[varname])!=='object')) {
                        return(self.get_from_dom(o, varname));
                    } else { 
                        return(Reflect.get(o, varname, rcv));
                    }
                },
                deleteProperty(o, prop) {
                    if (prop in o) {
                        delete o[prop];
                        self.update_dom(this.ownVarname, o);
                        return(true);
                    }
                    return(result);
                },
            }) 
        );
    }

    init_data(){ // Data to dom
        this.data = this._proxify({}, '');
    }

    get_from_dom(o, varname){
        for(var el of this.react_up_elements[varname]){               
            if(typeof(el)=='undefined') continue; // Accessing data.x where x is not in dom 
            if((el.tagName.toLowerCase()=='input') && (el.type.toLowerCase()=='checkbox')){
                if(typeof(tmp_arr)=='undefined') var tmp_arr = [];
                var val_at = tmp_arr.indexOf(el.value);
                if((el.checked) && (val_at==-1)) tmp_arr.push(el.value);
                else if((!el.checked) && (val_at>-1)) tmp_arr.splice(val_at,1);                    
            } else if((el.tagName.toLowerCase()=='input') && (el.type.toLowerCase()=='radio')){
                if(typeof(tmp_val)=='undefined') var tmp_val = '';
                if(el.checked) {
                    tmp_val=(el.value);
                    break;
                }
            } else if(typeof(el.value)!='undefined')  return(el.value);                
            else return(el.innerHTML); // not a user input: send back the content                
        }
        // at least one of the dom elements was a checkbox, so we've built an array after scanning all of them
        if(typeof(tmp_arr)!='undefined') return(this._proxify(tmp_arr, varname));
        // at least one of the dom elements was a radio, so we've set the value after scanning all of them
        if(typeof(tmp_val)!='undefined') return(tmp_val);
    }

    update_dom(varname, newval){ 
        if(typeof(this.react_down_elements[varname])=='undefined') return; // Assigning data.x where x is not in dom            
        for(var el of this.react_down_elements[varname]){
            if(el.attributes.hasOwnProperty('pr_repeat_with') && typeof(newval)=='object'){
                const re1 = /\{pr_key_\}/gm; const re2 = /\{pr_prop(\.[\w\.]+)?\}/gm;
                el.style.display=''; el.removeAttribute('pr_repeat_with'); el.setAttribute('pr_inserted','');
                var template = el.outerHTML; 
                el.style.display='none';  el.setAttribute('pr_repeat_with', varname); el.removeAttribute('pr_inserted');
                var par = el.parentElement;
                par.querySelectorAll('[pr_inserted]').forEach((re)=>{re.remove()}); //cleanup inserted ones, 
                for(var key in newval) {
                    if(key == 'ownVarname') continue;
                    var new_node = document.createElement(el.tagName); 
                    var html = template.replace(re1, key);
                    html = html.replace(re2, (match) => {
                        if(match.substr(9,match.length-10)!=''){ // pr_prop.x.y.z
                            var props = match.substr(9,match.length-10).split('.');
                            var acc=newval[key]; 
                            for(var p of props) { acc=acc[p]; }
                            return(acc);
                        } else { // just pr_prop (no dot somthing)
                            return(newval[key]);
                        }
                    }); 
                    el.insertAdjacentElement('afterend', new_node);
                    new_node.outerHTML = html;
                }
            } else {
                if((el.tagName.toLowerCase()=='input') && (el.type.toLowerCase()=='checkbox')){
                    if((typeof(newval)!='undefined') && (typeof(newval.push)!='function')) return;
                    else el.checked = (newval.indexOf(el.value)>-1);
                } else if((el.tagName.toLowerCase()=='input') && (el.type.toLowerCase()=='radio')){
                    el.checked = (el.value == newval);
                } else if(typeof(el.value)=='undefined') el.innerHTML = newval;
                else el.value = newval;
            }
        }
    }
}

