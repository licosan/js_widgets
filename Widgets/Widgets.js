/*
 _       __ 
(  \    /  )____  ____    ___  ____  ____  ___ 
 \  \/\/  /(_  _)(  _ \  / __)( ___)(_  _)/ __)
  )      (  _)(_  )(_) )( (_-. )__)   )(  \__ \
 (___/\___)(____)(____/  \___/(____) (__) (___/
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
window.Widgets={};
class Widgets{
    static Path = '/Widgets/';
    static Dependencies;
    static DependenciesLoader = false;
    static ProgBar = false;
    constructor(options){
        console.log('constructing...');
    }
    static resolve_deps(imps, deps){
        var leveler = (levels, root, l, trail=[]) => { 
            if(deps.hasOwnProperty(root)){
                for(var dep of deps[root]){
                    if(!levels.hasOwnProperty(dep)) levels[dep] = -1;
                    if(levels[dep]<l) levels[dep]=l;
                    if(trail.indexOf(dep)<0){ // detect circular dependency to avoid infinite recursion
                        trail.push(dep);
                        leveler(levels, dep , l+1, trail);
                    } else console.error('Circular depencency with '+dep);
                }
            }
        }
        var levels={};
        // Build the dep tree of things we need, noting the depth.
        for(var imp of imps) { leveler(levels, imp, 1); } // Level starts at 1, zero reserved for roots
        // Add requested imports as last, unless already with higher priority (tree shaking)
        for(var imp of imps) { if(!levels.hasOwnProperty(imp)) levels[imp] = 0; }
        // Group by levels, as their loading can be paralellized (whereas on level must wait on the prev. one)        
        var name, level; var by_level = {};
        for([name, level] of  Object.entries(levels)) { 
            if(!by_level.hasOwnProperty(level)) { by_level[level]=[]; } 
            by_level[level].push(name);
        }
        return(by_level);
    }

    static Import(app, required_widgets, import_id_prfx, base_path = './'){ // Will start with real import (_import) only when / if dependencies are loaded.
        var Current_import_chain = {};
        if(Widgets.DependenciesLoader===false) {
            Widgets.DependenciesLoader = new Promise((resolve, reject) => {
                fetch(Widgets.Path+'WidgetsDependencies.json', { headers: { "Content-Type": "application/json; charset=utf-8" }})
                .then(res => res.json())
                .then(response => { Widgets.Dependencies = response; resolve(); })
                .catch(err => { console.error('Error loading dependencies'); Widgets.Dependencies = {}; reject(); });
            });            
        }  
        // Prepare a synchronous chain of asynchronous loads
        Widgets.DependenciesLoader.then(()=>{ 
            var by_level_imps = Widgets.resolve_deps(required_widgets, Widgets.Dependencies); 
            var total = Object.values(by_level_imps).reduce((tot,v)=> (tot+v.length), 0);
            if(app!='') total++;
            if( Widgets.ProgBar === false){
                Widgets.ProgBar = new Widget('ProgressBar',{'id':import_id_prfx, 'total': total}); 
            } else {
                Widgets.ProgBar.options.total += total;
            }
            for(var key in Object.getOwnPropertyNames(by_level_imps).sort().reverse()){ 
                var idx = (app!='') ? parseInt(key)+1 : key;
               Current_import_chain[import_id_prfx+'_'+idx] = {'imps': by_level_imps[key], 'path':Widgets.Path };
            }
            if(app!='') { Current_import_chain[import_id_prfx+'_0'] = {'imps': [app], 'path': base_path}; }
            var first_import_id = import_id_prfx+'_'+idx;            
            document.addEventListener('AllWidgetsReady', function(evt) { // Next async imports in the sync chain
                var next_imp_nb = evt.detail.substr(0,evt.detail.lastIndexOf('_')+1)+(parseInt(evt.detail.substr(evt.detail.lastIndexOf('_')+1))-1);
                if(evt.detail != import_id_prfx+'_0'){
                    if(Current_import_chain.hasOwnProperty(next_imp_nb)) {
                        Widgets._import(Current_import_chain[next_imp_nb]['imps'], next_imp_nb,Current_import_chain[next_imp_nb]['path']);
                    }  
                } 
            });
            Widgets._import(Current_import_chain[first_import_id]['imps'], first_import_id,Current_import_chain[first_import_id]['path']); // Start the synchronous chain
        });
    }

    static loadScript = (src) => { 
        return new Promise((resolve, reject) => {
            const script = document.createElement('script')
            script.type = 'text/javascript'
            script.onload = resolve
            script.onerror = reject
            script.src = src
            document.head.append(script)
        });
    }

    static _import(names, importID, basePath){ // Here, all imports are made asynchronously, in parallel.
        var all_loaded = true;
        var nb_left = names.length;
        for(var name of names){ 
            if(!(name in window.Widgets)) {
                // Remember that the proper class was explicitely assigned to window.Widgets by the widget code itself.
                // This is because classes declared with class no longer end up global in window, but we still need to access them from class-name String.
                all_loaded = false;
                Widgets.loadScript(basePath+name+'/'+name+'.js?'+importID)
                    .then((result) => { 
                                        var script_name= result.currentTarget.src; 
                                        var widget_name = script_name.substr(script_name.lastIndexOf('/')+1,script_name.lastIndexOf('.')-script_name.lastIndexOf('/')-1);
                                        document.dispatchEvent(new CustomEvent('Widget'+widget_name+'Ready', { 'detail': importID}));
                                        Widgets.ProgBar.Increment();
                                        nb_left--;
                                        if(nb_left<=0){ 
                                            document.dispatchEvent(new CustomEvent("AllWidgetsReady", { 'detail': importID })); 
                                        }
                    })
                    .catch((error) => {    
                                            if((typeof(error)!='undefined') && (typeof(error.currentTarget)!='undefined')){
                                                var script_name= error.currentTarget.src;
                                                var widget_name = script_name.substr(script_name.lastIndexOf('/')+1,script_name.lastIndexOf('.')-script_name.lastIndexOf('/')-1);
                                                console.error('Could not import Widget '+widget_name);
                                            }
                                            nb_left--;
                    });
            }
        }
        if(all_loaded){
            for(var name of names) document.dispatchEvent(new CustomEvent('Widget'+name+'Ready', { 'detail':importID }));
            document.dispatchEvent(new CustomEvent("AllWidgetsReady", { 'detail':importID }));
        }
    }

    static loadApp(app_name, app_path, app_dependencies, callback){
        var myImportID = crypto.randomUUID(); 
        Widgets.Import(app_name, app_dependencies, myImportID, app_path);
        if(typeof(callback)=='function'){
            document.addEventListener('AllWidgetsReady', function(evt) { 
                if(evt.detail==myImportID+'_0') callback();
            });
        }
        return(myImportID);
    }

    static loadWidgets(names, callback){
        var myImportID = crypto.randomUUID(); 
        Widgets.Import('', names, myImportID);
        if(typeof(callback)=='function'){
            document.addEventListener('AllWidgetsReady', function(evt) { 
                if(evt.detail==myImportID+'_0') callback();
            });
        }
        return(myImportID);
    }

    static loadWidget(name, callback){
        var myImportID = crypto.randomUUID();
        Widgets.Import('', [name], myImportID);
        if(typeof(callback)=='function'){
            document.addEventListener('Widget'+name+'Ready', function(evt) { 
                callback();
            });
        }
        return(myImportID);
    }
}

window.Widgets.ProgressBar = class ProgressBar{ // Defined as normal widget, but inline here because chicken & egg problem.
    constructor(options){
        if(document.getElementById('WidgetsPB_'+options.id)!=null) return;
        this.options = {...options, ...{ 'width': '25%', 'height': '15px', 'class': 'widgets_pb', }};
        this.prog = 0;
        const pb = document.createElement('div'); // Outside div
        pb.classList.add(this.options.class);
        pb.id = 'WidgetsPB_'+this.options.id;
        pb.style.top = this.options.top;
        pb.style.width = this.options.width;
        pb.style.height = this.options.height;
        pb.style.margin = 'auto';
        pb.style.textAlign = 'left';
        pb.style.border = '1px solid black';
        const bar = document.createElement('div'); 
        bar.id = 'WidgetsPB_Bar_'+this.options.id;
        bar.style.height = Math.round(parseInt(this.options.height)/2)+this.options.height.replace(/\d+/,'');
        bar.style.margin = Math.round(parseInt(this.options.height)/4)+this.options.height.replace(/\d+/,'');
        bar.style.width = '5px'; 
        bar.style.backgroundColor = 'blue';
        pb.appendChild(bar);
        document.body.prepend(pb);
    }
    
    Update(prog=false){
        if(document.getElementById('WidgetsPB_'+this.options.id)==null) return;
        if(prog!==false) this.prog = prog;
        var pb = document.getElementById('WidgetsPB_'+this.options.id);
        var bar = document.getElementById('WidgetsPB_Bar_'+this.options.id);
        var wmax = pb.offsetWidth - (2*parseInt(bar.style.margin));
        var w = Math.round((wmax/this.options.total)*this.prog);
        bar.style.width = w+'px';
    }

    Increment(){
        this.prog++;
        this.Update();
        if(this.prog >= this.options.total) this.Destroy();
    }

    Destroy(){
        if(document.getElementById('WidgetsPB_'+this.options.id)==null) return;
        document.getElementById('WidgetsPB_'+this.options.id).remove();
    }
}

const Widget = new Proxy(function(name, args){}, { // fake object, just to intercept "new Widget('whatever',...)"
    construct(o, args){
        var name = args.shift();
        if(!(name in window.Widgets)) {
            console.error('Widget '+name+' not imported !');
            return({});
        }
        return(new window.Widgets[name](...args));
    }
});





