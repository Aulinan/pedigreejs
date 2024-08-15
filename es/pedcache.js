/**
/* © 2023 University of Cambridge
/* SPDX-FileCopyrightText: 2023 University of Cambridge
/* SPDX-License-Identifier: GPL-3.0-or-later
**/

//store a history of pedigree

let max_limit = 25;
let dict_cache = {};

// test if browser storage is supported
function has_browser_storage(opts) {
	try {
		if(opts.store_type === 'array')
			return false;

		if(opts.store_type !== 'local' && opts.store_type !== 'session' && opts.store_type !== undefined)
			return false;

		let mod = 'test';
		localStorage.setItem(mod, mod);
		localStorage.removeItem(mod);
		return true;
	} catch(e) {
		return false;
	}
}

function get_prefix(opts,cache) {
	if (cache === opts.disease) 
		return "PEDIGREE_"+opts.btn_target+"_";
	return "PEDIGREE_"+opts.disease_target+"_"
}

// use dict_cache to store cache as an array
function get_arr(opts,cache) {
	return dict_cache[get_prefix(opts,cache)];
}

function get_browser_store(opts, item) {
	if(opts.store_type === 'local')
		return localStorage.getItem(item);
	else
		return sessionStorage.getItem(item);
}

function set_browser_store(opts, name, item) {
	if(opts.store_type === 'local')
		return localStorage.setItem(name, item);
	else
		return sessionStorage.setItem(name, item);
}

// clear all storage items
function clear_browser_store(opts) {
	if(opts.store_type === 'local')
		return localStorage.clear();
	else
		return sessionStorage.clear();
}

// remove all storage items with keys that have the pedigree history prefix
export function clear_pedigree_data(opts,cache) {
	let prefix = get_prefix(opts,cache);
	let store = (opts.store_type === 'local' ? localStorage : sessionStorage);
	let items = [];
	for(let i = 0; i < store.length; i++){
		if(store.key(i).indexOf(prefix) === 0)
			items.push(store.key(i));
	}
	for(let i = 0; i < items.length; i++)
		store.removeItem(items[i]);
}

export function get_count(opts,cache) {
	let count;
	if (has_browser_storage(opts))
		count = get_browser_store(opts, get_prefix(opts)+'COUNT');
	else
		count = dict_cache[get_prefix(opts,cache)+'COUNT'];
	if(count !== null && count !== undefined)
		return count;
	return 0;
}

function set_count(opts, count,cache) {
	if (has_browser_storage(opts))
		set_browser_store(opts, get_prefix(opts,cache)+'COUNT', count);
	else
		dict_cache[get_prefix(opts,cache)+'COUNT'] = count;
}

export function init_cache(opts, cache) {
	if(!cache)
		return;
	let count = get_count(opts,cache);
	if (has_browser_storage(opts)) {   // local storage
		set_browser_store(opts, get_prefix(opts,cache)+count, JSON.stringify(cache));
	} else {   // TODO :: array cache
		console.warn('Local storage not found/supported for this browser!', opts.store_type);
		max_limit = 500;
		if(get_arr(opts,cache) === undefined)
			dict_cache[get_prefix(opts,cache)] = [];
		get_arr(opts,cache).push(JSON.stringify(cache));
	}
	if(count < max_limit)
		count++;
	else
		count = 0;
	set_count(opts, count,cache);
}

export function nstore(opts,cache) {
	if(has_browser_storage(opts)) {
		for(let i=max_limit; i>0; i--) {
			if(get_browser_store(opts, get_prefix(opts,cache)+(i-1)) !== null)
				return i;
		}
	} else {
		return (get_arr(opts) && get_arr(opts).length > 0 ? get_arr(opts).length : -1);
	}
	return -1;
}

export function current(opts,cache) {
	let current = get_count(opts,cache)-1;
	if(current === -1)
		current = max_limit;
	if(has_browser_storage(opts))
		return JSON.parse(get_browser_store(opts, get_prefix(opts,cache)+current));
	else if(get_arr(opts,cache))
		return JSON.parse(get_arr(opts,cache)[current]);
}

export function last(opts,cache) {
	if(has_browser_storage(opts)) {
		for(let i=max_limit; i>0; i--) {
			let it = get_browser_store(opts, get_prefix(opts,cache)+(i-1));
			if(it !== null) {
				set_count(opts, i,cache);
				return JSON.parse(it);
			}
		}
	} else {
		let arr = get_arr(opts,cache);
		if(arr)
			return JSON.parse(arr(arr.length-1));
	}
	return undefined;
}

export function previous(opts, previous,cache) {
	if(previous === undefined)
		previous = get_count(opts) - 2;

	if(previous < 0) {
		let nst = nstore(opts,cache);
		if(nst < max_limit)
			previous = nst - 1;
		else
			previous = max_limit - 1;
	}
	set_count(opts, previous + 1);
	if(has_browser_storage(opts))
		return JSON.parse(get_browser_store(opts, get_prefix(opts,cache)+previous));
	else
		return JSON.parse(get_arr(opts,cache)[previous]);
}

export function next(opts, next,cache) {
	if(next === undefined)
		next = get_count(opts,cache);
	if(next >= max_limit)
		next = 0;

	set_count(opts, parseInt(next) + 1);
	if(has_browser_storage(opts))
		return JSON.parse(get_browser_store(opts, get_prefix(opts,cache)+next));
	else
		return JSON.parse(get_arr(opts,cache)[next]);
}

export function clear(opts) {
	if(has_browser_storage(opts))
		clear_browser_store(opts);
	dict_cache = {};
}

// zoom - store translation coords
export function setposition(opts, x, y, zoom,cache) {
	if(has_browser_storage(opts)) {
		let store = (opts.store_type === 'local' ? localStorage : sessionStorage);
		if(x) {
			set_browser_store(opts, get_prefix(opts,cache)+'_X', x);
			set_browser_store(opts, get_prefix(opts,cache)+'_Y', y);
		} else {
			store.removeItem(get_prefix(opts,cache)+'_X');
			store.removeItem(get_prefix(opts,cache)+'_Y');
		}

		let zoomName = get_prefix(opts,cache)+'_ZOOM';
		if(zoom)
			set_browser_store(opts, zoomName, zoom);
		else
			store.removeItem(zoomName);
	} else {
		//TODO
	}
}

export function getposition(opts,cache) {
	if(!has_browser_storage(opts) ||
		(localStorage.getItem(get_prefix(opts,cache)+'_X') === null &&
		 sessionStorage.getItem(get_prefix(opts,cache)+'_X') === null))
		return [null, null];
	let pos = [ parseInt(get_browser_store(opts, get_prefix(opts,cache)+'_X')),
				parseInt(get_browser_store(opts, get_prefix(opts,cache)+'_Y')) ];
	if(get_browser_store(opts, get_prefix(opts,cache)+'_ZOOM') !== null)
		pos.push(parseFloat(get_browser_store(opts, get_prefix(opts,cache)+'_ZOOM')));
	return pos;
}
